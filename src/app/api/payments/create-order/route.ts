import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createRazorpayOrder, isRazorpayConfigured, getRazorpayKeyId } from '@/lib/services/razorpay';
import { prisma } from '@/lib/db';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreatePaymentOrderRequest;
    const { orderId, amount, currency = 'INR', customerDetails } = body;

    // [C-1] Require authenticated session — no anonymous payment creation
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // Redact PII from logs
    console.log('[Razorpay] Create order request:', { orderId, amount, currency });

    const razorpayConfig = isRazorpayConfigured();
    if (!razorpayConfig.configured) {
      return NextResponse.json(
        { success: false, error: 'Payment gateway is not properly configured.', debug: { configError: razorpayConfig.error } },
        { status: 500 }
      );
    }

    if (!orderId || !amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid order details' }, { status: 400 });
    }

    if (!customerDetails?.phone) {
      return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
    }

    // Check if order exists and belongs to this user (C-1 ownership check)
    const order = await prisma.orders.findUnique({ where: { id: orderId } }) as any;
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }
    if (order.user_id && order.user_id !== userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const amountInPaise = Math.round(amount * 100);
    const shortReceipt = `ord_${orderId.slice(-32)}`;
    const razorpayResult = await createRazorpayOrder({
      amount: amountInPaise,
      currency,
      receipt: shortReceipt,
      notes: {
        orderId,
        customerName: customerDetails.name || 'Guest',
        customerEmail: customerDetails.email || 'noemail@guest.com',
        customerPhone: customerDetails.phone,
      }
    });

    if (!razorpayResult.success || !razorpayResult.order) {
      return NextResponse.json(
        { success: false, error: razorpayResult.error || 'Failed to create payment order' },
        { status: 500 }
      );
    }

    // Update order with Razorpay ID
    await prisma.orders.update({
      where: { id: orderId },
      data: { razorpay_order_id: razorpayResult.order.id, payment_status: 'pending' } as any,
    }).catch((e: any) => console.error('[Razorpay] Failed to update order with Razorpay ID:', e));

    const keyId = getRazorpayKeyId();
    return NextResponse.json({
      success: true,
      razorpayOrderId: razorpayResult.order.id,
      amount: amountInPaise,
      currency,
      keyId,
    });
  } catch (error) {
    console.error('[Razorpay] Create payment order error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
