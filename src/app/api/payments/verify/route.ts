import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpayPayment, getRazorpayKeySecret, isRazorpayConfigured } from '@/lib/services/razorpay';
import { prisma } from '@/lib/db';
import { EmailService } from '@/lib/services/resend';

export const runtime = 'nodejs';

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  orderId: string;
}

export async function POST(request: NextRequest) {
  console.warn('[Verify] Payment verification started');
  try {
    const configCheck = isRazorpayConfigured();
    if (!configCheck.configured) {
      return NextResponse.json({ success: false, error: 'Payment gateway configuration error.' }, { status: 500 });
    }

    const body = await request.json() as VerifyPaymentRequest;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return NextResponse.json({ success: false, error: 'Missing payment verification data' }, { status: 400 });
    }

    const keySecret = getRazorpayKeySecret();
    if (!keySecret) {
      return NextResponse.json({ success: false, error: 'Payment configuration error: Secret key not found' }, { status: 500 });
    }

    let isValid = false;
    try {
      isValid = verifyRazorpayPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature });
    } catch (signatureError) {
      return NextResponse.json({ success: false, error: 'Payment signature verification failed' }, { status: 500 });
    }

    if (!isValid) {
      await prisma.orders.update({
        where: { id: orderId },
        data: { payment_status: 'failed' } as any,
      }).catch(() => { });
      return NextResponse.json({ success: false, error: 'Invalid payment signature' }, { status: 400 });
    }

    // Fetch full order
    const order = await prisma.orders.findUnique({ where: { id: orderId } }) as any;
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Create payment record
    await prisma.payments.create({
      data: {
        order_id: orderId,
        provider: 'razorpay',
        payment_id: razorpay_payment_id,
        status: 'paid',
        raw_response: { razorpay_order_id, razorpay_payment_id, razorpay_signature, verified_at: new Date().toISOString() },
      } as any,
    }).catch((e: any) => console.error('[Verify] Failed to create payment record:', e));

    // Update order status
    await prisma.orders.update({
      where: { id: orderId },
      data: { order_status: 'processing', payment_status: 'paid', payment_method: 'razorpay' } as any,
    });

    // Fetch order items for email
    let orderItems: any[] = [];
    try {
      const items = await prisma.order_items.findMany({
        where: { order_id: orderId } as any,
        include: { product_variants: { include: { products: true } } } as any,
      }) as any[];
      orderItems = items.map((item: any) => ({
        name: item.product_variants?.products?.title || 'Product',
        quantity: item.quantity,
        price: `₹${item.price}`,
        image: item.product_variants?.image_url,
      }));
    } catch (e) {
      console.error('[Verify] Failed to fetch order items for email:', e);
    }

    // Send confirmation email
    try {
      const shippingAddress = (order.shipping_address as any) || {};
      const customerName =
        shippingAddress?.firstName ||
        order.customer_name_snapshot?.split(' ')?.[0] ||
        'Customer';

      // customer_email_snapshot can be saved as "" (empty string) for some checkouts,
      // which is falsy — so we also look up the customers table as a fallback.
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
        if (customerEmail) {
          console.log(`[Verify] Resolved customer email from customers table for order ${orderId}`);
        }
      }

      if (customerEmail) {
        console.log(`[Verify] Sending confirmation email to ${customerEmail} for order ${orderId}`);
        await EmailService.sendOrderConfirmation(customerEmail, {
          customerName,
          orderNumber: order.id.slice(-8).toUpperCase(),
          orderTotal: `₹${order.total_amount}`,
          orderItems,
          shippingAddress: {
            name:
              shippingAddress?.name ||
              `${shippingAddress?.firstName || ''} ${shippingAddress?.lastName || ''}`.trim() ||
              '',
            address: shippingAddress?.address || shippingAddress?.address_line1 || '',
            city: shippingAddress?.city || '',
            state: shippingAddress?.state || '',
            postalCode: shippingAddress?.postalCode || shippingAddress?.pincode || '',
          },
        });
        console.log(`[Verify] Confirmation email sent successfully for order ${orderId}`);
      } else {
        console.warn(`[Verify] No customer email found for order ${orderId} — confirmation email skipped`);
      }
    } catch (emailError) {
      console.error('[Verify] Failed to send order confirmation email:', emailError);
    }

    return NextResponse.json({
      success: true,
      orderId,
      orderNumber: order.order_number,
      message: 'Payment verified successfully',
    });
  } catch (error) {
    console.error('[Verify] Payment verification error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Payment verification failed' },
      { status: 500 }
    );
  }
}
