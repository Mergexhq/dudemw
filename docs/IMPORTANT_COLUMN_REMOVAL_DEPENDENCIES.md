# ⚠️ CRITICAL: Column Dependencies Found!

## 🚨 DO NOT DROP COLUMNS YET

Before dropping `original_price` and `global_stock` columns from Supabase, you **MUST** update your codebase first to remove all references to these columns.

## 📊 Usage Analysis

### `original_price` - Found in 14 locations:
1. **src/types/database.types.ts** - Type definitions (3 occurrences)
2. **src/domains/product/components/cards/ProductCard.tsx** - Discount calculations (3 occurrences)
3. **src/domains/product/types/index.ts** - Product type interface
4. **src/domains/product/utils/productUtils.ts** - Product transformation
5. **src/domains/product/utils/badgeUtils.ts** - Sale badge logic (4 occurrences)
6. **src/domains/profile/hooks/useGuestProfile.ts** - Guest profile (2 occurrences)

### `global_stock` - Found in 20 locations:
1. **src/lib/actions/products.ts** - Product actions (3 occurrences)
2. **src/lib/services/notifications.ts** - Low stock alerts (5 occurrences)
3. **src/lib/services/products.ts** - Product service (3 occurrences)
4. **src/lib/services/analytics.ts** - Analytics calculations (3 occurrences)
5. **src/types/database.types.ts** - Type definitions (3 occurrences)
6. **src/app/admin/products/page.tsx** - Admin product listing (2 occurrences)

## 🎯 Migration Strategy

You have **TWO OPTIONS**:

### **Option A: Replace with Alternative Fields** (Recommended)

Instead of dropping these columns, use existing alternatives:

#### For `original_price`:
- **Alternative:** Use `compare_price` field (already exists)
- **Purpose:** Shows the comparison/original price for discount display
- **Action:** Migrate data from `original_price` → `compare_price`

#### For `global_stock`:
- **Alternative:** Use variant-level stock from `product_variants` table
- **Or:** Calculate from `inventory_items` table
- **Action:** Remove field and calculate stock dynamically from variants

### **Option B: Complete Removal** (Requires Code Changes)

If you still want to remove these columns, follow this sequence:

## 📋 Step-by-Step Removal Process

### Phase 1: Code Refactoring (Do This FIRST)

#### Step 1: Update `original_price` References

Replace all `original_price` with `compare_price`:

**Files to update:**
```typescript
// src/domains/product/components/cards/ProductCard.tsx
// CHANGE: const originalPrice = product.original_price || product.price
// TO: const originalPrice = product.compare_price || product.price

// src/domains/product/utils/badgeUtils.ts
// CHANGE: product.original_price
// TO: product.compare_price

// src/domains/product/utils/productUtils.ts
// CHANGE: original_price: rawProduct.original_price || undefined,
// TO: original_price: rawProduct.compare_price || undefined,
```

#### Step 2: Update `global_stock` References

Replace with variant-based stock calculation:

**Files to update:**
```typescript
// src/lib/services/analytics.ts
// CHANGE: .select('id, global_stock')
// TO: .select('id, product_variants(stock)')

// src/lib/services/notifications.ts
// CHANGE: .lte('global_stock', 10)
// TO: Calculate from product_variants or inventory_items

// src/lib/actions/products.ts
// Remove global_stock field from product creation/update
```

#### Step 3: Update Type Definitions

```typescript
// src/types/database.types.ts
// Remove: original_price: number | null
// Remove: global_stock: number | null

// src/domains/product/types/index.ts
// Remove: original_price?: number | null
```

### Phase 2: Migrate Data in Supabase (Do This SECOND)

```sql
-- Migrate original_price data to compare_price
UPDATE products
SET compare_price = original_price
WHERE original_price IS NOT NULL 
  AND (compare_price IS NULL OR compare_price = 0);

-- Verify migration
SELECT 
    COUNT(*) as total_products,
    COUNT(original_price) as has_original_price,
    COUNT(compare_price) as has_compare_price
FROM products;
```

### Phase 3: Drop Columns (Do This LAST)

Only after completing Phase 1 & 2, execute:

```sql
-- Use the migration script
-- /app/backend-implementation/drop-products-columns-migration.sql
```

## 🔧 Quick Fix Script

I can help you with an automated refactoring. Would you like me to:

1. ✅ **Update all code references** - Replace `original_price` with `compare_price` and refactor `global_stock` usage
2. ✅ **Generate data migration SQL** - Move data from old columns to new structure
3. ✅ **Update type definitions** - Remove old fields from TypeScript types
4. ✅ **Test the changes** - Ensure nothing breaks

## 🎬 Recommended Action Plan

**I recommend the following safe approach:**

### Option 1: Minimal Change (Safest)
1. Migrate `original_price` data to `compare_price`
2. Update code to use `compare_price` instead
3. Keep using variant-level stock (already in place)
4. Drop the columns after verification

### Option 2: Keep the Columns (No Risk)
- If these fields are actively used, consider **NOT** removing them
- The table structure already exists and works
- Removing them requires significant refactoring

## ❓ What Would You Like To Do?

Please choose:

**A)** "Refactor the code first, then drop columns" - I'll update all files automatically

**B)** "Keep the columns" - No changes needed, just update the SQL file back

**C)** "Show me what needs to change" - I'll create a detailed file-by-file change list

**D)** "Migrate original_price to compare_price only" - Partial migration

---

**⚠️ WARNING:** Dropping columns without updating code will cause:
- ❌ Runtime errors in ProductCard component
- ❌ Broken discount calculations
- ❌ Failed stock alerts in notifications
- ❌ Broken analytics dashboard
- ❌ Admin product page errors
- ❌ TypeScript compilation errors

**DO NOT proceed with Supabase column drop until code is updated!**
