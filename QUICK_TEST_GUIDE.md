# Quick Test Guide - Admin Dashboard Bug Fixes

## Pre-Testing Setup

### 1. Execute Database Migration
Before testing, you MUST run the categories table migration:

```bash
# Go to Supabase Dashboard → SQL Editor
# Copy and execute: /app/backend-implementation/12-fix-categories-table.sql
```

### 2. Verify Environment Variables
```bash
# Check if .env.local exists and contains SUPABASE_SERVICE_ROLE_KEY
cat /app/.env.local | grep SUPABASE_SERVICE_ROLE_KEY
```

### 3. Restart Development Server
```bash
# Kill existing server and restart to load new env variables
npm run dev
```

---

## Test Suite

### ✅ Test 1: Customer Management
**URL:** `http://localhost:3000/admin/customers`

**What to Test:**
1. Page loads without errors
2. Customer stats cards display (Total, Active, Inactive, VIP, New, Avg LTV)
3. Customer list table renders
4. No "User not allowed" errors in console
5. Refresh button works

**Expected Results:**
- ✅ No console errors
- ✅ Stats show actual numbers (not "-")
- ✅ Customer list displays (if you have customers)
- ✅ All 6 stat cards render correctly

**If Failed:**
- Check browser console for errors
- Verify SUPABASE_SERVICE_ROLE_KEY in .env.local
- Restart dev server

---

### ✅ Test 2: Inventory Management
**URL:** `http://localhost:3000/admin/inventory`

**What to Test:**
1. Page loads without errors
2. Inventory stats display (Total Items, Low Stock, Out of Stock, Total Value)
3. Low Stock Alerts section shows items (if any)
4. Inventory table renders
5. Stock status filters work (All, In Stock, Low Stock, Out of Stock)
6. No "invalid input syntax" errors

**Expected Results:**
- ✅ No console errors about "low_stock_threshold"
- ✅ Stats cards render with numbers
- ✅ Low stock alerts display correctly
- ✅ Filter dropdown works without errors

**If Failed:**
- Check console for SQL errors
- Verify inventory_items table has data
- Check that fixes were applied to inventory.ts

---

### ✅ Test 3: Category Management
**URL:** `http://localhost:3000/admin/categories`

**What to Test:**
1. Page loads without errors
2. Category stats display (Total, Products, Active)
3. Categories list renders
4. No "column status does not exist" errors
5. Can view category details

**Expected Results:**
- ✅ No console errors about missing columns
- ✅ Stats show actual numbers
- ✅ Categories display with status badges
- ✅ Active/Inactive status visible

**If Failed:**
- ⚠️ **Most likely cause:** Migration not executed
- Run the database migration first
- Refresh the page after migration

---

### ✅ Test 4: Orders Management
**URL:** `http://localhost:3000/admin/orders`

**What to Test:**
1. Page loads without errors
2. Order stats display correctly
3. Orders table renders
4. Filter options work

**Expected Results:**
- ✅ No console errors
- ✅ Stats render (even if 0)
- ✅ Empty state shows if no orders

---

### ℹ️ Test 5: Collections (Static Data)
**URL:** `http://localhost:3000/admin/collections`

**Status:** Currently using mock data (not connected to backend)

**What to Test:**
1. Page loads without errors
2. Static collections display

**Note:** This page needs backend integration in future updates

---

### ℹ️ Test 6: Coupons (Static Data)
**URL:** `http://localhost:3000/admin/coupons`

**Status:** Currently using mock data (not connected to backend)

**What to Test:**
1. Page loads without errors
2. Static coupons display

**Note:** This page needs backend integration in future updates

---

## Console Error Checklist

### ❌ Errors That Should Be GONE:
- ❌ "User not allowed" AuthApiError
- ❌ "column categories.status does not exist"
- ❌ "invalid input syntax for type integer: \"low_stock_threshold\""
- ❌ "Cannot read properties of undefined (reading 'total')"

### ✅ What You Should See:
- ✅ Clean console (no red errors)
- ✅ Data loading states working
- ✅ Stats displaying properly
- ✅ Tables rendering correctly

---

## Browser Console Commands

### Check for Errors
```javascript
// Open browser console (F12) and run:
console.log('React Query Cache:', window.__REACT_QUERY_DEVTOOLS_CACHE__)
```

### Force Refresh Data
```javascript
// In browser console:
localStorage.clear()
location.reload()
```

### Check API Responses
```javascript
// Monitor network tab for:
// - /api/customers (should return 200)
// - /api/inventory (should return 200)
// - /api/categories (should return 200)
```

---

## Troubleshooting Guide

### Problem: "User not allowed" still appears

**Solution:**
1. Verify .env.local has SUPABASE_SERVICE_ROLE_KEY
2. Restart dev server completely (kill process, restart)
3. Clear browser cache
4. Check Supabase project is active

### Problem: Categories still show "status does not exist"

**Solution:**
1. ⚠️ **You MUST run the migration SQL first**
2. Go to Supabase Dashboard
3. SQL Editor → New Query
4. Copy `/app/backend-implementation/12-fix-categories-table.sql`
5. Execute it
6. Refresh the admin page

### Problem: Inventory filters not working

**Solution:**
1. Check browser console for errors
2. Verify inventory_items table exists and has data
3. Check that low_stock_threshold column exists
4. Ensure fixes in inventory.ts were applied

### Problem: Stats showing as "-" or "0"

**Solution:**
1. Check if you have data in the database
2. Verify API responses in Network tab
3. Check if service role key is valid
4. Look for errors in browser console

---

## Success Criteria

### All Tests Pass When:
- ✅ No red errors in browser console
- ✅ All stats cards show numbers (not loading forever)
- ✅ Tables render with data or empty states
- ✅ Filters work without errors
- ✅ Refresh buttons work
- ✅ No "User not allowed" errors
- ✅ No "column does not exist" errors
- ✅ No SQL syntax errors

---

## Performance Check

### Page Load Times (Target):
- Customers page: < 2 seconds
- Inventory page: < 2 seconds
- Categories page: < 1 second
- Orders page: < 2 seconds

### Network Requests:
- Should see successful API calls (200 status)
- No failed requests (4xx or 5xx)
- Reasonable response times (< 1 second per query)

---

## Post-Test Verification

After all tests pass, verify:

1. **Database State:**
```sql
-- Run in Supabase SQL Editor
SELECT COUNT(*) as total_customers FROM auth.users;
SELECT COUNT(*) as total_categories FROM categories;
SELECT COUNT(*) as total_inventory FROM inventory_items;
SELECT COUNT(*) as total_orders FROM orders;
```

2. **Environment:**
```bash
# Verify key is loaded
echo $SUPABASE_SERVICE_ROLE_KEY
```

3. **Application State:**
- All admin pages accessible
- No console errors
- Data displays correctly
- Features work as expected

---

## Known Limitations

### Current Limitations:
1. Collections page uses mock data (needs backend)
2. Coupons page uses mock data (needs backend)
3. Inventory filtering done client-side (fine for < 10k items)

### Future Improvements Needed:
1. Connect Collections to backend service
2. Connect Coupons to backend service
3. Add server-side pagination for inventory
4. Add real-time updates with Supabase subscriptions

---

## Support

If you encounter issues not covered in this guide:

1. Check `/app/BUGFIX_ANALYSIS_AND_SOLUTIONS.md` for detailed analysis
2. Review browser console for specific error messages
3. Check network tab for failed API calls
4. Verify database schema matches requirements
5. Ensure all migrations have been executed

---

*Happy Testing! 🚀*
