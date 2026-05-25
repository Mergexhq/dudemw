import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyRazorpayPayment, getRazorpayKeySecret } from '@/lib/services/razorpay';

export const runtime = 'nodejs';

/**
 * POST /api/admin/payments/recover-pending
 *
 * Admin-only endpoint to recover orders stuck in "pending" payment status
 * even though Razorpay payment was completed (webhook or client callback failed).
 *
 * Two modes:
 *   1. Signature-verified recovery: provide razorpay_order_id, razorpay_payment_id,
 *      razorpay_signature — verifies the HMAC before updating.
 *   2. Admin-forced recovery: provide razorpay_payment_id + orderId without signature
 *      (records the payment_id as-is, marks as paid without cryptographic verification).
 *      Use only when you have confirmed the payment in Razorpay dashboard.
 *
 * Body: { orders: Array<{ orderId: string; razorpay_payment_id?: string; razorpay_order_id?: string; razorpay_signature?: string; }> }
 * Header: x-admin-secret: <ADMIN_API_SECRET env var>
 */
export async function POST(request: NextRequest) {
  // Simple admin authentication via secret header
  const adminSecret = request.headers.get('x-admin-secret');
  if (!adminSecret || adminSecret !== process.env.ADMIN_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { orders } = body as {
      orders: Array<{
        orderId: string;
        razorpay_payment_id?: string;
        razorpay_order_id?: string;
        razorpay_signature?: string;
        force?: boolean; // skip signature verification
      }>;
    };

    if (!Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json({ error: 'Provide orders array' }, { status: 400 });
    }

    const results: Array<{ orderId: string; status: string; error?: string }> = [];
    const keySecret = getRazorpayKeySecret();

    for (const entry of orders) {
      const { orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature, force } = entry;

      try {
        // Fetch order
        const order = await prisma.orders.findUnique({ where: { id: orderId } }) as any;
        if (!order) {
          results.push({ orderId, status: 'error', error: 'Order not found' });
          continue;
        }

        if (order.payment_status === 'paid') {
          results.push({ orderId, status: 'skipped', error: 'Already paid' });
          continue;
        }

        // Signature verification if possible
        if (!force && razorpay_order_id && razorpay_payment_id && razorpay_signature && keySecret) {
          const isValid = verifyRazorpayPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature });
          if (!isValid) {
            results.push({ orderId, status: 'error', error: 'Invalid signature — use force:true to skip verification' });
            continue;
          }
        }

        // Create payment record (skip if already exists for this payment_id)
        if (razorpay_payment_id) {
          const existingPayment = await (prisma.payments as any).findFirst({
            where: { payment_id: razorpay_payment_id },
            select: { id: true },
          });

          if (!existingPayment) {
            await prisma.payments.create({
              data: {
                order_id: orderId,
                provider: 'razorpay',
                payment_id: razorpay_payment_id,
                status: 'paid',
                raw_response: {
                  razorpay_order_id: razorpay_order_id || order.razorpay_order_id,
                  razorpay_payment_id,
                  razorpay_signature: razorpay_signature || null,
                  recovered_at: new Date().toISOString(),
                  recovered_by: 'admin-recovery-api',
                },
              } as any,
            });
          }
        }

        // Update order status
        await prisma.orders.update({
          where: { id: orderId },
          data: {
            payment_status: 'paid',
            order_status: 'processing',
            payment_method: 'razorpay',
          } as any,
        });

        results.push({ orderId, status: 'recovered' });
        console.warn(`[Admin Recovery] Order ${orderId} (${order.customer_name_snapshot}) marked as paid`);
      } catch (err: any) {
        results.push({ orderId, status: 'error', error: err.message });
      }
    }

    const recovered = results.filter(r => r.status === 'recovered').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const failed = results.filter(r => r.status === 'error').length;

    return NextResponse.json({ success: true, recovered, skipped, failed, results });
  } catch (error: any) {
    console.error('[Admin Recovery] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/admin/payments/recover-pending
 * Lists all pending Razorpay orders that have no payment record (stuck orders).
 */
export async function GET(request: NextRequest) {
  const adminSecret = request.headers.get('x-admin-secret');
  if (!adminSecret || adminSecret !== process.env.ADMIN_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stuckOrders = await prisma.$queryRaw`
      SELECT 
        o.id as "orderId",
        o.order_number as "orderNumber",
        o.customer_name_snapshot as "customerName",
        o.customer_email_snapshot as "customerEmail",
        o.razorpay_order_id as "razorpayOrderId",
        o.total_amount as "totalAmount",
        o.created_at as "createdAt",
        o.payment_status as "paymentStatus"
      FROM orders o
      LEFT JOIN payments p ON p.order_id = o.id
      WHERE o.payment_status = 'pending'
        AND o.payment_method = 'razorpay'
        AND o.razorpay_order_id IS NOT NULL
        AND p.id IS NULL
      ORDER BY o.created_at DESC
    ` as any[];

    return NextResponse.json({
      success: true,
      total: stuckOrders.length,
      orders: stuckOrders,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
