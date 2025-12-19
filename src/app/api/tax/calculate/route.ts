import { NextRequest, NextResponse } from 'next/server';
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

    // Calculate tax
    const result = calculateTax(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result, { status: 200 });
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
