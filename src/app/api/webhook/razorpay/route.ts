import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/services/razorpay";
import { supabaseAdmin } from "@/lib/supabase/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(
      body,
      signature,
      process.env.RAZORPAY_WEBHOOK_SECRET!
    );

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);

    // Handle different webhook events
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

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(payment: any) {
  try {
    console.warn('[Webhook] Processing payment.authorized/captured event:', payment.id);
    console.warn('[Webhook] Order ID:', payment.order_id);
    console.warn('[Webhook] Amount:', payment.amount);

    // First, get the order UUID from razorpay_order_id
    const { data: order, error: orderFetchError } = await (supabaseAdmin
      .from('orders') as any)
      .select('id')
      .eq('razorpay_order_id', payment.order_id)
      .single();

    if (orderFetchError || !order) {
      console.error('[Webhook] Order not found for razorpay_order_id:', payment.order_id);
      return; // Can't proceed without order
    }

    // Create payment record for audit trail
    const { data: paymentRecord, error: paymentError } = await (supabaseAdmin
      .from('payments') as any)
      .insert({
        order_id: order.id, // UUID from orders table
        provider: 'razorpay',
        payment_id: payment.id,
        status: 'paid',
        raw_response: payment,
      })
      .select()
      .single();

    if (paymentError) {
      console.error('[Webhook] Failed to create payment record:', paymentError);
      // Continue with order update even if payment record fails
    } else {
      console.warn('[Webhook] Payment record created:', paymentRecord?.id);
    }

    // Update order payment status and move to processing
    const updateData = {
      order_status: 'processing' as const,
      payment_status: 'paid' as const,
      razorpay_payment_id: payment.id,
      payment_method: payment.method,
      updated_at: new Date().toISOString(),
    }
    const { error } = await (supabaseAdmin
      .from('orders') as any)
      .update(updateData)
      .eq('razorpay_order_id', payment.order_id);

    if (error) {
      console.error('[Webhook] Failed to update order:', error);
      throw error;
    }

    console.warn('[Webhook] Payment success processed:', payment.id);

    // TODO: Send order confirmation email
    // TODO: Update inventory reserves
  } catch (error) {
    console.error('[Webhook] Failed to process payment success:', error);
  }
}

async function handlePaymentFailed(payment: any) {
  try {
    console.warn('[Webhook] Processing payment.failed event:', payment.id);
    console.warn('[Webhook] Order ID:', payment.order_id);
    console.warn('[Webhook] Error reason:', payment.error_reason);
    console.warn('[Webhook] Error description:', payment.error_description);

    // First, get the order UUID from razorpay_order_id
    const { data: order, error: orderFetchError } = await (supabaseAdmin
      .from('orders') as any)
      .select('id')
      .eq('razorpay_order_id', payment.order_id)
      .single();

    if (orderFetchError || !order) {
      console.error('[Webhook] Order not found for razorpay_order_id:', payment.order_id);
      return; // Can't proceed without order
    }

    // Create payment record for audit trail
    const { data: paymentRecord, error: paymentError } = await (supabaseAdmin
      .from('payments') as any)
      .insert({
        order_id: order.id, // UUID from orders table
        provider: 'razorpay',
        payment_id: payment.id,
        status: 'failed',
        raw_response: payment,
      })
      .select()
      .single();

    if (paymentError) {
      console.error('[Webhook] Failed to create payment record:', paymentError);
      // Continue with order update even if payment record fails
    } else {
      console.warn('[Webhook] Payment record created:', paymentRecord?.id);
    }

    // Update order payment status AND order status to cancelled for failed payments
    const { error } = await (supabaseAdmin
      .from('orders') as any)
      .update({
        payment_status: 'failed',
        order_status: 'cancelled', // Failed payments should cancel the order
        razorpay_payment_id: payment.id,
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', payment.order_id);

    if (error) {
      console.error('[Webhook] Failed to update order:', error);
      throw error;
    }

    console.warn('[Webhook] Payment failure processed successfully:', payment.id);

    // TODO: Send payment failure notification email to customer
  } catch (error) {
    console.error('[Webhook] Failed to process payment failure:', error);
  }
}

async function handleOrderPaid(order: any) {
  try {
    console.warn('[Webhook] Processing order.paid event:', order.id);

    // First, get the order UUID from razorpay_order_id
    const { data: orderData, error: orderFetchError } = await (supabaseAdmin
      .from('orders') as any)
      .select('id')
      .eq('razorpay_order_id', order.id)
      .single();

    if (orderFetchError || !orderData) {
      console.error('[Webhook] Order not found for razorpay_order_id:', order.id);
      return; // Can't proceed without order
    }

    // Create payment record if not exists
    const { error: paymentError } = await (supabaseAdmin
      .from('payments') as any)
      .insert({
        order_id: orderData.id, // UUID from orders table
        provider: 'razorpay',
        payment_id: order.id, // For order.paid event, use order ID as payment reference
        status: 'paid',
        raw_response: order,
      });

    if (paymentError) {
      console.error('[Webhook] Failed to create payment record:', paymentError);
      // Continue anyway
    }

    // Update order status to processing when fully paid
    const { error } = await (supabaseAdmin
      .from('orders') as any)
      .update({
        order_status: 'processing',
        payment_status: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', order.id);

    if (error) {
      console.error('[Webhook] Failed to update order:', error);
      throw error;
    }

    console.warn('[Webhook] Order paid processed:', order.id);

    // TODO: Trigger fulfillment workflow
  } catch (error) {
    console.error('[Webhook] Failed to process order paid:', error);
  }
}
