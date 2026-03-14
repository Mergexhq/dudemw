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
    // Only grant free shipping if ALL cart items resolve to products AND all have free_shipping = true.
    // If any item cannot be resolved, we fall through to standard zone-based pricing (safe default).
    if (variantIds && variantIds.length > 0) {
      // Step 1: Resolve variant IDs → product IDs (only via product_variants table)
      const variantRows = await prisma.product_variants.findMany({
        where: { id: { in: variantIds } },
        select: { id: true, product_id: true }
      });

      // Build a map of variantId → productId for resolved variants
      const resolvedVariantMap = new Map<string, string>();
      for (const row of variantRows) {
        if (row.product_id) resolvedVariantMap.set(row.id, row.product_id);
      }

      // If every cart item was resolved to a product ID, we can safely check free_shipping
      const allResolved = variantIds.every(vid => resolvedVariantMap.has(vid));
      const resolvedProductIds = [...new Set(Array.from(resolvedVariantMap.values()))];

      if (allResolved && resolvedProductIds.length > 0) {
        // Step 2: Check free_shipping flag — only on properly resolved products
        const products = await prisma.products.findMany({
          where: { id: { in: resolvedProductIds } },
          select: { id: true, free_shipping: true }
        });

        // Only grant free shipping if we found records for all product IDs AND all are free
        if (products.length === resolvedProductIds.length) {
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
      // If not all items resolved or not all are free-shipping, fall through to zone-based calculation
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
