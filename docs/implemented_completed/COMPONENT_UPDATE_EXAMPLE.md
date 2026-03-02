# 🔧 Component Update Example: Dynamic Badges

## Before (Hardcoded Badges)

```typescript
interface ProductCardProps {
  product: Product
  badge?: "NEW" | "BESTSELLER" | "SALE" | string
  badgeColor?: "red" | "black"
}

export default function ProductCard({ product, badge, badgeColor = "red" }: ProductCardProps) {
  // Hardcoded badge logic
  return (
    <div>
      {badge && (
        <span className={`badge ${badgeColor}`}>
          {badge}
        </span>
      )}
    </div>
  )
}
```

## After (Database-Driven Badges)

```typescript
import { getProductBadge } from '@/domains/product/utils/badgeUtils'

interface ProductCardProps {
  product: Product
  showBadge?: boolean
}

export default function ProductCard({ product, showBadge = true }: ProductCardProps) {
  const badge = showBadge ? getProductBadge(product) : null
  
  return (
    <div>
      {badge && (
        <span className={`badge badge-${badge.color}`}>
          {badge.text}
        </span>
      )}
      
      {/* Price with sale logic */}
      <div className="price">
        <span className="current-price">₹{product.price}</span>
        {product.original_price && product.price < product.original_price && (
          <span className="original-price">₹{product.original_price}</span>
        )}
      </div>
    </div>
  )
}
```

## CSS Classes for Badge Colors

```css
.badge {
  @apply px-2 py-1 text-xs font-semibold rounded;
}

.badge-red {
  @apply bg-red-500 text-white;
}

.badge-black {
  @apply bg-black text-white;
}

.badge-green {
  @apply bg-green-500 text-white;
}

.badge-blue {
  @apply bg-blue-500 text-white;
}
```

## Usage in Product Lists

```typescript
// No need to pass badge props anymore
<ProductCard product={product} />

// The component automatically determines the badge from product data
```

## Supabase Query Example

```typescript
// Fetch products with all badge-related fields
const { data: products } = await supabase
  .from('products')
  .select(`
    *,
    is_bestseller,
    is_new_drop,
    is_featured,
    is_on_sale,
    discount_percentage,
    badge_text,
    badge_color,
    original_price
  `)
  .eq('in_stock', true)
```

## Benefits

✅ **No more prop drilling** - Badge logic is self-contained  
✅ **Consistent badges** - Same logic across all components  
✅ **Admin control** - Marketing team can set badges in Supabase  
✅ **Automatic sales** - Sale badges appear when price < original_price  
✅ **Priority system** - Shows most important badge when multiple apply