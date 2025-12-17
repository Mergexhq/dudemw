# Database Schema Reset & Rebuild

## ✅ DEPENDENCY ISSUE FIXED!

**The `is_admin_user()` function dependency error has been resolved!** You can now execute the files in the original order without errors.

### What was fixed?
- The `is_admin_user()` and `is_owner_user()` functions are now created **at the beginning of file 04**
- This prevents the error: `function is_admin_user() does not exist`
- File 05 uses `CREATE OR REPLACE` to avoid conflicts

📖 **See [00-QUICK-START.md](./00-QUICK-START.md) for detailed instructions**

---

## Overview
This folder contains SQL snippets to completely reset and rebuild your Supabase database for the Dude Men's Wears e-commerce platform.

## Execution Order

**IMPORTANT:** Execute these files in the exact order listed below:

1. **01-drop-existing.sql** - Drops all existing tables, policies, indexes, and functions
2. **02-create-tables.sql** - Creates all database tables with proper constraints
3. **03-create-indexes.sql** - Creates performance indexes for optimized queries
4. **04-create-rls-policies.sql** - ✨ Creates admin functions + RLS policies (FIXED)
5. **05-create-functions.sql** - Creates remaining helper functions and triggers

## How to Execute

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of each file **in order**
5. Click **Run** to execute
6. Verify success before moving to the next file

### Option 2: Supabase CLI
```bash
# Make sure you're connected to your project
supabase link --project-ref YOUR_PROJECT_REF

# Execute each file in order
supabase db execute --file 01-drop-existing.sql
supabase db execute --file 02-create-tables.sql
supabase db execute --file 03-create-indexes.sql
supabase db execute --file 04-create-rls-policies.sql
supabase db execute --file 05-create-functions.sql
```

### Option 3: psql Command Line
```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT].supabase.co:5432/postgres" -f 01-drop-existing.sql
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT].supabase.co:5432/postgres" -f 02-create-tables.sql
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT].supabase.co:5432/postgres" -f 03-create-indexes.sql
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT].supabase.co:5432/postgres" -f 04-create-rls-policies.sql
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT].supabase.co:5432/postgres" -f 05-create-functions.sql
```

## Post-Execution Steps

### 1. Regenerate TypeScript Types
After running all SQL files, regenerate your database types:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts
```

### 2. Verify Tables Created
Run this query in SQL Editor to verify all tables:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected count: **36 tables**

### 3. Verify Indexes
```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
```

### 4. Verify RLS Policies
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

### 5. Test Functions
```sql
-- This should return true if you're logged in as admin
SELECT is_admin_user();

-- This should return true if you're the owner
SELECT is_owner_user();
```

## Database Schema Overview

### Core Tables (36 total)

**Store Configuration:**
- `store_settings` - Store information and preferences
- `store_locations` - Physical store locations
- `notification_settings` - Notification preferences
- `payment_settings` - Payment provider configurations
- `shipping_settings` - Shipping configuration
- `shipping_rules` - Zone-based shipping rules

**Tax Management (NEW):**
- `tax_settings` - Global tax configuration
- `category_tax_rules` - Category-specific GST rates
- `product_tax_rules` - Product-specific GST rates
- `order_taxes` - Tax records for orders

**Product Catalog:**
- `categories` - Product categories (hierarchical)
- `products` - Main product information
- `product_images` - Product images
- `product_options` - Product options (Size, Color, etc.)
- `product_option_values` - Option values (M, L, XL, etc.)
- `product_variants` - Product variants (combinations)
- `variant_option_values` - Links variants to option values
- `variant_prices` - Variant pricing information
- `product_categories` - Product-category relationships
- `product_collections` - Product-collection relationships
- `product_tags` - Tags for products
- `product_tag_assignments` - Product-tag relationships

**Inventory:**
- `inventory_items` - Inventory tracking
- `inventory_logs` - Inventory change history

**Collections & Banners:**
- `collections` - Product collections
- `collection_products` - Collection-product relationships
- `banners` - Marketing banners
- `homepage_sections` - Homepage sections

**Shopping:**
- `cart_items` - Shopping cart items
- `wishlist_items` - Wishlist items
- `coupons` - Discount coupons

**Orders:**
- `addresses` - Customer addresses
- `orders` - Order information
- `order_items` - Order line items
- `payments` - Payment records

## Security Notes

### RLS Policies Overview

**Public Read Access:**
- Products, categories, collections, banners (active only)
- Store settings, shipping settings (public info)

**User Access:**
- Users can read/write their own cart, wishlist, addresses
- Users can read their own orders

**Admin Access:**
- Admins have full access to all tables
- Admin check uses `is_admin_user()` function

**Guest Access:**
- Guests can access cart/wishlist via `guest_id`

## Troubleshooting

### Error: "relation does not exist"
- Make sure you ran 02-create-tables.sql successfully
- Check for any error messages during table creation

### Error: "permission denied"
- Ensure you're connected with appropriate database permissions
- Try using the service_role key for administrative operations

### Error: "duplicate key value violates unique constraint"
- This means 01-drop-existing.sql didn't fully clean up
- Manually verify and drop any remaining objects

### RLS Blocking Legitimate Access
- Check if user has proper role in auth.users
- Verify is_admin_user() function returns correct value
- Temporarily disable RLS for debugging: `ALTER TABLE tablename DISABLE ROW LEVEL SECURITY;`

## Backup Recommendation

**Before running these scripts:**
1. Export your current data if needed
2. Take a Supabase database backup (Dashboard > Settings > Database > Backups)
3. Test on a staging/development database first

## Support

If you encounter issues:
1. Check Supabase logs in Dashboard > Logs
2. Review error messages carefully
3. Ensure all prerequisite steps are completed
4. Verify your Supabase project is on a compatible plan

---

**Generated for:** Dude Men's Wears E-commerce Platform  
**Tech Stack:** Next.js 16, Supabase (PostgreSQL), TypeScript  
**Schema Version:** 1.0  
**Last Updated:** 2024
