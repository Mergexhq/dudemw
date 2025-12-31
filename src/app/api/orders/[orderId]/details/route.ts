import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { OrderDetailsPDF } from '@/pdf/OrderDetailsPDF';
import { supabaseAdmin } from '@/lib/supabase/supabase';
import { verifyOrderToken } from '@/lib/utils/order-token';
import React from 'react';

/**
 * GET /api/orders/[orderId]/details?token=<TOKEN>
 * Public endpoint for downloading order details PDF via QR code
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { orderId: string } }
) {
    try {
        const { orderId } = params;
        const searchParams = request.nextUrl.searchParams;
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json(
                { error: 'Token is required' },
                { status: 400 }
            );
        }

        // Verify token
        const verifiedOrderId = verifyOrderToken(token);
        if (!verifiedOrderId || verifiedOrderId !== orderId) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 403 }
            );
        }

        // Fetch order details
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select(`
        *,
        order_items (
          product_name_snapshot,
          variant_name_snapshot,
          quantity,
          price_snapshot,
          total
        )
      `)
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            console.error('Order fetch error:', orderError);
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Generate PDF
        const element = React.createElement(OrderDetailsPDF, { order: order as any });
        const pdfBuffer = await renderToBuffer(element as any);

        // Return PDF as downloadable file
        const orderNumber = order.order_number || `order-${order.id.substring(0, 8)}`;
        const filename = `${orderNumber}-details.pdf`;

        return new NextResponse(Buffer.from(pdfBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': pdfBuffer.length.toString(),
            },
        });
    } catch (error) {
        console.error('Order details PDF generation error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Failed to generate order details PDF',
            },
            { status: 500 }
        );
    }
}
