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
    // Update order payment status in database
    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        razorpay_payment_id: payment.id,
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', payment.order_id);

    if (error) {
      throw error;
    }

    console.log('Payment success processed:', payment.id);
  } catch (error) {
    console.error('Failed to process payment success:', error);
  }
}

async function handlePaymentFailed(payment: any) {
  try {
    // Update order payment status in database
    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: 'failed',
        razorpay_payment_id: payment.id,
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', payment.order_id);

    if (error) {
      throw error;
    }

    console.log('Payment failure processed:', payment.id);
  } catch (error) {
    console.error('Failed to process payment failure:', error);
  }
}

async function handleOrderPaid(order: any) {
  try {
    // Additional order processing logic
    console.log('Order paid processed:', order.id);
  } catch (error) {
    console.error('Failed to process order paid:', error);
  }
}
