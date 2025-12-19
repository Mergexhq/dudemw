# Testing Checklist - Bug Fixes Verification

## 🎯 Test Scenarios

### Test 1: Homepage Load
**Expected:** Homepage should load without "No Active Campaign" error

**Steps:**
1. Navigate to `http://localhost:3000/`
2. Wait for page to load

**Expected Results:**
- ✅ Page loads successfully
- ✅ Shows "Dude Menswear" heading
- ✅ Shows "Premium Fashion for the Modern Man" subheading
- ✅ Displays product grid with active products
- ✅ Shows "Shop All Products" or "Explore All Collections" button
- ✅ NO "No Active Campaign" message

**Potential Issues to Check:**
- If no products show, check browser console for errors
- Verify Supabase connection is working
- Check if products table has data with `status = 'active'`

---

### Test 2: "View All Products" Link from Megamenu
**Expected:** Clicking "VIEW ALL PRODUCTS" should navigate to products page

**Steps:**
1. Navigate to homepage
2. Hover over "Shop" in navigation (to open megamenu)
3. Scroll down in the megamenu left sidebar
4. Click "VIEW ALL PRODUCTS" button (red button at bottom)

**Expected Results:**
- ✅ Navigates to `/products` page
- ✅ NO 404 error
- ✅ Products page loads with product grid
- ✅ Shows filters sidebar
- ✅ Shows product cards

**Potential Issues to Check:**
- If 404 occurs, check if `/products/page.tsx` exists
- Verify megamenu link is updated to `/products`
- Check browser console for routing errors

---

### Test 3: Products Page Direct Access
**Expected:** Navigating directly to /products should work

**Steps:**
1. Navigate to `http://localhost:3000/products`
2. Wait for page to load

**Expected Results:**
- ✅ Page loads successfully
- ✅ Shows "All Products" or similar heading
- ✅ Displays product grid
- ✅ Shows category filters on left (desktop)
- ✅ Shows mobile filter button (mobile)
- ✅ Shows "New Drops" and "Best Sellers" sections if available

**Potential Issues to Check:**
- If no products show, check ProductService.getProducts() call
- Verify RLS policies allow anonymous read access
- Check if product status is 'active'

---

### Test 4: Collection Route Redirect
**Expected:** Old bookmarked /collections/all should redirect to /products

**Steps:**
1. Navigate to `http://localhost:3000/collections/all`

**Expected Results:**
- ✅ Automatically redirects to `/products`
- ✅ Products page loads
- ✅ No error or 404

---

### Test 5: Product Data Verification
**Expected:** Products should display with correct data

**Steps:**
1. Go to `/products` page
2. Inspect individual product cards

**Expected Results:**
- ✅ Product title is visible
- ✅ Product price is shown
- ✅ Product image loads (or placeholder if no image)
- ✅ "NEW" or "BESTSELLER" badge if applicable
- ✅ Products are clickable (link to product detail page)

**Potential Issues to Check:**
- Images not loading → Check Supabase Storage bucket
- Prices showing as NaN → Check price field in database
- No badges → Check is_new_drop and is_bestseller fields

---

## 🔍 Browser Console Checks

### What to Look For (Good Signs):
```
✅ No red error messages
✅ Successful API calls to Supabase
✅ Products data fetched successfully
✅ Images loading (or showing placeholders gracefully)
```

### What to Flag (Issues):
```
❌ "RLS policy violation" - Indicates Row Level Security is blocking access
❌ "Failed to fetch products" - API call failing
❌ "Cannot read property of undefined" - Data structure mismatch
❌ 401/403 errors - Authentication/authorization issues
❌ CORS errors - Supabase URL misconfiguration
```

---

## 🗄️ Database Verification

### Check Products Table:
```sql
-- Run in Supabase SQL Editor
SELECT 
  id, 
  title, 
  status, 
  price, 
  in_stock,
  is_new_drop,
  is_bestseller
FROM products
WHERE status = 'active'
LIMIT 10;
```

**Expected:**
- At least 5-10 products with `status = 'active'`
- Prices should be numeric (not null)
- At least some products with `in_stock = true`

---

## 📱 Mobile Testing

### Test on Mobile View:
1. Open browser DevTools
2. Toggle device toolbar (Ctrl+Shift+M / Cmd+Shift+M)
3. Select mobile device (e.g., iPhone 12 Pro)
4. Test all scenarios above

**Mobile-Specific Checks:**
- ✅ Megamenu works on mobile
- ✅ Product grid is responsive (1-2 columns on mobile)
- ✅ Filter button appears on mobile
- ✅ Navigation is accessible

---

## 🐛 Common Issues & Solutions

### Issue: "No products available"
**Possible Causes:**
1. No products in database
2. All products have `status != 'active'`
3. RLS policies blocking access

**Solution:**
1. Check Supabase → Table Editor → products
2. Verify at least one product exists with `status = 'active'`
3. Check RLS policies allow SELECT for anonymous users

---

### Issue: Images not loading
**Possible Causes:**
1. Image URLs are null/invalid
2. Supabase Storage bucket not public
3. CORS issues

**Solution:**
1. Check product_images table has valid URLs
2. Supabase Storage → product-images bucket → Make public
3. Verify bucket policies allow public read

---

### Issue: "Failed to fetch"
**Possible Causes:**
1. Supabase credentials incorrect
2. Network connectivity issue
3. API endpoint not found

**Solution:**
1. Verify .env.local has correct NEXT_PUBLIC_SUPABASE_URL
2. Check NEXT_PUBLIC_SUPABASE_ANON_KEY is valid
3. Test Supabase connection directly in browser console

---

## ✅ Success Criteria

All tests pass when:
- [x] Homepage loads and shows products
- [x] "View All Products" navigates correctly
- [x] /products page displays products
- [x] /collections/all redirects properly
- [x] No console errors (or only warnings)
- [x] Product cards render with data
- [x] Navigation works smoothly

---

## 📝 Test Results Template

**Date Tested:** ___________  
**Browser:** ___________  
**Device:** ___________  

| Test | Status | Notes |
|------|--------|-------|
| Homepage Load | ⬜ Pass / ⬜ Fail | |
| Megamenu Link | ⬜ Pass / ⬜ Fail | |
| Products Page | ⬜ Pass / ⬜ Fail | |
| Collections Redirect | ⬜ Pass / ⬜ Fail | |
| Product Data Display | ⬜ Pass / ⬜ Fail | |

**Overall Status:** ⬜ All Pass / ⬜ Some Failed  
**Additional Notes:** _________________________________

---

**Next Steps After Testing:**
1. If all tests pass → Mark as resolved
2. If tests fail → Check specific error messages and refer to troubleshooting section
3. Document any new issues found
