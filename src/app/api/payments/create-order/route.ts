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

    // Debug: Log environment check
    console.log('[Razorpay] Create order request:', { orderId, amount, currency, customerDetails });
    console.log('[Razorpay] Key ID present:', !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
    console.log('[Razorpay] Secret present:', !!process.env.RAZORPAY_KEY_SECRET);

    // Validate inputs
    if (!orderId || !amount || isNaN(amount) || amount <= 0) {
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
    // Receipt must be max 40 chars, so we use a shortened version
    const shortReceipt = `ord_${orderId.slice(-32)}`; // 4 + 32 = 36 chars
    const razorpayResult = await createRazorpayOrder({
      amount: amountInPaise,
      currency,
      receipt: shortReceipt,
      notes: {
        orderId,
        customerName: customerDetails.name,
        customerEmail: customerDetails.email
      }
    });

    if (!razorpayResult.success || !razorpayResult.order) {
      console.error('[Razorpay] Order creation failed:', razorpayResult.error);
      return NextResponse.json(
        {
          success: false,
          error: razorpayResult.error || 'Failed to create payment order',
          debug: {
            keyIdPresent: !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            secretPresent: !!process.env.RAZORPAY_KEY_SECRET
          }
        },
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
