# ⚡ Quick Fix Checklist - Image Upload Issues

## 🚨 DO THIS FIRST (Required!)

### 1. Run SQL in Supabase Dashboard
**Time: 2 minutes**

1. Go to: https://supabase.com/dashboard
2. Select your production project
3. Click: **SQL Editor** (left sidebar)
4. Copy ALL content from: `/app/SUPABASE_SETUP.sql`
5. Paste into SQL Editor
6. Click: **Run** button
7. Wait for "✅ STORAGE SETUP COMPLETE!" message

**What this does:**
- ✅ Sets your user as admin
- ✅ Creates 5 storage buckets
- ✅ Creates 20 RLS policies
- ✅ Enables public image access

---

### 2. Log Out & Clear Cache
**Time: 1 minute**

1. Log out from admin dashboard
2. Press: **Ctrl + Shift + Delete** (or Cmd + Shift + Delete on Mac)
3. Clear: Cache and Cookies
4. Close all browser tabs
5. Reopen browser

---

### 3. Log Back In
**Time: 30 seconds**

1. Go to your admin login page
2. Login with: **mainfordudemw@gmail.com**
3. You now have admin role! 🎉

---

## ✅ Test Everything Works

### Test 1: Category Image Upload
**Time: 1 minute**

1. Go to: `/admin/categories/create`
2. Navigate to: "Media Assets" step
3. Upload any image
4. **Expected**: ✅ Upload succeeds (no RLS error)

---

### Test 2: Product Image Upload (Was Broken!)
**Time: 1 minute**

1. Go to: `/admin/products/create`
2. Navigate to: "Media" tab
3. Drag & drop or click "Choose Files"
4. Upload 2-3 images
5. **Expected**: 
   - ✅ Loading spinner appears
   - ✅ "Image uploaded successfully" toast
   - ✅ Images appear in gallery
   - ✅ Images persist after page refresh

---

### Test 3: Verify in Supabase
**Time: 30 seconds**

1. Go to: Supabase Dashboard → Storage
2. Check buckets: `product-images`, `categories`, `banners`
3. **Expected**: ✅ See your uploaded images

---

## 🎯 Success Indicators

You know it's working when:

- ✅ No "row level security policy" errors
- ✅ Success toast notifications appear
- ✅ Images show up immediately after upload
- ✅ Images persist after page refresh
- ✅ Images visible in Supabase Storage dashboard
- ✅ No console errors

---

## 🐛 Still Not Working?

### Quick Troubleshooting

**RLS Errors Still Appearing?**
- Re-run the SQL verification query (last part of SUPABASE_SETUP.sql)
- Confirm your role shows as 'admin'
- Try incognito mode

**Product Images Not Uploading?**
- Check if code changes were applied to `media-tab.tsx`
- Reload the page (hard refresh: Ctrl + Shift + R)
- Check browser console for errors

**Images Upload But Don't Display?**
- Check if bucket is public (should be true)
- Verify public read policy exists
- Check image URL format

---

## 📚 Detailed Documentation

For more information, see:

- **Complete Guide**: `/app/STORAGE_FIX_GUIDE.md`
- **Full Summary**: `/app/IMAGE_UPLOAD_FIX_SUMMARY.md`
- **SQL Script**: `/app/SUPABASE_SETUP.sql`

---

## ⏱️ Total Time: ~5 minutes

1. SQL setup: 2 min
2. Clear cache: 1 min
3. Testing: 2 min

**That's it! Your image uploads should now work perfectly! 🚀**
