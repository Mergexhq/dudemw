import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { OrderDetailsPDF } from '@/pdf/OrderDetailsPDF';
import prisma from '@/lib/db';
import { verifyOrderToken } from '@/lib/utils/order-token';
import React from 'react';

/**
 * GET /api/orders/[orderId]/details?token=<TOKEN>
 * Public endpoint for downloading order details PDF via QR code
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        const { orderId } = await params;
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

        // Fetch order details with variant and product info
        const order = await prisma.orders.findUnique({
            where: { id: orderId },
            include: {
                order_items: {
                    include: {
                        product_variants: {
                            include: {
                                product: {
                                    select: { title: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Generate PDF
        const element = React.createElement(OrderDetailsPDF, { order: order as any });
        const pdfBuffer = await renderToBuffer(element as any);

        // Return PDF as downloadable file
        const shortId = order.id.substring(0, 8);
        const filename = `order-${shortId}-details.pdf`;

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
