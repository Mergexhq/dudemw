import { NextRequest, NextResponse } from 'next/server';
import { createRazorpayOrder, isRazorpayConfigured, getRazorpayKeyId } from '@/lib/services/razorpay';
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
    
    // Check Razorpay configuration first
    const razorpayConfig = isRazorpayConfigured();
    console.log('[Razorpay] Configuration check:', razorpayConfig);
    
    if (!razorpayConfig.configured) {
      console.error('[Razorpay] Configuration error:', razorpayConfig.error);
      return NextResponse.json(
        {
          success: false,
          error: 'Payment gateway is not properly configured. Please contact support.',
          debug: {
            configError: razorpayConfig.error,
            hint: 'Check NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables in Hostinger'
          }
        },
        { status: 500 }
      );
    }

    // Validate inputs
    if (!orderId || !amount || isNaN(amount) || amount <= 0) {
      console.error('[Razorpay] Invalid order details:', { orderId, amount });
      return NextResponse.json(
        { success: false, error: 'Invalid order details' },
        { status: 400 }
      );
    }

    if (!customerDetails?.email || !customerDetails?.name) {
      console.error('[Razorpay] Missing customer details');
      return NextResponse.json(
        { success: false, error: 'Customer details are required' },
        { status: 400 }
      );
    }

    // Check if order exists
    console.log('[Razorpay] Checking if order exists:', orderId);
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error('[Razorpay] Database error when fetching order:', orderError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to verify order in database',
          debug: { dbError: orderError.message }
        },
        { status: 500 }
      );
    }

    if (!order) {
      console.error('[Razorpay] Order not found:', orderId);
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    console.log('[Razorpay] Order found, creating Razorpay order...');

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
            razorpayError: razorpayResult.error,
            hint: 'This could be due to invalid Razorpay credentials or network issues'
          }
        },
        { status: 500 }
      );
    }

    console.log('[Razorpay] Razorpay order created:', razorpayResult.order.id);

    // Update order with Razorpay order ID
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        razorpay_order_id: razorpayResult.order.id,
        payment_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('[Razorpay] Failed to update order with Razorpay ID:', updateError);
      // Continue anyway as the Razorpay order was created successfully
    }

    const keyId = getRazorpayKeyId();
    console.log('[Razorpay] Payment order created successfully, returning key ID');

    return NextResponse.json({
      success: true,
      razorpayOrderId: razorpayResult.order.id,
      amount: amountInPaise,
      currency,
      keyId: keyId
    }, { status: 200 });
  } catch (error) {
    console.error('[Razorpay] Create payment order error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment order',
        debug: {
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          hint: 'Check server logs for more details'
        }
      },
      { status: 500 }
    );
  }
}
