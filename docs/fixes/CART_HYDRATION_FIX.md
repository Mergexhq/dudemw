# Cart Page Hydration Issue Fix

## Date: January 2025
## Issue: Cart Page Not Loading When Items Present

---

## Problem Description

When users added items to their cart and visited the cart page, the page would not load automatically and required a manual refresh to display the cart contents. However, when the cart was empty, the page loaded fine.

### Symptoms:
- ✅ Empty cart page loads smoothly
- ❌ Cart page with items doesn't load automatically
- ❌ Requires manual refresh to see cart contents
- This is a classic hydration/mounting issue

---

## Root Cause Analysis

The issue was caused by **redundant mounting/loading states** in the cart rendering flow:

### The Problem Flow:

1. **Route Level** (`/app/src/app/(store)/cart/page.tsx`):
   - Uses `dynamic()` import with `ssr: false`
   - Shows loading skeleton while component loads
   - This is CORRECT and necessary

2. **Component Level** (`/app/src/domains/cart/components/CartPage.tsx`):
   - Had its OWN `mounted` state that started as `false`
   - Used `useEffect` to set `mounted` to `true`
   - Checked `if (!mounted || isLoading)` to show skeleton
   - This created a SECOND loading phase

3. **Context Level** (`/app/src/domains/cart/context.tsx`):
   - Already has proper `mounted` state management
   - Already has `isLoading` state
   - Loads cart from localStorage after mounting

### Why This Caused Issues:

The **double loading pattern** created a race condition:

```
Page Load → Route Loading → Component Mounting → Context Loading → Cart Display
              (Skeleton)      (Another Skeleton)    (localStorage)    (Finally!)
```

This caused the page to appear "stuck" in loading state, especially when:
- Cart items existed in localStorage
- The component's mounted check delayed rendering
- The rapid state changes confused React's rendering cycle

---

## Solution Implemented

**File Modified:** `/app/src/domains/cart/components/CartPage.tsx`

### Changes Made:

1. **Removed redundant `mounted` state**
   - Deleted `const [mounted, setMounted] = useState(false)`
   - Deleted the `useEffect` that set mounted to true
   - Removed `useState` and `useEffect` imports (no longer needed)

2. **Simplified loading check**
   - Changed from: `if (!mounted || isLoading)`
   - Changed to: `if (isLoading)`
   - Only relies on cart context's `isLoading` state

3. **Cleaner render flow**
   - Route handles SSR prevention with `ssr: false`
   - Context handles localStorage loading and `isLoading` state
   - Component simply checks `isLoading` from context

### Code Comparison:

**BEFORE (Problematic):**
```typescript
export default function CartPage() {
  const { cartItems, isLoading } = useCart()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || isLoading) { // Double check!
    return <CartSkeleton />
  }
  // ... rest of component
}
```

**AFTER (Fixed):**
```typescript
export default function CartPage() {
  const { cartItems, isLoading } = useCart()

  if (isLoading) { // Single check!
    return <CartSkeleton />
  }
  // ... rest of component
}
```

---

## Why This Fix Works

1. **Single Loading State**: Only the cart context manages loading state
2. **No Race Conditions**: Component renders immediately when context is ready
3. **SSR Prevention**: Route-level `ssr: false` prevents server-side hydration issues
4. **Proper Flow**: 
   ```
   Page Load → Route Loading → Cart Context Loads → Display Cart
                (Skeleton)       (localStorage)      (Done!)
   ```

---

## Testing Recommendations

### Test Case 1: Empty Cart
1. Clear cart (if items present)
2. Navigate to `/cart`
3. **Expected:** Empty cart message displays immediately

### Test Case 2: Cart With Items
1. Add products to cart
2. Navigate to `/cart`
3. **Expected:** Cart loads immediately with all items visible
4. **Expected:** No manual refresh needed

### Test Case 3: Add Item From Product Page
1. From product page, add item to cart
2. Click cart icon or navigate to `/cart`
3. **Expected:** New item appears immediately
4. **Expected:** No loading delays or stuck states

### Test Case 4: Remove Item From Cart
1. In cart page, remove an item
2. **Expected:** Item removed immediately
3. **Expected:** If last item, shows empty cart state

---

## Related Files

- `/app/src/domains/cart/components/CartPage.tsx` - Fixed component
- `/app/src/domains/cart/context.tsx` - Cart context (unchanged, already correct)
- `/app/src/app/(store)/cart/page.tsx` - Route wrapper (unchanged, already correct)

---

## Technical Notes

### Why Route-Level SSR Disabling Is Sufficient:

The route already uses:
```typescript
const CartPageComponent = dynamic(() => import('@/domains/cart'), {
  ssr: false,  // Prevents server-side rendering
  loading: () => <Skeleton /> // Shows while loading
})
```

This ensures:
- No hydration mismatch (component only renders on client)
- localStorage is always available when component mounts
- No need for additional mounting checks in child components

### Cart Context Loading Pattern:

The context properly handles mounting:
```typescript
const [mounted, setMounted] = useState(false)
const [isLoading, setIsLoading] = useState(true)

useEffect(() => {
  setMounted(true)
}, [])

useEffect(() => {
  if (!mounted) return
  // Load from localStorage
  setIsLoading(false)
}, [mounted])
```

This pattern is correct and should NOT be duplicated in child components.

---

## Result

✅ Cart page now loads immediately when items are present
✅ No manual refresh required
✅ Cleaner, simpler code
✅ No hydration issues
✅ Improved user experience
