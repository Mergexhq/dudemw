import { NextRequest, NextResponse } from 'next/server';
import { executeBroadcast, BroadcastFilter } from '@/lib/services/broadcast';

export const runtime = 'nodejs';

/**
 * POST /api/admin/broadcasts/send
 *
 * Growth Engine — authorized broadcast trigger (internal/Mergex mechanism).
 * Auth: x-admin-secret header matching ADMIN_API_SECRET — same pattern as
 * /api/admin/payments/recover-pending.
 *
 * Body: {
 *   broadcastId: string      // REQUIRED idempotency key — same id can never send twice
 *   headerMediaUrl: string   // public image/video URL for the template header
 *   bodyValues: string[]     // ordered template body variables
 *   buttonValues?: Record<string, string[]> // quick-reply payloads by button index
 *   filter: { type: 'all' } | { type: 'with_orders' } | { type: 'recent', days: number }
 *   testPhone?: string       // dev/test: redirects ALL sends to this one number
 *   confirm?: boolean        // REQUIRED (true) for production sends (no testPhone)
 * }
 */
export async function POST(request: NextRequest) {
  const adminSecret = request.headers.get('x-admin-secret');
  if (!adminSecret || adminSecret !== process.env.ADMIN_API_SECRET) {
    console.error('[Broadcast API] Unauthorized attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { broadcastId, headerMediaUrl, bodyValues, buttonValues, filter, testPhone, confirm } = body as {
      broadcastId?: string;
      headerMediaUrl?: string;
      bodyValues?: string[];
      buttonValues?: Record<string, string[]>;
      filter?: BroadcastFilter;
      testPhone?: string;
      confirm?: boolean;
    };

    if (!filter || !['all', 'with_orders', 'recent'].includes(filter?.type)) {
      return NextResponse.json(
        { error: 'filter must be { type: "all" } | { type: "with_orders" } | { type: "recent", days: number }' },
        { status: 400 }
      );
    }
    if (filter.type === 'recent' && (!Number.isFinite((filter as any).days) || (filter as any).days <= 0)) {
      return NextResponse.json({ error: 'filter.days must be a positive number' }, { status: 400 });
    }

    const result = await executeBroadcast(
      {
        broadcastId: String(broadcastId || ''),
        headerMediaUrl: String(headerMediaUrl || ''),
        bodyValues: Array.isArray(bodyValues) ? bodyValues.map(String) : [],
        buttonValues,
        filter,
        testPhone: testPhone ? String(testPhone) : undefined,
      },
      { confirm: confirm === true }
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('[Broadcast API] Error:', error);
    return NextResponse.json({ error: error.message || 'Broadcast failed' }, { status: 500 });
  }
}
