import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  isValidAWBNumber,
  formatAWBNumber,
  formatTrackingInfo
} from '@/lib/services/tracking';
import { EmailService } from '@/lib/services/resend';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();
    const { awbNumber, shippedDate } = body;

    if (!awbNumber || !isValidAWBNumber(awbNumber)) {
      return NextResponse.json({ success: false, error: 'Invalid AWB number format. Must be 10-12 digits.' }, { status: 400 });
    }

    const formattedAwb = formatAWBNumber(awbNumber);

    const order = await prisma.orders.findUnique({ where: { id: orderId } }) as any;
    if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });

    const trackingInfo = formatTrackingInfo(formattedAwb, shippedDate);

    await prisma.orders.update({
      where: { id: orderId },
      data: {
        order_status: 'shipped',
        tracking_number: formattedAwb,
        tracking_url: trackingInfo.trackingUrl,
        tracking_courier: 'ST Courier',
        shipped_at: trackingInfo.shippedDate instanceof Date ? trackingInfo.shippedDate : new Date(trackingInfo.shippedDate),
        estimated_delivery: trackingInfo.estimatedDelivery instanceof Date ? trackingInfo.estimatedDelivery : new Date(trackingInfo.estimatedDelivery),
      } as any,
    });

    try {
      const shippingAddress = (order.shipping_address as any) || {};
      const customerName = shippingAddress?.name?.split(' ')[0] || 'Customer';
      const customerEmail = order.guest_email || order.customer_email_snapshot;
      if (customerEmail) {
        await EmailService.sendOrderShipped(customerEmail, order.order_number || order.id, formattedAwb, trackingInfo.trackingUrl);
      }
    } catch (emailError) {
      console.error('Failed to send tracking email:', emailError);
    }

    return NextResponse.json({
      success: true,
      trackingInfo: { awbNumber: formattedAwb, trackingUrl: trackingInfo.trackingUrl, courier: 'ST Courier', status: 'shipped' },
    });
  } catch (error) {
    console.error('Tracking update error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update tracking' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      select: {
        tracking_number: true,
        tracking_url: true,
        tracking_courier: true,
        shipped_at: true,
        estimated_delivery: true,
        order_status: true,
      } as any,
    }) as any;

    if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });

    return NextResponse.json({
      success: true,
      tracking: {
        awbNumber: order.tracking_number,
        trackingUrl: order.tracking_url,
        courier: order.tracking_courier,
        shippedAt: order.shipped_at,
        estimatedDelivery: order.estimated_delivery,
        status: order.order_status,
      },
    });
  } catch (error) {
    console.error('Get tracking error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to get tracking' },
      { status: 500 }
    );
  }
}
