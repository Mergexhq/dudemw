/**
 * export-snapshot.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * "Snapshot & Batch" pattern for deterministic order export / label generation.
 *
 * Core guarantees:
 *  1. CUTOFF TIMESTAMP  — every query is bounded by a `cutoffAt` DateTime that
 *     is captured ONCE on the client before the request is sent.  Any order
 *     created AFTER that instant is invisible to the current job.
 *
 *  2. CURSOR PAGINATION — no OFFSET arithmetic.  We walk the result set with
 *     a composite (created_at, id) keyset cursor so the page boundary is
 *     stable even if new rows arrive mid-export.
 *
 *  3. PESSIMISTIC LOCK  — when we also need to update `order_status` we wrap
 *     the SELECT + UPDATE inside a single serializable transaction and use
 *     `SELECT … FOR UPDATE SKIP LOCKED` so no concurrent process can touch
 *     those rows while we are building the file.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import prisma from '@/lib/db';

// ── Types ────────────────────────────────────────────────────────────────────

export interface SnapshotCursor {
  lastCreatedAt: Date | null;
  lastId:        string | null;
}

export interface SnapshotPage {
  orders:     OrderRow[];
  nextCursor: SnapshotCursor | null; // null → no more pages
  total:      number;
}

export interface OrderRow {
  id:                      string;
  order_number:            string | null;
  order_status:            string | null;
  payment_status:          string | null;
  total_amount:            string;
  shipping_amount:         string | null;
  customer_name_snapshot:  string | null;
  customer_phone_snapshot: string | null;
  customer_email_snapshot: string | null;
  shipping_address:        unknown;
  shipping_provider:       string | null;
  shipping_tracking_number:string | null;
  created_at:              Date | null;
  order_items: Array<{
    id:       string;
    quantity: number;
    price:    string;
    product_variants: {
      id:    string;
      sku:   string | null;
      size:  string | null;
      color: string | null;
      product: { id: string; name: string } | null;
    } | null;
  }>;
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const BATCH_SIZE = 50;

// ── Read-only export (CSV / Excel) ────────────────────────────────────────────

/**
 * fetchSnapshotPage — NO locking, NO status mutation.
 *
 * Returns one page of orders created AT OR BEFORE `cutoffAt`.
 * Pass the `nextCursor` from the previous page to advance; null to start fresh.
 */
export async function fetchSnapshotPage(
  cutoffAt:     Date,
  cursor:       SnapshotCursor | null,
  statusFilter: string[] = ['pending', 'processing'],
): Promise<SnapshotPage> {
  // Composite keyset pagination:
  //   Page 1: WHERE created_at <= $cutoff AND status IN (...)
  //   Page N: …AND (created_at > $lastAt OR (created_at = $lastAt AND id > $lastId))
  const rows = await prisma.orders.findMany({
    where: {
      order_status: { in: statusFilter },
      created_at:   { lte: cutoffAt },
      ...(cursor?.lastCreatedAt && cursor?.lastId
        ? {
            OR: [
              { created_at: { gt: cursor.lastCreatedAt } },
              {
                AND: [
                  { created_at: { equals: cursor.lastCreatedAt } },
                  { id:         { gt: cursor.lastId }            },
                ],
              },
            ],
          }
        : {}),
    },
    orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
    take:    BATCH_SIZE,
    include: {
      order_items: {
        include: {
          product_variants: {
            include: { product: true },
          },
        },
      },
    },
  }) as unknown as OrderRow[];

  const last = rows[rows.length - 1] ?? null;

  return {
    orders:     rows,
    total:      rows.length,
    nextCursor: last
      ? { lastCreatedAt: last.created_at, lastId: last.id }
      : null,
  };
}

// ── Locking export (Label generation) ─────────────────────────────────────────

/**
 * fetchAndLockSnapshotPage — uses SELECT … FOR UPDATE SKIP LOCKED inside
 * a SERIALIZABLE transaction.
 *
 * Flow inside a single transaction:
 *   1. Lock the next page of rows (FOR UPDATE SKIP LOCKED)
 *   2. UPDATE order_status → `newStatus` on those exact rows
 *   3. Re-fetch full data (with relations) while locks still held
 *   4. Commit → locks released
 *
 * Any concurrent job will SKIP the locked rows and get the next available
 * batch, preventing double-processing with zero blocking.
 */
export async function fetchAndLockSnapshotPage(
  cutoffAt:     Date,
  cursor:       SnapshotCursor | null,
  newStatus:    string   = 'labels_generated',
  statusFilter: string[] = ['pending'],
): Promise<SnapshotPage> {

  const result = await prisma.$transaction(async (tx) => {

    // ── 1. Lock the page ───────────────────────────────────────────────────
    let lockedIds: string[];

    if (!cursor?.lastCreatedAt || !cursor?.lastId) {
      const locked = await tx.$queryRaw<{ id: string }[]>`
        SELECT id
        FROM   orders
        WHERE  created_at   <= ${cutoffAt}
          AND  order_status  = ANY(${statusFilter}::text[])
        ORDER  BY created_at ASC, id ASC
        LIMIT  ${BATCH_SIZE}
        FOR UPDATE SKIP LOCKED
      `;
      lockedIds = locked.map((r) => r.id);
    } else {
      const locked = await tx.$queryRaw<{ id: string }[]>`
        SELECT id
        FROM   orders
        WHERE  created_at   <= ${cutoffAt}
          AND  order_status  = ANY(${statusFilter}::text[])
          AND (
               created_at >  ${cursor.lastCreatedAt}
            OR (created_at = ${cursor.lastCreatedAt} AND id > ${cursor.lastId})
          )
        ORDER  BY created_at ASC, id ASC
        LIMIT  ${BATCH_SIZE}
        FOR UPDATE SKIP LOCKED
      `;
      lockedIds = locked.map((r) => r.id);
    }

    if (lockedIds.length === 0) {
      return { orders: [] as OrderRow[], nextCursor: null };
    }

    // ── 2. Atomically update status (same tx, same locks) ─────────────────
    await tx.$executeRaw`
      UPDATE orders
      SET    order_status = ${newStatus},
             updated_at   = NOW()
      WHERE  id = ANY(${lockedIds}::uuid[])
    `;

    // ── 3. Fetch full data for PDF generation ─────────────────────────────
    const orders = await tx.orders.findMany({
      where:   { id: { in: lockedIds } },
      orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
      include: {
        order_items: {
          include: {
            product_variants: {
              include: { product: true },
            },
          },
        },
      },
    }) as unknown as OrderRow[];

    const last = orders[orders.length - 1] ?? null;

    return {
      orders,
      nextCursor: last
        ? { lastCreatedAt: last.created_at, lastId: last.id }
        : null,
    };

  }, {
    isolationLevel: 'Serializable',
    timeout:        25_000,
  });

  return {
    orders:     result.orders,
    total:      result.orders.length,
    nextCursor: result.nextCursor,
  };
}

// ── Pagination helper ─────────────────────────────────────────────────────────

/**
 * collectAllPages
 * Exhaust every page of a snapshot into a flat array.
 * Pass either fetchSnapshotPage or fetchAndLockSnapshotPage as the fetcher.
 */
export async function collectAllPages(
  pageFetcher: (cursor: SnapshotCursor | null) => Promise<SnapshotPage>,
): Promise<OrderRow[]> {
  const all: OrderRow[] = [];
  let cursor: SnapshotCursor | null = null;

  do {
    const page = await pageFetcher(cursor);
    all.push(...page.orders);
    cursor = page.nextCursor;
  } while (cursor !== null);

  return all;
}
