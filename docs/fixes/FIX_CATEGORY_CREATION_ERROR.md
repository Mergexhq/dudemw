# 🔧 Fix Category Creation Error (406/400)

## 🐛 Current Error
When clicking "Publish" in Categories → Preview & Save page:
```
Error creating category: {}
406 Error: qyvpihdiyuowkyideltd.supabase.co/rest/v1/categories?select=id&slug=eq.hoodies
400 Error: qyvpihdiyuowkyideltd.supabase.co/rest/v1/categories?columns=...
```

## ✅ Root Cause
The `categories` table has RLS (Row Level Security) enabled but **no policies** configured, which blocks ALL access including the admin operations.

---

## 🚀 Solution - 2 Steps

### Step 1: Fix Categories Table RLS Policies

1. **Open Supabase Dashboard** → **SQL Editor**
2. **New Query**
3. **Copy and run:** `/app/FIX_CATEGORIES_TABLE_RLS.sql`

**What this does:**
- ✅ Enables RLS on categories table (if not already)
- ✅ Creates 5 policies:
  1. Admins can view all categories
  2. Admins can create categories
  3. Admins can update categories
  4. Admins can delete categories
  5. Public can view active categories (for store frontend)

**Expected Output:**
```
✅ CATEGORIES TABLE RLS FIXED!
Total policies: 5

✅ Admins can now:
   - View all categories
   - Create categories
   - Update categories
   - Delete categories
```

---

### Step 2: Refresh & Test

1. **Hard refresh browser** (Ctrl + Shift + R)
2. **Go to:** `/admin/categories/create`
3. **Fill out the form** with all required fields
4. **Upload images** in Media Assets step
5. **Click "Publish"**

**Expected:** ✅ Category created successfully!

---

## 🔍 Why This Happened

**RLS without policies = Total lockdown**

When RLS is enabled on a table but no policies exist:
- ❌ Even service role (admin) is blocked
- ❌ All SELECT queries return 406 (Not Acceptable)
- ❌ All INSERT queries return 400 (Bad Request)

The fix creates proper policies that:
- ✅ Check `admin_profiles` table for your role
- ✅ Allow admins full CRUD access
- ✅ Allow public read-only access to active categories

---

## 🧪 Verify RLS Policies

After running the fix, verify in Supabase:

**Method 1: Dashboard**
1. Go to **Database** → **Categories** table
2. Click **RLS policies** tab
3. Should see 5 policies listed

**Method 2: SQL Query**
```sql
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'categories'
ORDER BY policyname;
```

**Expected:**
```
Admins can create categories   | INSERT
Admins can delete categories   | DELETE
Admins can update categories   | UPDATE
Admins can view categories     | SELECT
Public can view active categories | SELECT
```

---

## 🐛 If Still Getting Errors

### Check 1: Service Role Key
Verify your `.env.local` or `.env` has:
```
SUPABASE_SERVICE_ROLE_KEY=eyJh...your-service-role-key
```

Get this from: **Supabase Dashboard** → **Project Settings** → **API** → **service_role key**

### Check 2: Better Error Details
The code now logs full error details. After refresh, try creating a category again and check browser console (F12) for:
```
Error creating category: {
  message: "...",
  details: "...",
  hint: "...",
  code: "..."
}
```

Share these details if it still fails.

### Check 3: Test Direct Query
In browser console (F12):
```javascript
const { createClient } = await import('/src/lib/supabase/client.ts')
const supabase = createClient()

const { data, error } = await supabase
  .from('categories')
  .insert({
    name: 'Test Category',
    slug: 'test-category-' + Date.now(),
    status: 'active'
  })
  .select()

console.log('Result:', data || error)
```

**Expected:** Category object returned
**If error:** Share the error message

---

## 📋 Files Modified

1. **`/app/FIX_CATEGORIES_TABLE_RLS.sql`** (NEW)
   - SQL script to fix RLS policies

2. **`/app/src/lib/services/categories.ts`** (UPDATED)
   - Improved error logging
   - Changed `.single()` to `.maybeSingle()` for duplicate check
   - Added detailed error messages

---

## ✅ Success Checklist

- [ ] Ran `/app/FIX_CATEGORIES_TABLE_RLS.sql` in Supabase
- [ ] Saw success message with 5 policies created
- [ ] Hard refreshed browser (Ctrl+Shift+R)
- [ ] Filled out category form completely
- [ ] Uploaded images successfully
- [ ] Clicked "Publish"
- [ ] Category created! ✅

---

## 🎯 Expected End Result

After the fix:
- ✅ No more 406/400 errors
- ✅ Categories create successfully
- ✅ Proper error messages if validation fails
- ✅ Images upload and save correctly
- ✅ Category appears in admin list
- ✅ Category visible on store frontend (if active)

---

**Run the SQL fix and try again! The improved error logging will help if there are any other issues.** 🚀
