import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/services/razorpay";
import { prisma } from "@/lib/db";
import { EmailService } from "@/lib/services/resend";

export const runtime = 'nodejs';

/**
 * POST /api/webhooks/razorpay
 *
 * Razorpay Webhook handler — the CRITICAL safety net for payment verification.
 * When the client-side verify call fails (network drop, phone sleep, browser crash),
 * this server-to-server callback ensures orders are still updated.
 *
 * Razorpay Dashboard URL: https://dudemw.com/api/webhooks/razorpay
 * Active Events: payment.captured, payment.failed, refund.processed, refund.failed
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    console.warn('[Webhook] ─── Incoming Razorpay webhook ───');

    if (!signature) {
      console.error('[Webhook] Missing x-razorpay-signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[Webhook] RAZORPAY_WEBHOOK_SECRET not set in environment');
      // Still process the webhook but log the warning — don't silently fail
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const isValid = verifyWebhookSignature(body, signature, webhookSecret);
    if (!isValid) {
      console.error('[Webhook] Signature verification FAILED. Possible causes:');
      console.error('[Webhook]   1. RAZORPAY_WEBHOOK_SECRET in env does not match Razorpay Dashboard');
      console.error('[Webhook]   2. Body was modified in transit');
      console.error('[Webhook]   Signature (first 20 chars):', signature.slice(0, 20) + '...');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);
    console.warn('[Webhook] Event received:', event.event, '| Payment/Order ID:', 
      event.payload?.payment?.entity?.id || event.payload?.order?.entity?.id || 'unknown');

    switch (event.event) {
      case 'payment.authorized':
      case 'payment.captured':
        await handlePaymentSuccess(event.payload.payment.entity);
        break;
      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;
      case 'order.paid':
        await handleOrderPaid(event.payload.order.entity);
        break;
      default:
        console.log('[Webhook] Unhandled event type:', event.event);
    }

    console.warn(`[Webhook] ─── Processed in ${Date.now() - startTime}ms ───`);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Webhook] CRITICAL error processing webhook:', error);
    // Return 200 anyway to prevent Razorpay from retrying on our code errors
    // (Razorpay retries on 4xx/5xx, which could cause infinite retry loops)
    return NextResponse.json({ error: 'Webhook processing failed', received: true }, { status: 200 });
  }
}

async function handlePaymentSuccess(payment: any) {
  try {
    const razorpayOrderId = payment.order_id;
    console.warn('[Webhook] Processing payment.captured:', payment.id, 'for Razorpay order:', razorpayOrderId);

    const order = await prisma.orders.findFirst({
      where: { razorpay_order_id: razorpayOrderId } as any,
    }) as any;

    if (!order) {
      console.error('[Webhook] Order not found for razorpay_order_id:', razorpayOrderId);
      return;
    }

    // Idempotency: if already paid, skip
    if (order.payment_status === 'paid') {
      console.log('[Webhook] Order already paid, skipping:', order.id);
      return;
    }

    console.warn('[Webhook] Updating order:', order.id, '| Customer:', order.customer_name_snapshot);

    // Create payment record (skip if already exists)
    const existingPayment = await (prisma.payments as any).findFirst({
      where: { order_id: order.id, payment_id: payment.id },
      select: { id: true },
    });

    if (!existingPayment) {
      await prisma.payments.create({
        data: {
          order_id: order.id,
          provider: 'razorpay',
          payment_id: payment.id,
          status: 'paid',
          raw_response: payment,
        } as any,
      }).catch((e: any) => console.error('[Webhook] Failed to create payment record:', e));
    }

    // Update order — do NOT set razorpay_payment_id (column doesn't exist)
    await prisma.orders.update({
      where: { id: order.id },
      data: {
        order_status: 'processing',
        payment_status: 'paid',
        payment_method: payment.method || 'razorpay',
      } as any,
    });

    console.warn('[Webhook] ✅ Payment success processed:', payment.id, '| Order:', order.order_number);

    // Send confirmation email (same logic as verify route)
    try {
      await sendOrderConfirmationEmail(order);
    } catch (emailErr) {
      console.error('[Webhook] Email send failed (non-blocking):', emailErr);
    }

    // Send WhatsApp confirmation (fire-and-forget)
    try {
      await sendWhatsAppConfirmation(order);
    } catch (waErr) {
      console.error('[Webhook] WhatsApp send failed (non-blocking):', waErr);
    }
  } catch (error) {
    console.error('[Webhook] Failed to process payment success:', error);
  }
}

async function handlePaymentFailed(payment: any) {
  try {
    const razorpayOrderId = payment.order_id;
    console.warn('[Webhook] Processing payment.failed:', payment.id, 'for Razorpay order:', razorpayOrderId);

    const order = await prisma.orders.findFirst({
      where: { razorpay_order_id: razorpayOrderId } as any,
      select: { id: true, payment_status: true },
    }) as any;

    if (!order) {
      console.error('[Webhook] Order not found for razorpay_order_id:', razorpayOrderId);
      return;
    }

    // Don't override a paid order with failed
    if (order.payment_status === 'paid') {
      console.log('[Webhook] Order already paid, ignoring payment.failed:', order.id);
      return;
    }

    await prisma.payments.create({
      data: {
        order_id: order.id,
        provider: 'razorpay',
        payment_id: payment.id,
        status: 'failed',
        raw_response: payment,
      } as any,
    }).catch((e: any) => console.error('[Webhook] Failed to create payment record:', e));

    // Do NOT cancel the order on payment.failed — the customer may retry
    // Just mark the payment as failed but keep order pending
    console.warn('[Webhook] Payment failure recorded:', payment.id, '(order kept pending for retry)');
  } catch (error) {
    console.error('[Webhook] Failed to process payment failure:', error);
  }
}

async function handleOrderPaid(order: any) {
  try {
    console.warn('[Webhook] Processing order.paid:', order.id);

    const orderData = await prisma.orders.findFirst({
      where: { razorpay_order_id: order.id } as any,
    }) as any;

    if (!orderData) {
      console.error('[Webhook] Order not found for razorpay_order_id:', order.id);
      return;
    }

    // Idempotency
    if (orderData.payment_status === 'paid') {
      console.log('[Webhook] Order already paid, skipping:', orderData.id);
      return;
    }

    // Create payment record
    const existingPayment = await (prisma.payments as any).findFirst({
      where: { order_id: orderData.id },
      select: { id: true },
    });

    if (!existingPayment) {
      await prisma.payments.create({
        data: {
          order_id: orderData.id,
          provider: 'razorpay',
          payment_id: order.id,
          status: 'paid',
          raw_response: order,
        } as any,
      }).catch((e: any) => console.error('[Webhook] Failed to create payment record:', e));
    }

    await prisma.orders.update({
      where: { id: orderData.id },
      data: { order_status: 'processing', payment_status: 'paid' } as any,
    });

    console.warn('[Webhook] ✅ Order paid processed:', order.id, '| Order:', orderData.order_number);
  } catch (error) {
    console.error('[Webhook] Failed to process order paid:', error);
  }
}

// Helper: send order confirmation email (duplicated from verify route for webhook independence)
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
    console.warn(`[Webhook] No email for order ${order.id} — skipping email`);
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
    console.error('[Webhook] Failed to fetch order items for email:', e);
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
  console.log(`[Webhook] ✅ Confirmation email sent for order ${order.id}`);
}

// Helper: send WhatsApp confirmation
async function sendWhatsAppConfirmation(order: any) {
  let customerPhone = (order.customer_phone_snapshot || '').replace(/\D/g, '');
  if (customerPhone.startsWith('91') && customerPhone.length === 12) {
    customerPhone = customerPhone.slice(2);
  }
  if (!customerPhone) {
    console.warn(`[Webhook] No phone for order ${order.id} — skipping WhatsApp`);
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
  console.log(`[Webhook] ✅ WhatsApp sent for order ${order.id}`);
}
