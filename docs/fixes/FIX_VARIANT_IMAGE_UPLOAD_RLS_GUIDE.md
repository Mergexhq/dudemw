# Fix Variant Image Upload RLS Issue - Complete Guide

## 🔴 Problem
Getting error when uploading product variant images in admin dashboard:
```
Failed to upload: new row violates row-level security policy
StorageApiError: new row violates row-level security policy
```

## 🎯 Root Cause

The storage RLS (Row-Level Security) policies were checking for admin role in `auth.users.raw_user_meta_data->>'role'`, but the admin authentication system uses a separate `admin_profiles` table.

**Old Policy Logic (Incorrect):**
```sql
EXISTS (
  SELECT 1 FROM auth.users
  WHERE auth.users.id = auth.uid()
  AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'owner')
)
```

**New Policy Logic (Correct):**
```sql
EXISTS (
  SELECT 1 FROM public.admin_profiles
  WHERE admin_profiles.user_id = auth.uid()
  AND admin_profiles.is_active = true
  AND admin_profiles.role IN ('staff', 'manager', 'admin', 'super_admin')
)
```

## ✅ Solution

### Step 1: Run the Fix SQL Script

Execute the SQL script in your Supabase SQL Editor:

**File:** `/app/backend-implementation/FIX_VARIANT_IMAGE_UPLOAD_RLS.sql`

This script will:
1. Drop all existing admin storage policies
2. Create new policies that check the `admin_profiles` table
3. Apply to all admin buckets: product-images, banners, categories, collections
4. Verify your admin status

### Step 2: Verify Your Admin Status

After running the script, check the output. It should show:
```
Current User is Admin: YES ✅
```

If it shows `NO ❌`, you need to ensure your user exists in the `admin_profiles` table.

### Step 3: Test Image Upload

1. Log in to admin dashboard
2. Go to a product variant
3. Try uploading an image
4. Should work without RLS errors now

## 🔍 Troubleshooting

### Issue 1: Still Getting RLS Error

**Check if you're in admin_profiles:**
```sql
SELECT * FROM admin_profiles WHERE user_id = auth.uid();
```

If no results, you need to be added as an admin. Contact the super admin or use the setup process.

### Issue 2: Not Active

**Check if your admin profile is active:**
```sql
SELECT 
    email,
    role,
    is_active,
    approved_at
FROM admin_profiles ap
JOIN auth.users au ON au.id = ap.user_id
WHERE ap.user_id = auth.uid();
```

If `is_active = false`, ask the super admin to activate your account.

### Issue 3: Wrong Role

The following roles can upload images:
- `staff`
- `manager`
- `admin`
- `super_admin`

If your role is different or NULL, contact the super admin.

## 📋 What Changed

### Affected Buckets
All admin storage buckets now use the new policy logic:
- ✅ `product-images` - Product and variant images
- ✅ `banners` - Homepage banners
- ✅ `categories` - Category images
- ✅ `collections` - Collection images

### Affected Operations
- ✅ INSERT (upload)
- ✅ UPDATE (replace)
- ✅ DELETE (remove)
- ✅ SELECT (view) - Public, unchanged

## 🔐 Security Notes

1. **Only Active Admins:** Must have `is_active = true` in `admin_profiles`
2. **Role-Based:** All admin roles (staff, manager, admin, super_admin) can upload
3. **No Anonymous Uploads:** Authentication required
4. **Public Read:** Anyone can view images (required for e-commerce)

## 📝 Additional Information

### Admin Roles Hierarchy
- `staff` - Basic admin access
- `manager` - Elevated permissions
- `admin` - Full admin access
- `super_admin` - Highest level, can manage other admins

### Storage Bucket Details
| Bucket | Purpose | Size Limit | Allowed Types |
|--------|---------|------------|---------------|
| product-images | Products & Variants | 10MB | JPG, PNG, GIF, WebP |
| banners | Homepage Banners | 10MB | JPG, PNG, WebP |
| categories | Category Images | 5MB | JPG, PNG, WebP, SVG |
| collections | Collection Images | 5MB | JPG, PNG, WebP |
| avatars | Profile Pictures | 2MB | JPG, PNG, WebP |

### File Upload Path
Variant images are uploaded to:
```
product-images/variant-images/variant-{variant-id}-{timestamp}.{ext}
```

## 🚀 Next Steps

1. ✅ Run the SQL fix script
2. ✅ Verify your admin status
3. ✅ Test variant image upload
4. ✅ If issues persist, check troubleshooting section

## 📞 Support

If you continue to face issues:
1. Check the troubleshooting queries
2. Verify all RLS policies are updated
3. Ensure your admin profile is active
4. Check browser console for detailed error messages

---

**Note:** This fix aligns storage RLS policies with the admin authentication system that uses the `admin_profiles` table instead of `raw_user_meta_data`.
