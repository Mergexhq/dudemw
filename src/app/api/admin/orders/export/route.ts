/**
 * POST /api/admin/orders/export
 * ─────────────────────────────────────────────────────────────────────────────
 * Deterministic CSV export using the "Snapshot & Batch" pattern.
 *
 * The client MUST send `cutoffTimestamp` — the exact UTC instant captured in
 * the browser BEFORE this request was made.  Every query is bounded by that
 * ceiling; orders created after it are invisible to this export run.
 *
 * Request body:
 *   {
 *     cutoffTimestamp: string;  // ISO-8601 UTC, e.g. "2026-06-25T17:30:00.000Z"
 *     statusFilter?:  string[]; // defaults to ["pending","processing"]
 *   }
 *
 * Response: application/octet-stream CSV file download
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin }           from '@/lib/admin-auth';
import {
  fetchSnapshotPage,
  collectAllPages,
  type SnapshotCursor,
} from '@/lib/services/export-snapshot';

export async function POST(request: NextRequest) {
  try {
    // ── 1. Auth & Permissions ─────────────────────────────────────────────
    const adminData = await getCurrentAdmin();
    if (!adminData?.profile) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 401 },
      );
    }

    const { hasPermission } = await import('@/lib/services/permissions');
    const canExport = await hasPermission(adminData.userId, 'order.manage');
    if (!canExport) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions.' },
        { status: 403 },
      );
    }

    // ── 2. Parse & Validate Request ───────────────────────────────────────
    const body = await request.json();
    const { cutoffTimestamp, statusFilter } = body as {
      cutoffTimestamp?: string;
      statusFilter?:    string[];
    };

    if (!cutoffTimestamp) {
      return NextResponse.json(
        {
          success: false,
          error:
            'cutoffTimestamp is required. ' +
            'Capture new Date().toISOString() on the client immediately ' +
            'before calling this endpoint.',
        },
        { status: 400 },
      );
    }

    const cutoffAt = new Date(cutoffTimestamp);
    if (isNaN(cutoffAt.getTime())) {
      return NextResponse.json(
        { success: false, error: 'cutoffTimestamp is not a valid ISO-8601 date.' },
        { status: 400 },
      );
    }

    // Guard: refuse future cutoffs (clock skew protection)
    const fiveSecondsFromNow = new Date(Date.now() + 5_000);
    if (cutoffAt > fiveSecondsFromNow) {
      return NextResponse.json(
        { success: false, error: 'cutoffTimestamp cannot be in the future.' },
        { status: 400 },
      );
    }

    const resolvedStatusFilter: string[] =
      Array.isArray(statusFilter) && statusFilter.length > 0
        ? statusFilter
        : ['pending', 'processing'];

    // ── 3. Collect All Pages via Cursor Pagination ────────────────────────
    // fetchSnapshotPage is bound to the cutoff + status filter via closure.
    const orders = await collectAllPages(
      (cursor: SnapshotCursor | null) =>
        fetchSnapshotPage(cutoffAt, cursor, resolvedStatusFilter),
    );

    if (orders.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No orders found for the given snapshot window.' },
        { status: 404 },
      );
    }

    // ── 4. Build CSV ───────────────────────────────────────────────────────
    const csvHeader = [
      'Order Number',
      'Status',
      'Payment Status',
      'Customer Name',
      'Customer Phone',
      'Customer Email',
      'Total Amount (₹)',
      'Shipping Amount (₹)',
      'Shipping Provider',
      'Tracking Number',
      'Items',
      'Created At',
    ].join(',');

    const csvRows = orders.map((o) => {
      const itemsSummary = o.order_items
        .map(
          (item) =>
            `${item.product_variants?.product?.name ?? 'Unknown'} x${item.quantity}`,
        )
        .join(' | ');

      const safeField = (val: unknown) =>
        `"${String(val ?? '').replace(/"/g, '""')}"`;

      return [
        safeField(o.order_number),
        safeField(o.order_status),
        safeField(o.payment_status),
        safeField(o.customer_name_snapshot),
        safeField(o.customer_phone_snapshot),
        safeField(o.customer_email_snapshot),
        safeField(o.total_amount),
        safeField(o.shipping_amount),
        safeField(o.shipping_provider),
        safeField(o.shipping_tracking_number),
        safeField(itemsSummary),
        safeField(o.created_at?.toISOString()),
      ].join(',');
    });

    const csv = [csvHeader, ...csvRows].join('\n');

    // ── 5. Stream CSV Response ─────────────────────────────────────────────
    const date      = cutoffAt.toISOString().split('T')[0];
    const filename  = `orders-export-${date}-snapshot.csv`;
    const csvBuffer = Buffer.from(csv, 'utf-8');

    return new NextResponse(csvBuffer, {
      status: 200,
      headers: {
        'Content-Type':        'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length':      csvBuffer.length.toString(),
        // Tell the client exactly which snapshot this covers
        'X-Export-Cutoff':     cutoffAt.toISOString(),
        'X-Export-Count':      String(orders.length),
      },
    });

  } catch (error) {
    console.error('[Export CSV] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed.',
      },
      { status: 500 },
    );
  }
}
