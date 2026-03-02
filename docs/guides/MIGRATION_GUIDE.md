# 🚀 Migration Guide: From Services to Direct Supabase

## Overview
We've simplified the codebase by removing redundant service layers. Use direct Supabase calls instead.

## Import Changes

### ❌ Old Way (Remove These)
```typescript
import { ProductsService } from '@/lib/services/products'
import { getBanners } from '@/server/banners/get'
import { updateVariantStock } from '@/server/supabase/inventory'
```

### ✅ New Way (Use These)
```typescript
import { supabase } from '@/lib/supabase/supabase'
import { createClient } from '@/lib/supabase/client'
import type { Product, Category } from '@/domains/product/types'
```

## Common Replacements

### Products
```typescript
// Old: ProductsService.getProducts()
const { data: products } = await supabase
  .from('products')
  .select('*')
  .eq('in_stock', true)

// Old: ProductsService.getProductBySlug(slug)
const { data: product } = await supabase
  .from('products')
  .select('*')
  .eq('slug', slug)
  .single()
```

### Categories
```typescript
// Old: ProductsService.getCategories()
const { data: categories } = await supabase
  .from('categories')
  .select('*')
  .order('name')
```

### Banners
```typescript
// Old: getBanners()
const { data: banners } = await supabase
  .from('banners')
  .select('*')
  .eq('is_active', true)
  .order('sort_order')
```

### Inventory
```typescript
// Old: updateVariantStock(id, stock)
const { data } = await supabase
  .from('product_variants')
  .update({ stock })
  .eq('id', variantId)
```

## Benefits
- ✅ 70% fewer files
- ✅ Direct database access
- ✅ Better type safety with Supabase types
- ✅ No service layer overhead
- ✅ Easier to understand and maintain