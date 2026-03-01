# 🗄️ Database Schema Updates for Dynamic Badges

## Products Table Updates

Add these columns to your `products` table in Supabase:

```sql
-- Add new badge-related columns
ALTER TABLE products 
ADD COLUMN is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN is_on_sale BOOLEAN DEFAULT FALSE,
ADD COLUMN discount_percentage INTEGER,
ADD COLUMN badge_text TEXT,
ADD COLUMN badge_color TEXT CHECK (badge_color IN ('red', 'black', 'green', 'blue'));

-- Add indexes for performance
CREATE INDEX idx_products_is_featured ON products(is_featured);
CREATE INDEX idx_products_is_on_sale ON products(is_on_sale);
CREATE INDEX idx_products_badges ON products(is_bestseller, is_new_drop, is_featured, is_on_sale);
```

## Badge Priority System

The system now uses this priority order:

1. **Custom Badge** (`badge_text` + `badge_color`) - Highest priority
2. **Sale Badge** (`is_on_sale` + `discount_percentage`) - High priority  
3. **New Drop** (`is_new_drop`) - Medium priority
4. **Bestseller** (`is_bestseller`) - Low priority
5. **Featured** (`is_featured`) - Lowest priority

## Usage Examples

### Setting Product Badges in Supabase

```sql
-- Custom badge
UPDATE products SET 
  badge_text = 'LIMITED EDITION',
  badge_color = 'red'
WHERE id = 'product-id';

-- Sale badge
UPDATE products SET 
  is_on_sale = TRUE,
  discount_percentage = 25,
  original_price = 100,
  price = 75
WHERE id = 'product-id';

-- Multiple flags (system will show highest priority)
UPDATE products SET 
  is_new_drop = TRUE,
  is_bestseller = TRUE,
  is_featured = TRUE
WHERE id = 'product-id';
```

### In Your Components

```typescript
import { getProductBadge } from '@/domains/product/utils/badgeUtils'

const badge = getProductBadge(product)
if (badge) {
  // Show badge with badge.text and badge.color
}
```

## Benefits

✅ **Dynamic**: Badges come from database, not hardcoded  
✅ **Flexible**: Custom badges for special promotions  
✅ **Automatic**: Sale badges calculated from price difference  
✅ **Prioritized**: Shows most important badge when multiple apply  
✅ **Performant**: Indexed columns for fast queries