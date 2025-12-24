import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/supabase';
import {
  isValidAWBNumber,
  formatAWBNumber,
  formatTrackingInfo
} from '@/lib/services/tracking';
import { EmailService } from '@/lib/services/resend';

/**
 * POST /api/admin/orders/[orderId]/tracking
 * Update order with tracking information (Admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await request.json();
    const { awbNumber, shippedDate } = body;

    // Validate AWB number
    if (!awbNumber || !isValidAWBNumber(awbNumber)) {
      return NextResponse.json(
        { success: false, error: 'Invalid AWB number format. Must be 10-12 digits.' },
        { status: 400 }
      );
    }

    // Format AWB number
    const formattedAwb = formatAWBNumber(awbNumber);

    // Get order details
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        shipping_address:addresses(*)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Generate tracking info
    const trackingInfo = formatTrackingInfo(formattedAwb, shippedDate);

    // Update order with tracking information
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'shipped',
        tracking_number: formattedAwb,
        tracking_url: trackingInfo.trackingUrl,
        tracking_courier: 'ST Courier',
        shipped_at: trackingInfo.shippedDate instanceof Date ? trackingInfo.shippedDate.toISOString() : trackingInfo.shippedDate,
        estimated_delivery: trackingInfo.estimatedDelivery instanceof Date ? trackingInfo.estimatedDelivery.toISOString() : trackingInfo.estimatedDelivery,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Failed to update order tracking:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update tracking information' },
        { status: 500 }
      );
    }

    // Send tracking email to customer
    try {
      const customerName = (order.shipping_address as any)?.name?.split(' ')[0] || 'Customer';
      const customerEmail = order.guest_email || order.customer_email_snapshot;
      if (customerEmail) {
        await EmailService.sendOrderShipped(
          customerEmail,
          order.order_number || order.id,
          formattedAwb,
          trackingInfo.trackingUrl
        );
      }
    } catch (emailError) {
      console.error('Failed to send tracking email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      trackingInfo: {
        awbNumber: formattedAwb,
        trackingUrl: trackingInfo.trackingUrl,
        courier: 'ST Courier',
        status: 'shipped'
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Tracking update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update tracking'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/orders/[orderId]/tracking
 * Get tracking information for an order
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('tracking_number, tracking_url, tracking_courier, shipped_at, estimated_delivery, status:order_status')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      tracking: {
        awbNumber: order.tracking_number,
        trackingUrl: order.tracking_url,
        courier: order.tracking_courier,
        shippedAt: order.shipped_at,
        estimatedDelivery: order.estimated_delivery,
        status: order.status
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Get tracking error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get tracking'
      },
      { status: 500 }
    );
  }
}
