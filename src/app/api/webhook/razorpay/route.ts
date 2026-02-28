import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/services/razorpay";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

    const isValid = verifyWebhookSignature(body, signature, process.env.RAZORPAY_WEBHOOK_SECRET!);
    if (!isValid) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });

    const event = JSON.parse(body);

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
        console.log('Unhandled webhook event:', event.event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handlePaymentSuccess(payment: any) {
  try {
    const order = await prisma.orders.findFirst({
      where: { razorpay_order_id: payment.order_id } as any,
      select: { id: true },
    }) as any;

    if (!order) { console.error('[Webhook] Order not found:', payment.order_id); return; }

    await prisma.payments.create({
      data: { order_id: order.id, provider: 'razorpay', payment_id: payment.id, status: 'paid', raw_response: payment } as any,
    }).catch((e: any) => console.error('[Webhook] Failed to create payment record:', e));

    await prisma.orders.updateMany({
      where: { razorpay_order_id: payment.order_id } as any,
      data: { order_status: 'processing', payment_status: 'paid', razorpay_payment_id: payment.id, payment_method: payment.method } as any,
    });
    console.warn('[Webhook] Payment success processed:', payment.id);
  } catch (error) {
    console.error('[Webhook] Failed to process payment success:', error);
  }
}

async function handlePaymentFailed(payment: any) {
  try {
    const order = await prisma.orders.findFirst({
      where: { razorpay_order_id: payment.order_id } as any,
      select: { id: true },
    }) as any;

    if (!order) { console.error('[Webhook] Order not found:', payment.order_id); return; }

    await prisma.payments.create({
      data: { order_id: order.id, provider: 'razorpay', payment_id: payment.id, status: 'failed', raw_response: payment } as any,
    }).catch((e: any) => console.error('[Webhook] Failed to create payment record:', e));

    await prisma.orders.updateMany({
      where: { razorpay_order_id: payment.order_id } as any,
      data: { payment_status: 'failed', order_status: 'cancelled', razorpay_payment_id: payment.id } as any,
    });
    console.warn('[Webhook] Payment failure processed:', payment.id);
  } catch (error) {
    console.error('[Webhook] Failed to process payment failure:', error);
  }
}

async function handleOrderPaid(order: any) {
  try {
    const orderData = await prisma.orders.findFirst({
      where: { razorpay_order_id: order.id } as any,
      select: { id: true },
    }) as any;

    if (!orderData) { console.error('[Webhook] Order not found:', order.id); return; }

    await prisma.payments.create({
      data: { order_id: orderData.id, provider: 'razorpay', payment_id: order.id, status: 'paid', raw_response: order } as any,
    }).catch((e: any) => console.error('[Webhook] Failed to create payment record:', e));

    await prisma.orders.updateMany({
      where: { razorpay_order_id: order.id } as any,
      data: { order_status: 'processing', payment_status: 'paid' } as any,
    });
    console.warn('[Webhook] Order paid processed:', order.id);
  } catch (error) {
    console.error('[Webhook] Failed to process order paid:', error);
  }
}
