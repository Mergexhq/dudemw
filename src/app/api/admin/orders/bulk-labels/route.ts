import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { ShippingLabel } from '@/pdf/ShippingLabel';
import { supabaseAdmin } from '@/lib/supabase/supabase';
import { getCurrentAdmin } from '@/lib/admin-auth';
import QRCode from 'qrcode';
import { PDFDocument } from 'pdf-lib';
import React from 'react';

/**
 * POST /api/admin/orders/bulk-labels
 * Generate and download shipping labels for multiple orders
 * Admin/Manager access only
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication & Authorization
    const adminData = await getCurrentAdmin();

    if (!adminData || !adminData.profile) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    // Check permission
    const { hasPermission } = await import('@/lib/services/permissions');
    const canManageOrders = await hasPermission(adminData.user.id, 'order.manage');

    if (!canManageOrders) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions. Order management permission required.' },
        { status: 403 }
      );
    }

    // 2. Get Order IDs from request body
    const body = await request.json();
    const { orderIds } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order IDs array is required and must not be empty.' },
        { status: 400 }
      );
    }

    // Limit to 50 orders at a time to prevent timeout
    if (orderIds.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Maximum 50 orders can be processed at once.' },
        { status: 400 }
      );
    }

    // 3. Fetch Orders Data from Database
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select(
        `
        *,
        order_items (
          quantity
        )
      `
      )
      .in('id', orderIds);

    if (ordersError || !orders || orders.length === 0) {
      console.error('Orders fetch error:', ordersError);
      return NextResponse.json(
        { success: false, error: 'No orders found with the provided IDs.' },
        { status: 404 }
      );
    }

    // 4. Generate PDFs for each order
    const pdfBuffers: Buffer[] = [];

    const errors: any[] = [];

    for (const order of orders) {
      try {
        // Generate QR Code URL for this order
        let qrCodeDataUrl: string | undefined;
        try {
          const { generateOrderToken } = await import('@/lib/utils/order-token');
          const token = generateOrderToken(order.id);
          const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dudemw.com';
          const orderDetailsUrl = `${baseUrl}/api/orders/${order.id}/details?token=${token}`;

          qrCodeDataUrl = await QRCode.toDataURL(orderDetailsUrl, {
            width: 200,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
          });
        } catch (qrError) {
          console.error(`QR Code generation error for order ${order.id}:`, qrError);
        }

        // Generate PDF for this order
        try {
          const element = React.createElement(ShippingLabel, {
            order: order as any,
            qrCodeDataUrl: qrCodeDataUrl
          });

          const pdfBuffer = await renderToBuffer(element as any);
          pdfBuffers.push(pdfBuffer);
        } catch (innerPdfError) {
          console.error(`Inner PDF generation error for order ${order.id}:`, innerPdfError);
          throw innerPdfError;
        }

      } catch (pdfError: any) {
        console.error(`PDF generation error for order ${order.id}:`, pdfError);
        errors.push({ orderId: order.id, error: pdfError?.message || String(pdfError) });
      }
    }

    if (pdfBuffers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to generate any shipping labels.',
          details: errors
        },
        { status: 500 }
      );
    }

    // 5. Merge all PDFs into a single document
    const mergedPdf = await PDFDocument.create();

    for (const pdfBuffer of pdfBuffers) {
      try {
        const pdf = await PDFDocument.load(pdfBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
        });
      } catch (mergeError) {
        console.error('PDF merge error:', mergeError);
        // Continue with other PDFs
      }
    }

    // 6. Save merged PDF
    const mergedPdfBytes = await mergedPdf.save();
    const finalBuffer = Buffer.from(mergedPdfBytes);

    // 7. Return merged PDF as downloadable response
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `shipping-labels-bulk-${timestamp}.pdf`;

    return new NextResponse(finalBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': finalBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Bulk shipping labels generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate bulk shipping labels',
      },
      { status: 500 }
    );
  }
}
