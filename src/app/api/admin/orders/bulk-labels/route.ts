/**
 * POST /api/admin/orders/bulk-labels
 * ─────────────────────────────────────────────────────────────────────────────
 * Deterministic shipping-label generation using the "Snapshot & Batch" pattern.
 *
 * CHANGED FROM ORIGINAL:
 *  ✗ OLD: accepts arbitrary orderIds[], fetches with no locking, race-prone
 *  ✓ NEW: requires cutoffTimestamp, uses SELECT…FOR UPDATE SKIP LOCKED,
 *         atomically flips order_status → 'labels_generated' inside the
 *         same transaction so the batch is never processed twice.
 *
 * Two usage modes:
 *  A) Specific orders (manual selection):
 *     { cutoffTimestamp, orderIds: [...] }
 *     → Locks + processes exactly those orders (still bounded by cutoff).
 *
 *  B) Automatic batch (Ready to Ship queue):
 *     { cutoffTimestamp }
 *     → Locks + processes ALL pending orders up to cutoff, page by page.
 *
 * Request body:
 *   {
 *     cutoffTimestamp: string;  // ISO-8601 UTC
 *     orderIds?:       string[]; // optional — if omitted, auto-batch mode
 *   }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse }  from 'next/server';
import { renderToBuffer }             from '@react-pdf/renderer';
import { ShippingLabel }              from '@/pdf/ShippingLabel';
import prisma                         from '@/lib/db';
import { getCurrentAdmin }            from '@/lib/admin-auth';
import QRCode                         from 'qrcode';
import { PDFDocument }                from 'pdf-lib';
import React                          from 'react';
import {
  fetchAndLockSnapshotPage,
  type SnapshotCursor,
  type OrderRow,
}                                     from '@/lib/services/export-snapshot';

// ─────────────────────────────────────────────────────────────────────────────

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
    const canManageOrders = await hasPermission(adminData.userId, 'order.manage');
    if (!canManageOrders) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions. order.manage required.' },
        { status: 403 },
      );
    }

    // ── 2. Parse & Validate Request ───────────────────────────────────────
    const body = await request.json();
    const { cutoffTimestamp, orderIds } = body as {
      cutoffTimestamp?: string;
      orderIds?:        string[];
    };

    if (!cutoffTimestamp) {
      return NextResponse.json(
        {
          success: false,
          error:
            'cutoffTimestamp is required. ' +
            'Capture new Date().toISOString() on the client BEFORE clicking ' +
            '"Download Labels" and pass it in the request body.',
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

    // Guard: refuse future cutoffs
    if (cutoffAt > new Date(Date.now() + 5_000)) {
      return NextResponse.json(
        { success: false, error: 'cutoffTimestamp cannot be in the future.' },
        { status: 400 },
      );
    }

    // ── 3. Collect Orders (Locked) ─────────────────────────────────────────
    let orders: OrderRow[] = [];

    if (Array.isArray(orderIds) && orderIds.length > 0) {
      // ── Mode A: Manual selection ─────────────────────────────────────────
      // Still lock the rows and enforce the cutoff.
      if (orderIds.length > 50) {
        return NextResponse.json(
          { success: false, error: 'Maximum 50 orders per label batch.' },
          { status: 400 },
        );
      }

      // Single transaction: lock + update + fetch for this exact set of IDs
      orders = await prisma.$transaction(async (tx) => {
        // Lock only the requested IDs that are still 'pending' AND within cutoff
        const locked = await tx.$queryRaw<{ id: string }[]>`
          SELECT id
          FROM   orders
          WHERE  id          = ANY(${orderIds}::uuid[])
            AND  created_at  <= ${cutoffAt}
            AND  order_status = ANY(ARRAY['pending']::text[])
          FOR UPDATE SKIP LOCKED
        `;

        const lockedIds = locked.map((r) => r.id);
        if (lockedIds.length === 0) return [];

        await tx.$executeRaw`
          UPDATE orders
          SET    order_status = 'labels_generated',
                 updated_at   = NOW()
          WHERE  id = ANY(${lockedIds}::uuid[])
        `;

        return tx.orders.findMany({
          where:   { id: { in: lockedIds } },
          orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
          include: {
            order_items: {
              include: {
                product_variants: { include: { product: true } },
              },
            },
          },
        });
      }, { isolationLevel: 'Serializable', timeout: 25_000 }) as unknown as OrderRow[];

    } else {
      // ── Mode B: Automatic batch — cursor through all pending orders ───────
      // fetchAndLockSnapshotPage locks + updates page by page.
      const all: OrderRow[] = [];
      let cursor: SnapshotCursor | null = null;

      do {
        const page = await fetchAndLockSnapshotPage(
          cutoffAt,
          cursor,
          'labels_generated',
          ['pending'],
        );
        all.push(...page.orders);
        cursor = page.nextCursor;
      } while (cursor !== null);

      orders = all;
    }

    if (orders.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'No eligible orders found. Either all orders are already ' +
            'processed, or no orders exist before the cutoff timestamp.',
        },
        { status: 404 },
      );
    }

    // ── 4. Generate PDF per Order ─────────────────────────────────────────
    const pdfBuffers: Buffer[] = [];
    const errors: Array<{ orderId: string; error: string }> = [];

    for (const order of orders) {
      try {
        // QR Code
        let qrCodeDataUrl: string | undefined;
        try {
          const { generateOrderToken } = await import('@/lib/utils/order-token');
          const token       = generateOrderToken(order.id);
          const baseUrl     = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dudemw.com';
          const detailsUrl  = `${baseUrl}/api/orders/${order.id}/details?token=${token}`;
          qrCodeDataUrl     = await QRCode.toDataURL(detailsUrl, {
            width: 200, margin: 1,
            color: { dark: '#000000', light: '#FFFFFF' },
          });
        } catch (qrErr) {
          console.error(`[BulkLabels] QR error for ${order.id}:`, qrErr);
        }

        // PDF
        const element   = React.createElement(ShippingLabel, {
          order:       order as any,
          qrCodeDataUrl,
        });
        const pdfBuffer = await renderToBuffer(element as any);
        pdfBuffers.push(pdfBuffer);

      } catch (pdfErr: any) {
        console.error(`[BulkLabels] PDF error for ${order.id}:`, pdfErr);
        errors.push({ orderId: order.id, error: pdfErr?.message ?? String(pdfErr) });
      }
    }

    if (pdfBuffers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate any labels.', details: errors },
        { status: 500 },
      );
    }

    // ── 5. Merge PDFs ─────────────────────────────────────────────────────
    const mergedPdf = await PDFDocument.create();

    for (const buf of pdfBuffers) {
      try {
        const pdf         = await PDFDocument.load(buf);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((p) => mergedPdf.addPage(p));
      } catch (mergeErr) {
        console.error('[BulkLabels] Merge error:', mergeErr);
      }
    }

    const mergedBytes = await mergedPdf.save();
    const finalBuffer = Buffer.from(mergedBytes);

    const date     = cutoffAt.toISOString().split('T')[0];
    const filename = `shipping-labels-${date}-snapshot.pdf`;

    return new NextResponse(finalBuffer, {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length':      finalBuffer.length.toString(),
        // Diagnostic headers — useful for audit logs
        'X-Labels-Cutoff':     cutoffAt.toISOString(),
        'X-Labels-Count':      String(pdfBuffers.length),
        'X-Labels-Errors':     String(errors.length),
      },
    });

  } catch (error) {
    console.error('[BulkLabels] Fatal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Bulk label generation failed.',
      },
      { status: 500 },
    );
  }
}
