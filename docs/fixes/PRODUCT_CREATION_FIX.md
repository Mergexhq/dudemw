# Product Creation Fix - Debug Guide

## Changes Made

I've improved the product creation functionality with:

1. **Enhanced Error Handling**: Now shows specific error messages instead of generic "Failed to create product"
2. **Step-by-step Logging**: Console logs show exactly which step fails
3. **Better Validation**: Validates data before inserting
4. **Toast Notifications**: User-friendly error messages in the UI

## How to Test

1. **Start the development server**:
   ```bash
   pnpm dev
   ```

2. **Try creating a product** in the admin panel (`/admin/products/create`)

3. **Check the console** (both browser and terminal) for detailed error messages

## Common Issues & Solutions

### Issue 1: "Failed to create product: [Supabase error]"

**Cause**: Row Level Security (RLS) policies blocking the insert

**Solution**: 
- Go to your Supabase dashboard
- Navigate to Authentication > Policies
- For these tables, add a policy to allow inserts when using service role key:
  - `products`
  - `product_images`
  - `product_options`
  - `product_option_values`
  - `product_variants`
  - `inventory_items`
  - `variant_option_values`
  - `product_categories`
  - `product_collections`
  - `product_tags`
  - `product_tag_assignments`

**Quick Fix SQL** (Run in Supabase SQL Editor):
```sql
-- Disable RLS for admin operations (if using service role key)
-- The service role key bypasses RLS, but policies must exist

-- For products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can do everything" ON products
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Repeat for other tables
-- product_images, product_options, product_option_values, 
-- product_variants, inventory_items, variant_option_values,
-- product_categories, product_collections, product_tags, product_tag_assignments
```

### Issue 2: Missing Environment Variable

**Cause**: `SUPABASE_SERVICE_ROLE_KEY` not set in `.env.local`

**Solution**:
1. Create/update `.env.local` file in project root
2. Add your Supabase service role key:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```
3. Get the service role key from: Supabase Dashboard > Settings > API
4. Restart your development server

### Issue 3: Storage Bucket Permissions

**Cause**: `product-images` bucket doesn't allow uploads

**Solution**:
1. Go to Supabase Dashboard > Storage
2. Find or create `product-images` bucket
3. Make it public
4. Add appropriate RLS policies

### Issue 4: Database Schema Mismatch

**Cause**: Database columns don't match the insert data

**Solution**: Check your database schema matches these requirements:
- `products` table should have all the columns being inserted
- Foreign key relationships should be properly set up
- Check for NOT NULL constraints that might be failing

## Debugging Steps

1. **Check Environment Variables**:
   ```bash
   node test-product-creation.js
   ```

2. **Check Server Logs**:
   - Look at the terminal where `pnpm dev` is running
   - You'll see detailed logs like:
     ```
     === Starting Product Creation ===
     Product title: Test Product
     Generated slug: test-product
     Step 1: Creating main product record...
     ✅ Product created successfully with ID: xxx
     ```
   - The logs will show exactly where it fails

3. **Check Browser Console**:
   - Open DevTools (F12)
   - Go to Console tab
   - Look for error messages with full details

4. **Check Supabase Dashboard**:
   - Go to Supabase Dashboard > Table Editor
   - Check if partial data was inserted
   - Look at the Database > Logs for any errors

## Still Having Issues?

If you're still experiencing problems:

1. Share the **complete error message** from console (both browser and server)
2. Check if you can see the detailed error now (it should show which step failed)
3. Verify your Supabase service role key is correct
4. Check Supabase dashboard logs for any database errors

## Next Steps

Once product creation works:
1. Test with different product types (with/without variants)
2. Ensure images upload correctly
3. Verify products appear in the products list
4. Check that products display correctly on the storefront
