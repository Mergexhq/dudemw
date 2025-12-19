import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpayPayment } from '@/lib/services/razorpay';
import { supabaseAdmin } from '@/lib/supabase/supabase';
import { EmailService } from '@/lib/services/resend';

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  orderId: string;
}

/**
 * POST /api/payments/verify
 * Verify Razorpay payment signature and update order
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as VerifyPaymentRequest;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = body;

    // Validate inputs
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return NextResponse.json(
        { success: false, error: 'Missing payment verification data' },
        { status: 400 }
      );
    }

    // Verify payment signature
    const isValid = verifyRazorpayPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    if (!isValid) {
      // Update order as payment failed
      await supabaseAdmin
        .from('orders')
        .update({
          payment_status: 'failed',
          payment_error: 'Invalid payment signature',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      return NextResponse.json(
        { success: false, error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Get order details
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*, variants(*, products(*)))')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order as paid and move to processing
    await supabaseAdmin
      .from('orders')
      .update({
        status: 'processing',
        payment_status: 'paid',
        razorpay_payment_id,
        razorpay_signature,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    // Send order confirmation email
    try {
      const customerName = order.shipping_address?.firstName || 'Customer';
      const orderItems = (order.order_items || []).map((item: any) => ({
        name: item.variants?.products?.name || 'Product',
        quantity: item.quantity,
        price: `₹${item.price}`,
        image: item.variants?.products?.primary_image_url
      }));

      await EmailService.sendOrderConfirmation(order.email, {
        customerName,
        orderNumber: order.order_number,
        orderTotal: `₹${order.total_amount}`,
        orderItems,
        shippingAddress: {
          name: `${order.shipping_address?.firstName} ${order.shipping_address?.lastName}`,
          address: order.shipping_address?.address || '',
          city: order.shipping_address?.city || '',
          state: order.shipping_address?.state || '',
          postalCode: order.shipping_address?.postalCode || ''
        }
      });
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      orderId,
      orderNumber: order.order_number,
      message: 'Payment verified successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Payment verification failed' 
      },
      { status: 500 }
    );
  }
}
