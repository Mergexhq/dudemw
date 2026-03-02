# React Hooks & Database Schema Fix Guide

## Issues Fixed

### 1. ✅ React Hooks Error: "Rendered more hooks than during the previous render"

**Root Cause**: In `/src/app/admin/layout.tsx`, the hooks were being called in the wrong order. The component had:
- Hooks declared (useState, useEffect)
- Then conditional early returns
- This caused React to see different numbers of hooks between renders when navigating to/from settings pages

**Fix Applied**: Reorganized the component to ensure ALL hooks are called unconditionally at the top before any conditional returns.

**Files Changed**:
- `/src/app/admin/layout.tsx` - Moved all hooks to the top, added clear comment separating hooks from render logic

---

### 2. ✅ Database Schema Error: Missing 'country' column

**Root Cause**: The Supabase database types (`src/types/database.types.ts`) were outdated and missing several columns that exist in the SQL schema:
- `country` (required field)
- `description`
- `address`
- `city`  
- `state`
- `postal_code`

**Fix Applied**: 
- Updated TypeScript types to match the SQL schema
- Created migration file to ensure all columns exist in the database

**Files Changed**:
- `/src/types/database.types.ts` - Added all missing columns
- `/backend-implementation/16-add-missing-store-settings-columns.sql` - New migration file

---

## Steps to Complete the Fix

### Step 1: Run the Database Migration

You need to run the migration in your Supabase SQL Editor to ensure all columns exist:

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Copy the contents of `/backend-implementation/16-add-missing-store-settings-columns.sql`
4. Paste and run it
5. After successful execution, run this command to refresh the schema cache:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

### Step 2: Verify the Settings Page

1. Restart your development server (if running):
   ```bash
   npm run dev
   ```
   
2. Navigate to the admin settings page:
   ```
   http://localhost:3000/admin/settings
   ```

3. The page should now load without errors!

---

## What Changed

### Code Changes Summary

1. **Admin Layout** (`/src/app/admin/layout.tsx`):
   - ✅ All hooks now called unconditionally at the top
   - ✅ Clear separation between hooks and render logic
   - ✅ No more conditional hook execution
   - ✅ Added ARIA accessibility attributes to mobile menu

2. **Settings Layout** (`/src/app/admin/settings/layout.tsx`):
   - ✅ Added ARIA accessibility attributes to mobile settings menu

3. **Database Types** (`/src/types/database.types.ts`):
   - ✅ Added `country: string` (required field)
   - ✅ Added `description: string | null`
   - ✅ Added `address: string | null`
   - ✅ Added `city: string | null`
   - ✅ Added `state: string | null`
   - ✅ Added `postal_code: string | null`
   - ✅ Fixed `invoice_prefix` to be required (not nullable)

4. **Migration SQL** (new file):
   - ✅ Safely adds all missing columns if they don't exist
   - ✅ Sets proper defaults and constraints
   - ✅ Includes schema cache refresh command

---

## Testing the Fix

### Test 1: Settings Page Load
- Navigate to `/admin/settings`
- Page should load without "Rendered more hooks" error
- Should not see errors in browser console

### Test 2: Settings Form
- Fill in store settings form
- Click "Save Changes"
- Should save successfully without 406 errors

### Test 3: Navigation
- Navigate between different admin pages
- Go to settings and back
- Should not see any hooks-related errors

---

## Additional Notes

### About the Hooks Error
The React hooks error occurs when:
- Hooks are called conditionally
- Different number of hooks are called between renders
- Early returns happen before all hooks are executed

**React Rules of Hooks**:
1. Only call hooks at the top level
2. Only call hooks from React functions
3. Call hooks in the same order every time

Our fix ensures rule #1 and #3 are followed by calling all hooks unconditionally before any conditional rendering logic.

### About Database Schema Sync
The error `Could not find the 'country' column of 'store_settings' in the schema cache` means:
- The TypeScript types were out of sync with the actual database
- Supabase's schema cache didn't have the latest table structure
- The migration adds missing columns and refreshes the cache

### 3. ✅ Accessibility Warnings Fixed

**Root Cause**: The Sheet components (used for mobile menus) were missing proper ARIA descriptions for screen readers.

**Fix Applied**: Added `aria-describedby` attributes and hidden descriptions to all Sheet components.

**Files Changed**:
- `/src/app/admin/layout.tsx` - Added ARIA description to mobile sidebar
- `/src/app/admin/settings/layout.tsx` - Added ARIA description to settings mobile sidebar

---

## Troubleshooting

### If the hooks error persists:
1. Clear your browser cache and reload
2. Stop and restart the dev server
3. Check that the file `/src/app/admin/layout.tsx` was updated correctly

### If database errors persist:
1. Verify the migration ran successfully in Supabase
2. Run the schema refresh command: `NOTIFY pgrst, 'reload schema';`
3. Check Supabase logs for any constraint violations
4. Verify your Supabase credentials in `.env.local`

### If 406 errors persist:
1. Make sure you ran the migration
2. Refresh Supabase schema cache
3. Check that all columns exist in Supabase Table Editor
4. Restart your application

---

## Summary

✅ **Fixed**: React hooks error by reorganizing component structure  
✅ **Fixed**: Database types to include all required columns  
✅ **Fixed**: Accessibility warnings for Sheet components  
✅ **Created**: Migration to add missing database columns  
✅ **Next Step**: Run the migration in Supabase SQL Editor  

After running the migration, your settings page should work perfectly without any errors!
