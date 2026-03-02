# 🚀 Quick Fix Reference Card

## Problem: Infinite Recursion Error

**Error Message:**
```
infinite recursion detected in policy for relation "admin_profiles"
```

## ⚡ Quick Fix (5 Steps)

### 1️⃣ Run SQL Script
Open **Supabase Dashboard** → **SQL Editor**

Run this file:
```
/app/FIX_INFINITE_RECURSION_STORAGE_RLS.sql
```

### 2️⃣ Verify
Run diagnostic:
```sql
SELECT is_storage_admin();
-- Should return: true
```

### 3️⃣ Clear Session
- Log out of admin dashboard
- Close ALL browser tabs
- Clear browser cache (Ctrl+Shift+Delete)

### 4️⃣ Log Back In
- Visit your admin login page
- Enter your credentials

### 5️⃣ Test Upload
- Go to Categories or Products
- Try uploading an image
- Should succeed! ✅

---

## 🔍 Diagnostic Tools

### Check Everything
```sql
-- Run this in SQL Editor:
\i /app/DIAGNOSE_STORAGE_UPLOAD_ISSUES.sql
```

### Check Function Status
```sql
SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_name = 'is_storage_admin';
```

### Check Your Permissions
```sql
SELECT 
    auth.uid() as user_id,
    is_storage_admin() as can_upload,
    ap.role,
    ap.is_active
FROM admin_profiles ap
WHERE ap.user_id = auth.uid();
```

---

## 📁 Available Files

| File | Purpose |
|------|---------|
| `FIX_INFINITE_RECURSION_STORAGE_RLS.sql` | **Main fix script** - Run this first |
| `INFINITE_RECURSION_FIX_GUIDE.md` | Detailed explanation and troubleshooting |
| `DIAGNOSE_STORAGE_UPLOAD_ISSUES.sql` | Run diagnostics on your setup |
| `FIX_STORAGE_RLS_FOR_ADMIN_PROFILES.sql` | Previous attempt (superseded) |

---

## 🎯 What the Fix Does

1. **Creates SECURITY DEFINER function** `is_storage_admin()`
   - Bypasses RLS when checking admin status
   - Prevents recursion loop
   - Safe (only returns boolean)

2. **Updates all storage policies**
   - Removes direct `admin_profiles` queries
   - Uses the safe function instead
   - Applies to all buckets (categories, product-images, etc.)

3. **Breaks the recursion chain**
   ```
   Before: Storage → admin_profiles RLS → admin_profiles RLS → 💥
   After:  Storage → is_storage_admin() → ✅ (no RLS)
   ```

---

## 🧪 Test Everything

### Visit Debug Page
```
http://localhost:3000/admin/auth-debug
```

**Check for:**
- ✅ Green "Ready to Upload" badge
- ✅ Admin Profile: super_admin, Active
- ✅ Upload Permission Check: Permission Granted
- ✅ Test Upload button works

---

## ⚠️ Common Issues

### Function Not Found
```
ERROR: function is_storage_admin() does not exist
```
**Fix:** Re-run `FIX_INFINITE_RECURSION_STORAGE_RLS.sql`

### Permission Denied
```
ERROR: permission denied for function is_storage_admin
```
**Fix:** Function needs SECURITY DEFINER. Re-run the script.

### Still Getting Recursion
**Fix:**
1. Check if old policies exist:
   ```sql
   SELECT policyname, definition 
   FROM pg_policies 
   WHERE schemaname = 'storage' 
   AND definition LIKE '%FROM admin_profiles%';
   ```
2. If found, re-run the fix script (it drops and recreates)

---

## 📞 Need Help?

1. **Run diagnostics first:**
   ```
   \i /app/DIAGNOSE_STORAGE_UPLOAD_ISSUES.sql
   ```

2. **Check debug page:**
   Visit `/admin/auth-debug` while logged in

3. **Review detailed guide:**
   Read `INFINITE_RECURSION_FIX_GUIDE.md`

---

## ✅ Success Indicators

You'll know it works when:

- ✅ No console errors during upload
- ✅ Image appears in storage bucket
- ✅ Debug page shows "Permission Granted"
- ✅ `is_storage_admin()` returns `true`
- ✅ Categories/products show uploaded images

---

## 🔐 Technical Details

**Root Cause:**
- Storage RLS policies checked `admin_profiles` table
- `admin_profiles` has its own RLS policies
- Those policies also checked `admin_profiles`
- Result: Infinite recursion

**Solution:**
- `SECURITY DEFINER` functions run with elevated privileges
- They bypass RLS on tables they query
- Safe when returning only boolean values
- Standard PostgreSQL pattern for authorization checks

**Why It's Safe:**
- Function takes no parameters
- Returns only true/false
- No data leakage possible
- Simple, auditable logic
- Used by Supabase's own internal functions

---

**Last Updated:** 2025  
**Status:** Production Ready ✅
