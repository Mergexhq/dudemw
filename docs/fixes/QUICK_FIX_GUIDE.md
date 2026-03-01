# 🚀 Quick Fix Guide: Replace Service Calls

## Common Replacements

### ❌ Old Service Calls → ✅ Direct Supabase Calls

```typescript
// 1. Get product by slug
// OLD: ProductsService.getProductBySlug(slug)
const { data: product } = await supabase
  .from('products')
  .select('*')
  .eq('slug', slug)
  .single()

// 2. Get all products
// OLD: ProductsService.getProducts(limit)
const { data: products } = await supabase
  .from('products')
  .select('*')
  .eq('in_stock', true)
  .limit(limit || 20)

// 3. Get products by category
// OLD: ProductsService.getProductsByCategory(categorySlug)
const { data: category } = await supabase
  .from('categories')
  .select('id')
  .eq('slug', categorySlug)
  .single()

const { data: products } = await supabase
  .from('products')
  .select('*')
  .eq('category_id', category?.id)
  .eq('in_stock', true)

// 4. Get bestsellers
// OLD: ProductsService.getBestsellers(limit)
const { data: products } = await supabase
  .from('products')
  .select('*')
  .eq('is_bestseller', true)
  .eq('in_stock', true)
  .limit(limit || 8)

// 5. Get new drops
// OLD: ProductsService.getNewDrops(limit)
const { data: products } = await supabase
  .from('products')
  .select('*')
  .eq('is_new_drop', true)
  .eq('in_stock', true)
  .limit(limit || 8)

// 6. Get categories
// OLD: ProductsService.getCategories()
const { data: categories } = await supabase
  .from('categories')
  .select('*')
  .order('name')

// 7. Search products
// OLD: ProductsService.searchProducts(query)
const { data: products } = await supabase
  .from('products')
  .select('*')
  .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
  .eq('in_stock', true)

// 8. Get banners
// OLD: getBanners()
const { data: banners } = await supabase
  .from('banners')
  .select('*')
  .eq('is_active', true)
  .order('sort_order')

// 9. Update variant stock
// OLD: updateVariantStock(variantId, stock)
const { data } = await supabase
  .from('product_variants')
  .update({ stock })
  .eq('id', variantId)
```

## Example File Fix

### Before (src/app/(store)/products/[slug]/page.tsx)
```typescript
const product = await ProductsService.getProductBySlug(slug)
const allProducts = await ProductsService.getProducts(20)
```

### After
```typescript
const { data: product } = await supabase
  .from('products')
  .select('*')
  .eq('slug', slug)
  .single()

const { data: allProducts } = await supabase
  .from('products')
  .select('*')
  .eq('in_stock', true)
  .limit(20)
```

## Type Compatibility Fix

For the Product type errors, make the new fields optional temporarily:

```typescript
// In src/domains/product/types/index.ts
export interface Product {
  // ... existing fields
  is_featured?: boolean        // Make optional
  is_on_sale?: boolean        // Make optional
  discount_percentage?: number
  badge_text?: string | null
  badge_color?: string | null
}
```

## Quick Commands

1. **Find all ProductsService usage:**
   ```bash
   grep -r "ProductsService\." src/
   ```

2. **Find all getBanners usage:**
   ```bash
   grep -r "getBanners" src/
   ```

3. **Find all updateVariantStock usage:**
   ```bash
   grep -r "updateVariantStock" src/
   ```

## Priority Files to Fix First

1. `src/app/(store)/products/[slug]/page.tsx` - Product detail page
2. `src/domains/product/components/pages/ProductsPage.tsx` - Product listing
3. `src/domains/homepage/sections/Hero.tsx` - Homepage banners
4. `src/lib/layout/layout/megamenu/MegaMenu.tsx` - Navigation

Fix these 4 files first to get the main functionality working!