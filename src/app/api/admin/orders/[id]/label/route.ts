import { NextRequest, NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { ShippingLabel } from '@/pdf/ShippingLabel';
import { prisma } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/admin-auth';
import QRCode from 'qrcode';
import React from 'react';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminData = await getCurrentAdmin();
    if (!adminData || !adminData.profile) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const allowedRoles = ['super_admin', 'admin', 'manager'];
    if (!allowedRoles.includes(adminData.profile.role)) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions.' }, { status: 403 });
    }

    if (!adminData.profile.is_active) {
      return NextResponse.json({ success: false, error: 'Admin account is not active.' }, { status: 403 });
    }

    const { id: orderId } = await params;
    if (!orderId) return NextResponse.json({ success: false, error: 'Order ID is required.' }, { status: 400 });

    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        order_items: {
          include: {
            product_variants: {
              include: {
                product: true
              }
            }
          }
        }
      },
    }) as any;

    if (!order) return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });

    let qrCodeDataUrl: string | undefined;
    try {
      const { generateOrderToken } = await import('@/lib/utils/order-token');
      const token = generateOrderToken(order.id);
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dudemw.com';
      const orderDetailsUrl = `${baseUrl}/api/orders/${order.id}/details?token=${token}`;
      qrCodeDataUrl = await QRCode.toDataURL(orderDetailsUrl, { width: 200, margin: 1, color: { dark: '#000000', light: '#FFFFFF' } });
    } catch (qrError) {
      console.error('QR Code generation error:', qrError);
    }

    const pdfStream = await renderToStream(React.createElement(ShippingLabel, { order, qrCodeDataUrl }) as any);
    const chunks: Buffer[] = [];
    for await (const chunk of pdfStream) { chunks.push(Buffer.from(chunk)); }
    const pdfBuffer = Buffer.concat(chunks);

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
      { success: false, error: error instanceof Error ? error.message : 'Failed to generate shipping label' },
      { status: 500 }
    );
  }
}
