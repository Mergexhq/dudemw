import { NextRequest, NextResponse } from 'next/server';
import { calculateShipping, type ShippingCalculationInput } from '@/lib/services/shipping';
import { supabaseAdmin } from '@/lib/supabase/supabase';

// How many items in the cart get free shipping
const FREE_DELIVERY_LABEL = 'Free Delivery 🎉';

/**
 * POST /api/shipping/calculate
 * Calculate shipping cost based on PIN code, quantity, and optional variant IDs.
 * If all cart variants belong to products with free_shipping = true, shipping = ₹0.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postalCode, state, totalQuantity, variantIds } = body as ShippingCalculationInput & { variantIds?: string[] };

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

    // --- Free Shipping Check ---
    // If variant IDs are provided, check whether ALL products have free_shipping = true
    if (variantIds && variantIds.length > 0) {
      const { data: variants } = await supabaseAdmin
        .from('product_variants')
        .select('product_id, products!inner(free_shipping)')
        .in('id', variantIds);

      if (variants && variants.length > 0) {
        const allFreeShipping = variants.every(
          (v: any) => v.products?.free_shipping === true
        );

        if (allFreeShipping) {
          return NextResponse.json({
            success: true,
            amount: 0, // ₹0 in paise
            optionName: FREE_DELIVERY_LABEL,
            description: 'Complimentary shipping on this order',
            isTamilNadu: false,
            estimatedDelivery: '',
            isFreeShipping: true,
          });
        }
      }
    }

    // Calculate shipping
    const result = await calculateShipping({
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

    // Calculate shipping
    const result = await calculateShipping({
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
