import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import Razorpay from 'razorpay';
import { getRazorpayKeyId, getRazorpayKeySecret } from '@/lib/services/razorpay';
import { EmailService } from '@/lib/services/resend';

export const runtime = 'nodejs';

/**
 * GET /api/cron/reconcile-payments
 *
 * Reconciliation Cron Job — the ULTIMATE safety net.
 * Runs every 15 minutes to scan for pending orders in the database (older than 10 mins, newer than 24 hours),
 * queries the Razorpay API for each order's actual payment status, and auto-captures/heals any orders
 * that are marked paid in Razorpay but stuck as "pending" in our system.
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Reconciliation Cron] Unauthorized access attempt');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    console.warn('[Reconciliation Cron] Starting reconciliation job...');

    const keyId = getRazorpayKeyId();
    const keySecret = getRazorpayKeySecret();
    if (!keyId || !keySecret) {
      console.error('[Reconciliation Cron] Razorpay environment keys not found');
      return NextResponse.json({ success: false, error: 'Razorpay keys not configured' }, { status: 500 });
    }

    const rz = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find pending orders to reconcile
    const pendingOrders = await prisma.orders.findMany({
      where: {
        payment_method: 'razorpay',
        payment_status: 'pending',
        razorpay_order_id: { not: null },
        created_at: {
          lt: tenMinutesAgo,
          gt: twentyFourHoursAgo,
        },
      } as any,
      orderBy: { created_at: 'desc' },
    }) as any[];

    console.warn(`[Reconciliation Cron] Found ${pendingOrders.length} candidate orders for reconciliation`);

    const reconciled: string[] = [];
    const failed: string[] = [];

    for (const order of pendingOrders) {
      try {
        console.warn(`[Reconciliation Cron] Checking order: ${order.id} | Razorpay ID: ${order.razorpay_order_id}`);
        
        // Query Razorpay API for payments associated with this order ID
        const paymentsResponse = await rz.orders.fetchPayments(order.razorpay_order_id);
        const payments = paymentsResponse?.items || [];
        
        console.warn(`[Reconciliation Cron] Order ${order.id} has ${payments.length} payment attempts in Razorpay`);

        // Find if there's any captured (or authorized) payment
        const successfulPayment = payments.find(
          (p: any) => p.status === 'captured' || p.status === 'authorized'
        );

        if (successfulPayment) {
          console.warn(`[Reconciliation Cron] Found successful payment ${successfulPayment.id} for order ${order.id}. Auto-healing!`);

          // Create payment record (skip if already exists)
          const existingPayment = await (prisma.payments as any).findFirst({
            where: { order_id: order.id, payment_id: successfulPayment.id },
            select: { id: true },
          });

          if (!existingPayment) {
            await prisma.payments.create({
              data: {
                order_id: order.id,
                provider: 'razorpay',
                payment_id: successfulPayment.id,
                status: 'paid',
                raw_response: successfulPayment,
              } as any,
            }).catch((e: any) => console.error(`[Reconciliation Cron] Failed to create payment record for ${order.id}:`, e));
          }

          // Update order status in database
          const updatedOrder = await prisma.orders.update({
            where: { id: order.id },
            data: {
              order_status: 'processing',
              payment_status: 'paid',
              payment_method: successfulPayment.method || 'razorpay',
            } as any,
          });

          // Trigger email confirmation
          try {
            await sendOrderConfirmationEmail(updatedOrder);
          } catch (emailErr) {
            console.error(`[Reconciliation Cron] Failed to send email for order ${order.id}:`, emailErr);
          }

          // Trigger WhatsApp confirmation
          try {
            await sendWhatsAppConfirmation(updatedOrder);
          } catch (waErr) {
            console.error(`[Reconciliation Cron] Failed to send WhatsApp for order ${order.id}:`, waErr);
          }

          reconciled.push(order.id);
          console.warn(`[Reconciliation Cron] ✅ Reconciled and healed order ${order.id}`);
        } else {
          console.log(`[Reconciliation Cron] No successful payment found for order ${order.id}. Leaving pending.`);
        }
      } catch (err) {
        console.error(`[Reconciliation Cron] Error reconciling order ${order.id}:`, err);
        failed.push(order.id);
      }
    }

    return NextResponse.json({
      success: true,
      processed: pendingOrders.length,
      reconciledCount: reconciled.length,
      reconciledOrders: reconciled,
      failedCount: failed.length,
      failedOrders: failed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Reconciliation Cron] CRITICAL unexpected error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Duplicated email and WhatsApp helper functions from route.ts for absolute independence

async function sendOrderConfirmationEmail(order: any) {
  const shippingAddress = (order.shipping_address as any) || {};
  const customerName =
    shippingAddress?.firstName ||
    order.customer_name_snapshot?.split(' ')?.[0] ||
    'Customer';

  let customerEmail: string | null =
    (order.guest_email && order.guest_email.trim()) ||
    (order.customer_email_snapshot && order.customer_email_snapshot.trim()) ||
    null;

  if (!customerEmail && order.customer_id) {
    const customer = await prisma.customers.findUnique({
      where: { id: order.customer_id },
      select: { email: true },
    });
    customerEmail = customer?.email?.trim() || null;
  }

  if (!customerEmail) {
    console.warn(`[Reconciliation Cron] No email for order ${order.id} — skipping email`);
    return;
  }

  let orderItems: any[] = [];
  try {
    const items = await prisma.order_items.findMany({
      where: { order_id: order.id } as any,
      include: { product_variants: { include: { product: true } } } as any,
    }) as any[];
    orderItems = items.map((item: any) => ({
      name: item.product_variants?.product?.title || 'Product',
      quantity: item.quantity,
      price: `₹${item.price}`,
      image: item.product_variants?.image_url,
    }));
  } catch (e) {
    console.error('[Reconciliation Cron] Failed to fetch order items for email:', e);
  }

  await EmailService.sendOrderConfirmation(customerEmail, {
    customerName,
    orderNumber: order.id.slice(-8).toUpperCase(),
    orderTotal: `₹${order.total_amount}`,
    subtotalAmount: order.subtotal_amount ? `₹${order.subtotal_amount}` : undefined,
    shippingAmount: order.shipping_amount !== undefined ? (Number(order.shipping_amount) === 0 ? '₹0' : `₹${order.shipping_amount}`) : undefined,
    taxAmount: order.tax_amount ? `₹${order.tax_amount}` : undefined,
    discountAmount: order.discount_amount ? `₹${order.discount_amount}` : undefined,
    couponCode: order.coupon_code || undefined,
    orderItems,
    shippingAddress: {
      name: shippingAddress?.name || `${shippingAddress?.firstName || ''} ${shippingAddress?.lastName || ''}`.trim() || '',
      address: shippingAddress?.address || shippingAddress?.address_line1 || '',
      city: shippingAddress?.city || '',
      state: shippingAddress?.state || '',
      postalCode: shippingAddress?.postalCode || shippingAddress?.pincode || '',
    },
  });
  console.log(`[Reconciliation Cron] ✅ Confirmation email sent for order ${order.id}`);
}

async function sendWhatsAppConfirmation(order: any) {
  let customerPhone = (order.customer_phone_snapshot || '').replace(/\D/g, '');
  if (customerPhone.startsWith('91') && customerPhone.length === 12) {
    customerPhone = customerPhone.slice(2);
  }
  if (!customerPhone) {
    console.warn(`[Reconciliation Cron] No phone for order ${order.id} — skipping WhatsApp`);
    return;
  }

  const { sendOrderConfirmation } = await import('@/lib/services/interakt');
  const shippingAddress = (order.shipping_address as any) || {};
  const customerName =
    shippingAddress?.firstName ||
    order.customer_name_snapshot?.split(' ')?.[0] ||
    'Customer';

  await sendOrderConfirmation({
    customerPhone,
    customerName,
    orderId: order.id,
    orderDate: order.created_at ? new Date(order.created_at) : new Date(),
    totalAmount: Number(order.total_amount),
  });
  console.log(`[Reconciliation Cron] ✅ WhatsApp sent for order ${order.id}`);
}
