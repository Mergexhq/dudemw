import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { ShippingLabel } from '@/pdf/ShippingLabel';
import { supabaseAdmin } from '@/lib/supabase/supabase';
import { getCurrentAdmin } from '@/lib/admin-auth';
import QRCode from 'qrcode';
import { PDFDocument } from 'pdf-lib';

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

    for (const order of orders) {
      try {
        // Generate QR Code for this order
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
          console.error(`QR Code generation error for order ${order.id}:`, qrError);
        }

        // Generate PDF for this order
        const pdfBuffer = await renderToBuffer(
          <ShippingLabel order={order} qrCodeDataUrl={qrCodeDataUrl} />
        );

        pdfBuffers.push(pdfBuffer);
      } catch (pdfError) {
        console.error(`PDF generation error for order ${order.id}:`, pdfError);
        // Continue with other orders even if one fails
      }
    }

    if (pdfBuffers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate any shipping labels.' },
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
