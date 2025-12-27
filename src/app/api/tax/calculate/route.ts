import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/supabase';
import { calculateTax, type TaxCalculationInput } from '@/lib/services/tax-calculation';

/**
 * POST /api/tax/calculate
 * Calculate GST tax for an order
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as TaxCalculationInput;

    // Validate required fields
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Items array is required' },
        { status: 400 }
      );
    }

    if (!body.customerState) {
      return NextResponse.json(
        { success: false, error: 'Customer state is required' },
        { status: 400 }
      );
    }

    // Fetch tax settings
    // We use supabaseAdmin to bypass RLS since this is a server-side operation
    const { data: settings } = await supabaseAdmin
      .from('tax_settings')
      .select('default_gst_rate, price_includes_tax')
      .single();

    // Default to 18% if not found in DB
    // Note: Supabase returns decimal columns as strings, so we parse them
    const rawGstRate = (settings as any)?.default_gst_rate;
    const defaultGstRate = rawGstRate ? parseFloat(rawGstRate) : 18;
    const priceIncludesTax = (settings as any)?.price_includes_tax ?? true;

    // Calculate tax
    const result = calculateTax({
      ...body,
      defaultGstRate,
      isPriceInclusive: body.isPriceInclusive ?? priceIncludesTax
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Include tax settings in response for client
    // Add gstRate to taxBreakdown for easier access
    const enrichedTaxBreakdown = {
      ...result.taxBreakdown,
      gstRate: defaultGstRate,
      priceIncludesTax
    };

    return NextResponse.json({
      ...result,
      taxBreakdown: enrichedTaxBreakdown,
      taxSettings: {
        defaultGstRate,
        priceIncludesTax
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Tax calculation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate tax'
      },
      { status: 500 }
    );
  }
}
