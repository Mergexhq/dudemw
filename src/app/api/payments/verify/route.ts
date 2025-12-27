import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpayPayment, getRazorpayKeySecret, isRazorpayConfigured } from '@/lib/services/razorpay';
import { supabaseAdmin } from '@/lib/supabase/supabase';
import { EmailService } from '@/lib/services/resend';

// Force Node.js runtime for crypto module support
export const runtime = 'nodejs';

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
  console.log('[Verify] Payment verification started');
  console.log('[Verify] Environment check - RAZORPAY_KEY_SECRET exists:', !!process.env.RAZORPAY_KEY_SECRET);
  console.log('[Verify] Environment check - RAZORPAY_KEY_SECRET length:', process.env.RAZORPAY_KEY_SECRET?.length || 0);
  
  try {
    // Pre-check: Ensure Razorpay is properly configured before processing
    const configCheck = isRazorpayConfigured();
    if (!configCheck.configured) {
      console.error('[Verify] Razorpay not configured:', configCheck.error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Payment gateway configuration error. Please contact support.',
          debug: { configError: configCheck.error }
        },
        { status: 500 }
      );
    }

    const body = await request.json() as VerifyPaymentRequest;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = body;

    console.log('[Verify] Request body:', { 
      razorpay_order_id, 
      razorpay_payment_id: razorpay_payment_id?.slice(0, 10) + '...', 
      orderId 
    });

    // Validate inputs
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      console.error('[Verify] Missing fields:', { 
        razorpay_order_id: !!razorpay_order_id, 
        razorpay_payment_id: !!razorpay_payment_id, 
        razorpay_signature: !!razorpay_signature, 
        orderId: !!orderId 
      });
      return NextResponse.json(
        { success: false, error: 'Missing payment verification data' },
        { status: 400 }
      );
    }

    // Double-check secret is available right before verification
    const keySecret = getRazorpayKeySecret();
    if (!keySecret) {
      console.error('[Verify] CRITICAL: RAZORPAY_KEY_SECRET is not available at verification time');
      console.error('[Verify] Available env vars starting with RAZORPAY:', 
        Object.keys(process.env).filter(k => k.includes('RAZORPAY')).join(', '));
      return NextResponse.json(
        { 
          success: false, 
          error: 'Payment configuration error: Secret key not found',
          debug: { hint: 'RAZORPAY_KEY_SECRET environment variable is missing or empty' }
        },
        { status: 500 }
      );
    }

    console.log('[Verify] Key secret confirmed available, length:', keySecret.length);

    // Verify payment signature
    console.log('[Verify] Verifying signature...');
    let isValid = false;
    try {
      isValid = verifyRazorpayPayment({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      });
      console.log('[Verify] Signature verification result:', isValid);
    } catch (signatureError) {
      console.error('[Verify] Signature verification threw error:', signatureError);
      const errorMsg = signatureError instanceof Error ? signatureError.message : String(signatureError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Payment signature verification failed',
          debug: { verificationError: errorMsg }
        },
        { status: 500 }
      );
    }

    if (!isValid) {
      console.error('[Verify] Invalid signature for order:', orderId);
      // Update order as payment failed
      try {
        await supabaseAdmin
          .from('orders')
          .update({
            payment_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);
      } catch (updateErr) {
        console.error('[Verify] Failed to update order status to failed:', updateErr);
      }

      return NextResponse.json(
        { success: false, error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Get order details - using simpler query to avoid foreign key issues
    console.log('[Verify] Fetching order details for:', orderId);
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error('[Verify] Order fetch error:', orderError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch order: ' + orderError.message },
        { status: 500 }
      );
    }

    if (!order) {
      console.error('[Verify] Order not found:', orderId);
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    console.log('[Verify] Order found, updating status to paid...');

    // Update order as paid and move to processing
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        order_status: 'processing',
        payment_status: 'paid',
        payment_method: 'razorpay',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('[Verify] Order update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update order status: ' + updateError.message },
        { status: 500 }
      );
    }

    console.log('[Verify] Order status updated successfully');

    // Fetch order items separately for email
    let orderItems: any[] = [];
    try {
      const { data: items } = await supabaseAdmin
        .from('order_items')
        .select(`
          *,
          variants:product_variants(
            *,
            product:products(*)
          )
        `)
        .eq('order_id', orderId);
      
      orderItems = (items || []).map((item: any) => ({
        name: item.variants?.product?.title || 'Product',
        quantity: item.quantity,
        price: `₹${item.price}`,
        image: item.variants?.product?.images?.[0] || item.variants?.image_url
      }));
    } catch (itemsError) {
      console.error('[Verify] Failed to fetch order items for email:', itemsError);
      // Continue without items in email
    }

    // Send order confirmation email
    try {
      // shipping_address is stored as JSONB directly in the orders table
      const shippingAddress = (order as any).shipping_address || {};
      const customerName = shippingAddress?.firstName || 
        (order.customer_name_snapshot ? order.customer_name_snapshot.split(' ')[0] : 'Customer');
      const customerEmail = order.guest_email || order.customer_email_snapshot;

      if (customerEmail) {
        console.log('[Verify] Sending confirmation email to:', customerEmail);
        await EmailService.sendOrderConfirmation(customerEmail, {
          customerName,
          orderNumber: order.order_number || order.id,
          orderTotal: `₹${order.total_amount}`,
          orderItems,
          shippingAddress: {
            name: shippingAddress?.name || shippingAddress?.firstName || '',
            address: shippingAddress?.address_line1 || shippingAddress?.address || '',
            city: shippingAddress?.city || '',
            state: shippingAddress?.state || '',
            postalCode: shippingAddress?.pincode || shippingAddress?.postalCode || ''
          }
        });
        console.log('[Verify] Confirmation email sent successfully');
      }
    } catch (emailError) {
      console.error('[Verify] Failed to send order confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    console.log('[Verify] Payment verification completed successfully');
    return NextResponse.json({
      success: true,
      orderId,
      orderNumber: order.order_number,
      message: 'Payment verified successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('[Verify] Payment verification error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Payment verification failed';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('[Verify] Error details:', { message: errorMessage, stack: errorStack });
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    );
  }
}
