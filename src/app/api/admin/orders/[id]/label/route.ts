import { NextRequest, NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { ShippingLabel } from '@/pdf/ShippingLabel';
import { supabaseAdmin } from '@/lib/supabase/supabase';
import { getCurrentAdmin } from '@/lib/admin-auth';
import QRCode from 'qrcode';
import React from 'react';

/**
 * GET /api/admin/orders/[id]/label
 * Generate and download shipping label PDF for a single order
 * Admin/Manager access only
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authentication & Authorization
    const adminData = await getCurrentAdmin();

    if (!adminData || !adminData.profile) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    // Check if user has admin or manager role
    const allowedRoles = ['super_admin', 'admin', 'manager'];
    if (!allowedRoles.includes(adminData.profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions. Admin or Manager role required.' },
        { status: 403 }
      );
    }

    // Check if admin is active
    if (!adminData.profile.is_active) {
      return NextResponse.json(
        { success: false, error: 'Admin account is not active.' },
        { status: 403 }
      );
    }

    // 2. Get Order ID from params
    const { id: orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required.' },
        { status: 400 }
      );
    }

    // 3. Fetch Order Data from Database
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(
        `
        id,
        order_number,
        created_at,
        customer_name_snapshot,
        customer_phone_snapshot,
        shipping_address,
        payment_method,
        order_items (
          quantity
        )
      `
      )
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order fetch error:', orderError);
      return NextResponse.json(
        { success: false, error: 'Order not found.' },
        { status: 404 }
      );
    }

    // 4. Generate QR Code
    let qrCodeDataUrl: string | undefined;
    try {
      const orderNumber = order.order_number || `#${order.id.substring(0, 8).toUpperCase()}`;
      qrCodeDataUrl = await QRCode.toDataURL(orderNumber, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
    } catch (qrError) {
      console.error('QR Code generation error:', qrError);
      // Continue without QR code if generation fails
    }

    // 5. Generate PDF
    const pdfStream = await renderToStream(
      React.createElement(ShippingLabel, { order, qrCodeDataUrl })
    );

    // 6. Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    // 7. Return PDF as downloadable response
    const orderNumber = order.order_number || order.id.substring(0, 8).toUpperCase();
    const filename = `shipping-label-${orderNumber}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Shipping label generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate shipping label',
      },
      { status: 500 }
    );
  }
}
