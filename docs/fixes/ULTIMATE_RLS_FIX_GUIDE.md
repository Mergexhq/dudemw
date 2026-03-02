# 🔥 Ultimate RLS Fix - Why Categories & Variants Still Fail

## 🎯 The Mystery

**Working:**
- ✅ Banners upload fine
- ✅ Products upload fine
- ✅ Other uploads work

**NOT Working:**
- ❌ Categories images fail
- ❌ Product Variants images fail

**Why the difference?** There are likely conflicting or restrictive policies.

---

## 🔍 Step 1: Diagnose The Exact Issue

Run this in Supabase SQL Editor:

```sql
-- Copy contents from: /app/DIAGNOSE_POLICY_CONFLICT.sql
```

This will show:
1. How many policies exist on each bucket
2. What each policy actually checks
3. If there are conflicts

**Look for:**
- Policies that check `raw_user_meta_data` (WRONG)
- Policies that check `admin_profiles` directly (CAN CAUSE RECURSION)
- Multiple INSERT policies on same bucket (CONFLICTS)

---

## 🔍 Step 2: Check for Restrictive Policies

Run this in Supabase SQL Editor:

```sql
-- Copy contents from: /app/CHECK_RESTRICTIVE_POLICIES.sql
```

**If you see "RESTRICTIVE" policies:** These block uploads even if other policies allow them!

---

## 🔥 Step 3: Nuclear Option - Clean Slate

If diagnostics show conflicts or restrictive policies, use this:

```sql
-- Copy contents from: /app/NUCLEAR_FIX_ALL_POLICIES.sql
```

**What this does:**
- 🗑️ Drops ALL existing storage policies (clean slate)
- ✅ Creates `is_storage_admin()` function
- ✅ Creates fresh, clean policies for ALL buckets:
  - product-images
  - categories  
  - banners
  - collections
  - avatars
- ✅ All policies use the same correct logic

**After running:**
1. Log out completely
2. Clear cache (Ctrl+Shift+Delete)
3. Close all tabs
4. Log back in
5. Test uploads

---

## 🧪 Step 4: Browser-Level Test

After clearing cache and logging back in, test in browser console (F12):

```javascript
// Test if client is authenticated
const { createClient } = await import('/src/lib/supabase/client.ts')
const supabase = createClient()
const { data: { session } } = await supabase.auth.getSession()

console.log('Logged in as:', session?.user?.email)
console.log('User ID:', session?.user?.id)

// Test actual upload to categories bucket
const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
const { data, error } = await supabase.storage
  .from('categories')
  .upload('test-' + Date.now() + '.jpg', testFile)

if (error) {
  console.error('❌ Upload failed:', error.message)
  console.error('Full error:', error)
} else {
  console.log('✅ Upload succeeded!')
  console.log('File path:', data.path)
  
  // Clean up test file
  await supabase.storage.from('categories').remove([data.path])
}
```

**Expected:** ✅ Upload succeeded
**If error:** Share the exact error message

---

## 🎯 Most Likely Scenarios

### Scenario A: Conflicting Policies
**Symptom:** Multiple policies with same name or command
**Solution:** Run `/app/NUCLEAR_FIX_ALL_POLICIES.sql`

### Scenario B: Wrong Policy Order
**Symptom:** RESTRICTIVE policies blocking PERMISSIVE ones
**Solution:** Run `/app/CHECK_RESTRICTIVE_POLICIES.sql`, then nuclear fix

### Scenario C: Function Not Being Called
**Symptom:** Policies exist but `is_storage_admin()` returns false
**Solution:** Test function directly:
```sql
SELECT is_storage_admin();  -- Should return TRUE
```

### Scenario D: Session Not Refreshed
**Symptom:** Everything looks correct in database
**Solution:** 
1. Use incognito/private window
2. Log in fresh
3. Test upload immediately

---

## 📊 Expected Results After Nuclear Fix

Run this to verify:
```sql
SELECT 
    bucket_id,
    COUNT(*) as policy_count
FROM (
    SELECT DISTINCT
        CASE 
            WHEN definition LIKE '%product-images%' THEN 'product-images'
            WHEN definition LIKE '%categories%' THEN 'categories'
            WHEN definition LIKE '%banners%' THEN 'banners'
            WHEN definition LIKE '%collections%' THEN 'collections'
            WHEN definition LIKE '%avatars%' THEN 'avatars'
        END as bucket_id
    FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
) policies
WHERE bucket_id IS NOT NULL
GROUP BY bucket_id
ORDER BY bucket_id;
```

**Expected:**
```
bucket_id       | policy_count
----------------|-------------
avatars         | 4
banners         | 4
categories      | 4
collections     | 4
product-images  | 4
```

Each bucket should have exactly **4 policies**:
1. INSERT (upload)
2. UPDATE (modify)
3. DELETE (remove)
4. SELECT (view)

---

## 🚨 If STILL Failing After Nuclear Fix

Share these details:

1. **SQL Output** from `/app/DIAGNOSE_POLICY_CONFLICT.sql`
2. **Browser Console Error** (exact message + full stack trace)
3. **Result** of browser upload test (from Step 4 above)
4. **Screenshot** of Supabase Storage → Policies tab for `categories` bucket

This will show us if:
- Policies aren't being created correctly
- Function isn't working
- There's a different issue (like bucket permissions)

---

## 💡 Why This Happens

Your setup has:
- ✅ Correct user role in `admin_profiles`
- ✅ Correct code using `createClient()`
- ❌ Conflicting or misconfigured RLS policies

The nuclear option fixes this by:
1. Removing ALL old/conflicting policies
2. Creating a clean, consistent set
3. Using the same logic for all buckets

**Start with Step 1 (diagnose) to see what's actually wrong!** 🔍
