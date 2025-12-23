import { Product, ProductVariant } from '../types'

/**
 * Extracts image URLs from product_images array or uses existing images array
 */
function extractImages(rawProduct: any): string[] {
  // If product_images array exists (from DB join), extract URLs
  if (rawProduct.product_images && Array.isArray(rawProduct.product_images)) {
    return rawProduct.product_images
      .sort((a: any, b: any) => (a.is_primary ? -1 : 1) - (b.is_primary ? -1 : 1))
      .map((img: any) => img.image_url)
      .filter(Boolean)
  }
  // Otherwise use existing images array
  if (rawProduct.images && Array.isArray(rawProduct.images)) {
    return rawProduct.images
  }
  return []
}

/**
 * Resolves the default variant for a product
 * Priority:
 * 1. Use default_variant if already provided (from FK join)
 * 2. Find variant matching default_variant_id in product_variants array
 * 3. Return null if no default variant can be resolved
 */
function resolveDefaultVariant(rawProduct: any): ProductVariant | null {
  // 1. If default_variant is already provided (from FK join like products_default_variant_id_fkey)
  if (rawProduct.default_variant) {
    // Handle case where Supabase returns an array for single FK relation
    if (Array.isArray(rawProduct.default_variant) && rawProduct.default_variant.length > 0) {
      return rawProduct.default_variant[0] as ProductVariant
    }
    // Direct object
    if (typeof rawProduct.default_variant === 'object' && rawProduct.default_variant.id) {
      return rawProduct.default_variant as ProductVariant
    }
  }

  // 2. If we have default_variant_id and product_variants array, find the matching variant
  if (rawProduct.default_variant_id && rawProduct.product_variants && Array.isArray(rawProduct.product_variants)) {
    const matchingVariant = rawProduct.product_variants.find(
      (v: any) => v.id === rawProduct.default_variant_id
    )
    if (matchingVariant) {
      return matchingVariant as ProductVariant
    }
  }

  // 3. No default variant available
  return null
}

/**
 * Safely transforms raw Supabase product data to ensure non-null values where needed
 */
export function transformProduct(rawProduct: any): Product {
  const images = extractImages(rawProduct)
  const defaultVariant = resolveDefaultVariant(rawProduct)

  return {
    ...rawProduct,
    description: rawProduct.description || '',
    images: images,
    sizes: rawProduct.sizes || [],
    colors: rawProduct.colors || [],
    category_id: rawProduct.category_id || '',
    original_price: rawProduct.original_price || rawProduct.compare_price || undefined,
    is_featured: rawProduct.is_featured || false,
    is_bestseller: rawProduct.is_bestseller || false,
    is_new_drop: rawProduct.is_new_drop || false,
    is_on_sale: rawProduct.is_on_sale || (rawProduct.compare_price && rawProduct.compare_price > rawProduct.price),
    discount_percentage: rawProduct.discount_percentage || undefined,
    created_at: rawProduct.created_at || new Date().toISOString(),
    updated_at: rawProduct.updated_at || new Date().toISOString(),
    // Set the resolved default_variant
    default_variant: defaultVariant,
    // Preserve product_variants array if present
    product_variants: rawProduct.product_variants || null,
  }
}

/**
 * Transforms an array of raw products
 */
export function transformProducts(rawProducts: any[]): Product[] {
  return (rawProducts || []).map(transformProduct)
}