# Drop Columns Migration Guide

## 📋 Overview
This guide walks you through safely dropping the `original_price` and `global_stock` columns from the `products` table in your Supabase database.

## ⚠️ Pre-Migration Checklist

Before executing the migration, verify the following:

### 1. **Check Dependencies**
Ensure these columns are not being used in:
- ✅ Application code (frontend/backend)
- ✅ Database views
- ✅ Database functions/stored procedures
- ✅ Database triggers
- ✅ Foreign key constraints
- ✅ Indexes

### 2. **Search Your Codebase**
Run these commands to find any references:

```bash
# Search for original_price references
cd /app
grep -r "original_price" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" src/

# Search for global_stock references
grep -r "global_stock" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" src/
```

### 3. **Check Database Dependencies**
Run this in Supabase SQL Editor:

```sql
-- Check for views using these columns
SELECT table_name, view_definition
FROM information_schema.views
WHERE view_definition LIKE '%original_price%'
   OR view_definition LIKE '%global_stock%';

-- Check for functions using these columns
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_definition LIKE '%original_price%'
   OR routine_definition LIKE '%global_stock%';

-- Check for triggers
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'products';
```

## 🚀 Migration Steps

### **Option 1: Using Supabase Dashboard (Recommended)**

1. **Login to Supabase**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste Migration Script**
   - Open `/app/backend-implementation/drop-products-columns-migration.sql`
   - Copy the entire content
   - Paste into the SQL Editor

4. **Execute the Migration**
   - Click "Run" button
   - Check the output messages
   - Look for the ✅ SUCCESS message

5. **Verify the Results**
   - The script will automatically show remaining columns
   - Verify `original_price` and `global_stock` are NOT in the list

### **Option 2: Using Supabase CLI**

If you have Supabase CLI installed:

```bash
# Navigate to your project
cd /app

# Run the migration
supabase db execute --file backend-implementation/drop-products-columns-migration.sql

# Or connect directly
supabase db execute < backend-implementation/drop-products-columns-migration.sql
```

### **Option 3: Manual Column Drop (Quick Method)**

If you prefer a quick manual approach in Supabase:

1. Go to **Table Editor** → **products** table
2. Click on the column header for `original_price`
3. Click the three dots (•••) → **Delete Column**
4. Confirm the deletion
5. Repeat for `global_stock` column

## 🔍 Post-Migration Verification

### 1. **Verify in Supabase Dashboard**
```sql
-- Check products table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;
```

Expected result: `original_price` and `global_stock` should NOT appear in the list.

### 2. **Test Your Application**
- Run your Next.js application
- Navigate to admin dashboard
- Try creating/editing products
- Verify no errors related to missing columns

### 3. **Check Product Queries**
```sql
-- Test basic product query
SELECT * FROM products LIMIT 5;

-- Verify pricing still works
SELECT id, title, price, compare_price, cost
FROM products
WHERE status = 'active'
LIMIT 10;
```

## 🔄 Rollback Plan (If Needed)

If you need to restore the columns:

```sql
-- Restore original_price column
ALTER TABLE products 
ADD COLUMN original_price NUMERIC(10, 2);

-- Restore global_stock column
ALTER TABLE products 
ADD COLUMN global_stock INTEGER;

-- If you created a backup table, restore data
-- UPDATE products p
-- SET original_price = pb.original_price,
--     global_stock = pb.global_stock
-- FROM products_backup_before_column_drop pb
-- WHERE p.id = pb.id;
```

## 📝 Important Notes

### **Why These Columns Can Be Safely Removed:**

1. **`original_price`**: 
   - Already have `price` and `compare_price` for pricing logic
   - Redundant column

2. **`global_stock`**: 
   - Stock management is handled by:
     - `product_variants` table (has `stock` column)
     - `inventory_items` table (has `quantity` and `available_quantity`)
   - The `in_stock` boolean flag remains in products table

### **What Won't Be Affected:**
- ✅ Product pricing (uses `price`, `compare_price`, `cost`)
- ✅ Inventory management (uses variant-level stock tracking)
- ✅ Product variants (separate `product_variants` table)
- ✅ Product images, categories, collections
- ✅ Orders and order items
- ✅ All other product fields

### **Migration Safety:**
- Uses `DROP COLUMN IF EXISTS` - won't fail if column doesn't exist
- Includes verification checks
- Non-destructive (data in other columns preserved)
- Can be rolled back if needed

## 🆘 Troubleshooting

### Error: "cannot drop column ... because other objects depend on it"

**Solution:**
```sql
-- Find the dependent objects
SELECT 
    dependent_ns.nspname as dependent_schema,
    dependent_view.relname as dependent_view,
    source_ns.nspname as source_schema,
    source_table.relname as source_table,
    pg_attribute.attname as column_name
FROM pg_depend 
JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid 
JOIN pg_class as dependent_view ON pg_rewrite.ev_class = dependent_view.oid 
JOIN pg_class as source_table ON pg_depend.refobjid = source_table.oid 
JOIN pg_attribute ON pg_depend.refobjid = pg_attribute.attrelid 
    AND pg_depend.refobjsubid = pg_attribute.attnum 
JOIN pg_namespace dependent_ns ON dependent_ns.oid = dependent_view.relnamespace
JOIN pg_namespace source_ns ON source_ns.oid = source_table.relnamespace
WHERE source_table.relname = 'products'
    AND pg_attribute.attnum > 0
    AND pg_attribute.attname IN ('original_price', 'global_stock');

-- Drop dependent objects first, then retry column drop
-- Or use CASCADE (careful - this drops all dependent objects)
ALTER TABLE products DROP COLUMN original_price CASCADE;
ALTER TABLE products DROP COLUMN global_stock CASCADE;
```

### Error: "permission denied"

**Solution:** Ensure you're using the database owner credentials or have proper ALTER TABLE permissions.

## ✅ Success Criteria

Your migration is successful when:
- [ ] SQL migration runs without errors
- [ ] Both columns are removed from products table
- [ ] Application runs without errors
- [ ] Product creation/editing works correctly
- [ ] No console errors related to these fields

## 📞 Need Help?

If you encounter any issues:
1. Check the error message in Supabase SQL Editor
2. Verify no application code references these columns
3. Review the rollback plan above
4. Contact support with error details

---

**Created:** December 2024  
**Purpose:** Safe removal of redundant columns from products table  
**Risk Level:** Low (columns are redundant)
