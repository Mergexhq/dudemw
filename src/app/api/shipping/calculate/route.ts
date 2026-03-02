import { NextRequest, NextResponse } from 'next/server';
import { calculateShipping, type ShippingCalculationInput } from '@/lib/services/shipping';
import prisma from '@/lib/db';

// Label shown when all cart items qualify for free shipping
const FREE_DELIVERY_LABEL = 'Free Delivery 🎉';

/**
 * POST /api/shipping/calculate
 * Calculate shipping cost based on PIN code, quantity, and optional variant/product IDs.
 * If ALL cart items belong to products with free_shipping = true, returns ₹0.
 *
 * variantIds may contain either variant UUIDs or product UUIDs (fallback when no variant matched).
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
    if (variantIds && variantIds.length > 0) {
      // Step 1: Resolve variant IDs → product IDs
      const variantRows = await prisma.product_variants.findMany({
        where: { id: { in: variantIds } },
        select: { product_id: true }
      });

      const variantProductIds = variantRows.map(v => v.product_id).filter(Boolean) as string[];
      const allProductIds = [...new Set([...variantProductIds, ...variantIds])];

      if (allProductIds.length > 0) {
        // Step 2: Check free_shipping flag on all resolved products
        const products = await prisma.products.findMany({
          where: { id: { in: allProductIds } },
          select: { id: true, free_shipping: true }
        });

        if (products.length > 0) {
          const allFreeShipping = products.every(p => p.free_shipping === true);

          if (allFreeShipping) {
            return NextResponse.json({
              success: true,
              amount: 0,
              optionName: FREE_DELIVERY_LABEL,
              description: 'Complimentary shipping on this order',
              isTamilNadu: false,
              estimatedDelivery: '',
              isFreeShipping: true,
            });
          }
        }
      }
    }

    // Standard zone-based shipping calculation
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
