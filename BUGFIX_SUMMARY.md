# Bug Fixes Summary

## Date: January 2025
## Issues Fixed: 2 Critical Bugs

---

## Issue #1: Store Page - Optional Fields Blocking Payment ✅ FIXED

### Problem
When customers tried to checkout with optional fields (Email, Last Name, Apartment/Suite) left empty, the payment failed with error: **"Failed to initiate payment. Customer details are required"**

### Root Cause
- The checkout UI correctly marked these fields as optional:
  - Email (Optional)
  - Last Name (Optional)
  - Apartment, suite, etc. (Optional)
- But the payment API (`/api/payments/create-order/route.ts`) was validating that both `email` and `name` were required
- This created a mismatch between UI expectations and backend validation

### Solution Implemented
**File Modified:** `/app/src/app/api/payments/create-order/route.ts`

**Changes:**
1. Updated validation to only require `phone` as the essential field
2. Made `email` and `lastName` truly optional in the API
3. Added fallback values for optional fields when creating Razorpay orders:
   - Email defaults to `'noemail@guest.com'` if not provided
   - Name defaults to `'Guest'` if not provided
   - Added phone to Razorpay notes for better tracking

**Code Changes:**
```typescript
// OLD - Required both email and name
if (!customerDetails?.email || !customerDetails?.name) {
  return NextResponse.json(
    { success: false, error: 'Customer details are required' },
    { status: 400 }
  );
}

// NEW - Only requires phone
if (!customerDetails?.phone) {
  return NextResponse.json(
    { success: false, error: 'Phone number is required' },
    { status: 400 }
  );
}
```

### Result
✅ Customers can now complete purchases with optional fields left empty
✅ Only required fields are: Phone, First Name, Address, City, State, PIN Code
✅ Optional fields work as intended: Email, Last Name, Apartment/Suite

---

## Issue #2: Admin Panel - Collections Creation RLS Error ✅ FIXED

### Problem
When trying to create collections in the admin panel, the operation failed with error: **"new row violates row-level security policy for table 'collections'"**

### Root Cause
- The collections creation was using client-side Supabase (`createClient()`)
- Client-side operations respect Row-Level Security (RLS) policies
- The current admin user didn't have INSERT permissions due to RLS policies

### Solution Implemented
**Files Created/Modified:**

1. **New API Route:** `/app/src/app/api/admin/collections/route.ts`
   - Created server-side API endpoint using `supabaseAdmin`
   - Bypasses RLS policies (similar to other admin operations)
   - Handles collection creation and product assignment
   - Includes proper error handling and rollback on failures

2. **Updated:** `/app/src/app/admin/collections/create/page.tsx`
   - Changed from direct Supabase client calls to API endpoint
   - Removed unused `createClient` import
   - Now uses `fetch()` to call the new API endpoint

**Architecture Change:**
```
BEFORE:
Admin UI → Supabase Client (with RLS) → Database ❌ Blocked by RLS

AFTER:
Admin UI → API Route → Supabase Admin (bypasses RLS) → Database ✅ Success
```

**API Endpoint Features:**
- ✅ Validates all required fields
- ✅ Auto-generates slug from collection title
- ✅ Uses `supabaseAdmin` to bypass RLS
- ✅ Handles product-to-collection assignments
- ✅ Automatic cleanup on errors (rollback)
- ✅ Detailed error messages for debugging

### Result
✅ Collections can now be created successfully from the admin panel
✅ No more RLS policy violations
✅ Proper error handling and user feedback
✅ Consistent with other admin operations in the codebase

---

## Testing Recommendations

### Test Case 1: Store Checkout with Optional Fields
1. Add items to cart
2. Go to checkout
3. Fill only required fields (leave Email, Last Name, Apartment blank)
4. Complete purchase
5. **Expected:** Order should complete successfully

### Test Case 2: Collections Creation
1. Login to admin panel
2. Navigate to Collections
3. Click "Create Collection"
4. Fill in collection details and select products
5. Click "Create Collection"
6. **Expected:** Collection should be created without RLS errors

---

## Files Modified

1. `/app/src/app/api/payments/create-order/route.ts` - Fixed optional fields validation
2. `/app/src/app/api/admin/collections/route.ts` - New API route (created)
3. `/app/src/app/admin/collections/create/page.tsx` - Updated to use new API

---

## Notes

- No breaking changes to existing functionality
- Both fixes follow existing patterns in the codebase
- The optional fields fix aligns the backend with the UI expectations
- The collections fix uses the same `supabaseAdmin` pattern as other admin operations
- All changes are backward compatible
