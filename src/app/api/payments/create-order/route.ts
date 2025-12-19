import { NextRequest, NextResponse } from 'next/server';
import { createRazorpayOrder } from '@/lib/services/razorpay';
import { supabaseAdmin } from '@/lib/supabase/supabase';

export interface CreatePaymentOrderRequest {
  orderId: string;
  amount: number; // in rupees
  currency?: string;
  customerDetails: {
    name: string;
    email: string;
    phone: string;
  };
}

/**
 * POST /api/payments/create-order
 * Create a Razorpay order for payment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreatePaymentOrderRequest;
    const { orderId, amount, currency = 'INR', customerDetails } = body;

    // Validate inputs
    if (!orderId || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid order details' },
        { status: 400 }
      );
    }

    if (!customerDetails?.email || !customerDetails?.name) {
      return NextResponse.json(
        { success: false, error: 'Customer details are required' },
        { status: 400 }
      );
    }

    // Check if order exists
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Convert amount to paise (Razorpay uses paise)
    const amountInPaise = Math.round(amount * 100);

    // Create Razorpay order
    const razorpayResult = await createRazorpayOrder({
      amount: amountInPaise,
      currency,
      receipt: `order_${orderId}`,
      notes: {
        orderId,
        customerName: customerDetails.name,
        customerEmail: customerDetails.email
      }
    });

    if (!razorpayResult.success || !razorpayResult.order) {
      return NextResponse.json(
        { success: false, error: razorpayResult.error || 'Failed to create payment order' },
        { status: 500 }
      );
    }

    // Update order with Razorpay order ID
    await supabaseAdmin
      .from('orders')
      .update({
        razorpay_order_id: razorpayResult.order.id,
        payment_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    return NextResponse.json({
      success: true,
      razorpayOrderId: razorpayResult.order.id,
      amount: amountInPaise,
      currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_TEST_KEY_ID
    }, { status: 200 });
  } catch (error) {
    console.error('Create payment order error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create payment order' 
      },
      { status: 500 }
    );
  }
}
