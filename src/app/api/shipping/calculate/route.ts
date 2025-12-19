import { NextRequest, NextResponse } from 'next/server';
import { calculateShipping, type ShippingCalculationInput } from '@/lib/services/shipping';

/**
 * POST /api/shipping/calculate
 * Calculate shipping cost based on PIN code and quantity
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postalCode, state, totalQuantity } = body as ShippingCalculationInput;

    // Validate required fields
    if (!postalCode) {
      return NextResponse.json(
        { success: false, error: 'Postal code is required' },
        { status: 400 }
      );
    }

    if (!totalQuantity || totalQuantity < 1) {
      return NextResponse.json(
        { success: false, error: 'Valid total quantity is required' },
        { status: 400 }
      );
    }

    // Calculate shipping
    const result = calculateShipping({
      postalCode,
      state,
      totalQuantity
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Shipping calculation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to calculate shipping' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/shipping/calculate
 * Calculate shipping via query parameters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const postalCode = searchParams.get('postalCode');
    const state = searchParams.get('state');
    const totalQuantity = searchParams.get('totalQuantity');

    if (!postalCode || !totalQuantity) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const result = calculateShipping({
      postalCode,
      state: state || undefined,
      totalQuantity: parseInt(totalQuantity, 10)
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Shipping calculation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to calculate shipping' 
      },
      { status: 500 }
    );
  }
}
