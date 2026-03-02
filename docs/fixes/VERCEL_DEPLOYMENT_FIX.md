# 🚀 Vercel Deployment Fix Guide

**Last Updated**: December 22, 2024  
**Status**: Ready for Deployment

---

## ✅ What Has Been Fixed in the Code

### 1. Middleware Routing (FIXED) ✅
- **File**: `/app/middleware.ts`
- **Changes**:
  - Removed `/profile` from protected routes
  - Added redirect from `/profile` → `/account`
  - Fixed authenticated user redirect to use `/account` instead of `/profile`
  - Removed non-existent shorthand auth routes (`/login`, `/signup`, etc.)
  
### 2. Admin Login Error Logging (ENHANCED) ✅
- **File**: `/app/src/lib/actions/admin-auth.ts`
- **Changes**:
  - Added environment variable checks
  - Enhanced error logging for debugging
  - Better error messages in console

### 3. Product Card Error Handling (FIXED) ✅
- **File**: `/app/src/domains/product/components/cards/ProductCard.tsx`
- **Changes**:
  - Added null check for product slugs
  - Prevents navigation if slug is missing
  - Shows alert to user if product data is incomplete

### 4. CMS Action Logging (ENHANCED) ✅
- **File**: `/app/src/lib/actions/cms.ts`
- **Changes**:
  - Added detailed logging for FAQ/CMS page fetches
  - Better error handling with try-catch

### 5. Connection Test API (NEW) ✅
- **File**: `/app/src/app/api/test-connection/route.ts`
- **Purpose**: Test Supabase connection in production
- **Usage**: Visit `https://dudemw.vercel.app/api/test-connection`

---

## 🔧 What You Need to Fix in Vercel

### STEP 1: Update Environment Variables in Vercel ⚡ (CRITICAL)

**Go to**: Vercel Dashboard → dudemw → Settings → Environment Variables

#### ⚠️ CRITICAL Variable to Fix:

```bash
# This is currently set to localhost - MUST BE CHANGED!
NEXT_PUBLIC_APP_URL=https://dudemw.vercel.app
```

#### ✅ Verify These Variables Are Set (from your .env file):

```bash
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://qyvpihdiyuowkyideltd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_BUCKET=product-images

# Admin Setup (REQUIRED)
ADMIN_SETUP_KEY=dude-menswear-super-admin-setup-2025

# Payment (Use TEST keys for now)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_RrPpRNi6qzciaQ
RAZORPAY_KEY_SECRET=UCBf54sUG0EChbsXTZ0qr4Do

# Redis (OPTIONAL - if you're using caching)
# ⚠️ IMPORTANT: Remove the quotes when adding to Vercel!
UPSTASH_REDIS_REST_URL=https://awaited-arachnid-28386.upstash.io
UPSTASH_REDIS_REST_TOKEN=AW7iAAIncDJiZTI2YzI5M2MwZDE0Y2U5OTRjMTI1ZTBiZjY4NmM1OXAyMjgzODY

# Contact Info
NEXT_PUBLIC_WHATSAPP_NUMBER=+919876543210
NEXT_PUBLIC_SUPPORT_EMAIL=support@dudemw.com

# Feature Flags
ENABLE_WISHLIST=true
ENABLE_REVIEWS=true
ENABLE_LOYALTY_POINTS=false
ENABLE_COD=true
```

#### 🚨 Common Mistakes to Avoid:

1. ❌ **DON'T** set `NODE_ENV` - Vercel handles this automatically
2. ❌ **DON'T** use quotes around Upstash URLs in Vercel (unlike .env file)
3. ❌ **DON'T** leave `NEXT_PUBLIC_APP_URL` as localhost
4. ✅ **DO** set variables for ALL environments (Production, Preview, Development)

---

### STEP 2: Deploy the Code Changes

Since I've made changes to your codebase, you need to push them:

```bash
# Check what was changed
git status

# Add all changes
git add .

# Commit the fixes
git commit -m "fix: production routing issues and error handling"

# Push to trigger Vercel deployment
git push origin main
```

Vercel will automatically detect the push and start a new deployment.

---

### STEP 3: Verify the Deployment

#### 3.1 Check Deployment Status

1. Go to: Vercel Dashboard → dudemw → Deployments
2. Wait for the latest deployment to finish (look for green checkmark ✅)
3. Click on the deployment to see build logs

#### 3.2 Test Connection Endpoint

Once deployed, visit:
```
https://dudemw.vercel.app/api/test-connection
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Connection successful",
  "details": {
    "hasData": true,
    "envVarsPresent": true,
    "nodeEnv": "production"
  }
}
```

**If you get an error**, the response will tell you what's wrong:
- Missing environment variables
- Database connection issues
- RLS policy problems

---

### STEP 4: Test All Fixed Features

#### 4.1 Test User Authentication (Priority 1)
1. ✅ Go to: `https://dudemw.vercel.app/auth/login`
2. ✅ Try logging in with a test user
3. ✅ Should redirect to `/account` (not `/profile`)
4. ✅ Try visiting `/profile` - should redirect to `/account`

#### 4.2 Test Admin Login (Priority 1)
1. ✅ Go to: `https://dudemw.vercel.app/admin/login`
2. ✅ Login with your super admin credentials
3. ✅ Should redirect to `/admin` dashboard
4. ✅ Check browser console - no 500 errors

#### 4.3 Test Product Navigation (Priority 1)
1. ✅ Go to homepage: `https://dudemw.vercel.app`
2. ✅ Click on any product
3. ✅ Should navigate to `/products/[slug]`
4. ✅ Product detail page should load

#### 4.4 Test CMS Content (Priority 2)
1. ✅ Go to: `https://dudemw.vercel.app/faq`
2. ✅ FAQ content should load (or show fallback message)
3. ✅ Go to: `https://dudemw.vercel.app/track-order`
4. ✅ Order tracking should work

#### 4.5 Test Search (Priority 3)
1. ✅ Press `Ctrl+J` (or `Cmd+J` on Mac)
2. ✅ Search dialog should open
3. ✅ Type to search - should show results

---

## 🐛 Troubleshooting

### Issue: Test Connection Returns 500 Error

**Possible Causes**:
1. Environment variables not set in Vercel
2. Typo in Supabase URL or keys
3. Variables not set for correct environment (Production/Preview)

**Solution**:
1. Double-check all environment variables in Vercel
2. Make sure they're set for "Production" environment
3. Redeploy after fixing variables

---

### Issue: Admin Login Still Failing

**Check Vercel Function Logs**:
1. Go to: Vercel Dashboard → dudemw → Deployments
2. Click on latest deployment → Functions
3. Look for `/admin/login` function
4. Check the logs for `[Admin Login]` messages

**Common Issues**:
- `SUPABASE_SERVICE_ROLE_KEY` not set
- Admin profile not active in database
- RLS policies blocking query

**Solution**:
```sql
-- Run in Supabase SQL Editor to check admin profile
SELECT * FROM admin_profiles WHERE role = 'super_admin';

-- If not active, activate it:
UPDATE admin_profiles 
SET is_active = true 
WHERE role = 'super_admin';
```

---

### Issue: Products Not Clicking

**Check Browser Console**:
1. Open DevTools → Console
2. Look for `[ProductCard] Product missing slug` errors
3. If you see these, your products are missing slugs

**Solution**:
```sql
-- Run in Supabase SQL Editor to check
SELECT id, title, slug FROM products WHERE slug IS NULL;

-- Fix missing slugs
UPDATE products
SET slug = LOWER(REGEXP_REPLACE(title, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';
```

---

### Issue: /profile Still Showing Instead of /account

**This means the code changes weren't deployed.**

**Solution**:
1. Make sure you pushed the changes: `git push origin main`
2. Wait for Vercel to rebuild
3. Hard refresh your browser: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
4. Clear browser cache if needed

---

### Issue: Search Not Working

**Likely Cause**: JavaScript not loading or hydration error

**Check**:
1. Open DevTools → Console
2. Look for JavaScript errors
3. Check DevTools → Network → Filter by "JS"
4. Make sure all JavaScript files are loading (200 status)

**Solution**:
- Usually fixes itself after environment variables are set
- Try hard refresh: `Ctrl+Shift+R`

---

## 📊 Deployment Checklist

Use this checklist to ensure everything is fixed:

### Before Deployment
- [x] Code changes made (routing, error handling)
- [x] Test API route created
- [x] Production env file created
- [ ] Environment variables updated in Vercel
- [ ] `NEXT_PUBLIC_APP_URL` changed from localhost
- [ ] All variables set for Production environment

### After Deployment
- [ ] Deployment finished successfully (green checkmark)
- [ ] `/api/test-connection` returns success
- [ ] No 500 errors in browser console
- [ ] Login works and redirects to `/account`
- [ ] Admin login works
- [ ] Products clickable and load detail pages
- [ ] FAQ/Track Order pages load
- [ ] Search opens and works
- [ ] No 404 errors on navigation

---

## 🎯 Expected Results After All Fixes

Once everything is deployed and configured:

1. ✅ **Login works** - Redirects to `/account`
2. ✅ **Admin login works** - Can access admin dashboard
3. ✅ **Products clickable** - Navigate to detail pages
4. ✅ **Profile accessible** - `/profile` redirects to `/account`
5. ✅ **CMS content loads** - FAQ, Track Order work
6. ✅ **Search works** - Opens and searches correctly
7. ✅ **No 500 errors** - All API calls successful
8. ✅ **No 404 errors** - All routes exist

---

## 📞 Need Help?

If you're still experiencing issues after following this guide:

1. **Check Vercel Build Logs**: 
   - Dashboard → Deployments → [Latest] → Build Logs
   - Look for errors or warnings

2. **Check Vercel Function Logs**:
   - Dashboard → Deployments → [Latest] → Functions
   - Look for runtime errors

3. **Check Browser Console**:
   - F12 → Console tab
   - Look for red errors

4. **Test Connection Endpoint**:
   - Visit `/api/test-connection`
   - Will tell you exactly what's wrong

---

## 🎉 Success Indicators

You'll know everything is working when:

- ✅ Can login and access `/account`
- ✅ Can login as admin and access dashboard
- ✅ Can click products and see details
- ✅ Can search and get results
- ✅ FAQ and other CMS pages load
- ✅ No errors in browser console
- ✅ All links work properly

---

**Next Steps**: Follow this guide step-by-step, starting with updating environment variables in Vercel, then deploying the code changes. Test each feature as you go.

Good luck! 🚀
