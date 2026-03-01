# Admin Product Navigation Implementation Guide

This guide documents the complete admin product navigation system with proper frontend/backend separation using Next.js + Supabase MCP.

## 🧭 Navigation Structure

```
/admin/products                           → Product List (overview)
/admin/products/:id                       → Product Detail (read-only)
/admin/products/:id/edit                  → Product Edit (full form)
/admin/products/:id/variants              → Variants List (SKU management)
/admin/products/:id/variants/:variantId   → Variant Detail (SKU truth)
```

## 🎯 Page Responsibilities

### 1. Product List (`/admin/products`)
**Purpose**: Find and navigate to products
**Frontend**: Table, search, filters, navigation
**Backend**: Query, aggregate, paginate

### 2. Product Detail (`/admin/products/:id`)
**Purpose**: Understand product state (read-only)
**Frontend**: Display summaries, navigation buttons
**Backend**: Compute aggregations, pricing/inventory summaries

### 3. Product Edit (`/admin/products/:id/edit`)
**Purpose**: Edit product structure and metadata
**Frontend**: Form management, validation UX, preview
**Backend**: Validate, create/update product + variants + inventory

### 4. Variants List (`/admin/products/:id/variants`)
**Purpose**: Manage SKUs for a product
**Frontend**: Table, inline editing, bulk operations
**Backend**: Filter variants, validate updates, maintain consistency

### 5. Variant Detail (`/admin/products/:id/variants/:variantId`)
**Purpose**: Edit individual SKU (authoritative)
**Frontend**: Detailed form, safety warnings
**Backend**: Validate SKU rules, update inventory, enforce constraints

## 🔒 Frontend vs Backend Responsibilities

### ✅ Frontend Responsibilities
- **UI State**: Form state, loading states, validation UX
- **Navigation**: Links, breadcrumbs, page transitions
- **Display Logic**: Formatting, badges, status colors
- **User Interaction**: Clicks, form inputs, inline editing
- **Local Validation**: Required fields, format checking
- **Preview Logic**: Show/hide, expand/collapse

### ✅ Backend Responsibilities  
- **Business Rules**: Price validation, SKU uniqueness, stock rules
- **Data Integrity**: Transactions, constraints, referential integrity
- **Calculations**: Price ranges, stock totals, availability
- **Security**: Access control, input sanitization, SQL injection prevention
- **Side Effects**: Inventory updates, revalidation, audit logs
- **Validation**: Business logic validation, safety checks

### ❌ Frontend Must NOT
- Calculate final prices or discounts
- Decide stock availability
- Validate SKU uniqueness
- Enforce business rules
- Touch inventory directly
- Make deletion safety decisions

### ❌ Backend Must NOT
- Care about UI layout or styling
- Handle form state management
- Decide navigation flow
- Manage loading states

## 🏗️ Architecture Implementation

### Domain Layer Structure
```typescript
// src/domains/product.ts - Product management
export async function getProduct(id: string)
export async function getProductWithSummaries(id: string)
export async function updateProduct(id: string, updates: ProductUpdate)
export async function validateSku(sku: string, excludeVariantId?: string)

// src/domains/inventory.ts - Stock management  
export async function updateVariantStock(variantId: string, updates: InventoryUpdate)
export async function updateVariant(variantId: string, updates: VariantUpdate)
export async function deleteVariant(variantId: string)
export async function getVariantUsageInfo(variantId: string)
```

### Database Functions (Supabase MCP)
```sql
-- Business logic in database for consistency
SELECT get_product_pricing_summary(product_uuid);
SELECT get_product_inventory_summary(product_uuid);
SELECT can_delete_variant(variant_uuid);
SELECT is_sku_unique(sku_value, exclude_variant_id);
SELECT get_variant_usage_info(variant_uuid);
```

### Component Structure
```typescript
// Frontend components handle UI only
<ProductDetailView product={product} />           // Display only
<ProductEditForm product={product} />             // Form management
<VariantsListView product={product} />            // Table + inline editing
<VariantDetailView product={product} variant={variant} /> // Detailed form
```

## 🔄 Data Flow Examples

### Example 1: Update Variant Stock
```typescript
// 1. Frontend: User changes stock in input
const handleStockUpdate = (variantId: string, newStock: number) => {
  // Frontend sends intent to backend
  updateVariantStock(variantId, { quantity: newStock })
}

// 2. Backend: Domain function validates and updates
export async function updateVariantStock(variantId, updates) {
  // Validate business rules
  if (updates.quantity < 0 && !allowBackorders) {
    return { success: false, error: 'Negative stock not allowed' }
  }
  
  // Update database atomically
  // Log inventory change
  // Revalidate affected pages
}

// 3. Frontend: Refresh to show updated data
router.refresh() // Gets fresh data from backend
```

### Example 2: Delete Variant Safety
```typescript
// 1. Frontend: User clicks delete
const handleDelete = async (variantId: string) => {
  // Frontend asks backend for safety check
  const safetyCheck = await canDeleteVariant(variantId)
  
  if (!safetyCheck.canDelete) {
    // Frontend shows warning (UI responsibility)
    toast.error('Cannot delete variant used in orders')
    return
  }
  
  // Frontend sends delete intent
  await deleteVariant(variantId)
}

// 2. Backend: Domain function enforces rules
export async function deleteVariant(variantId: string) {
  // Check if used in orders (business rule)
  // Check if last variant (business rule)  
  // Delete if safe (data integrity)
}
```

## 🧪 Testing the Implementation

### Test 1: Product Detail Page
```typescript
// ✅ Should display computed summaries
expect(page.getByText('₹1,499 - ₹2,999')).toBeVisible() // Price range
expect(page.getByText('120 total stock')).toBeVisible()   // Stock total
expect(page.getByText('3 variants')).toBeVisible()       // Variant count

// ✅ Should navigate correctly
await page.click('[data-testid="edit-product"]')
expect(page.url()).toContain('/edit')
```

### Test 2: Variant Inline Editing
```typescript
// ✅ Should update stock via domain function
await page.fill('[data-testid="stock-input"]', '50')
await page.press('[data-testid="stock-input"]', 'Enter')

// Backend should be called with correct parameters
expect(updateVariantStock).toHaveBeenCalledWith(variantId, { quantity: 50 })
```

### Test 3: SKU Validation
```typescript
// ✅ Should prevent duplicate SKUs
await page.fill('[data-testid="sku-input"]', 'EXISTING-SKU')
await page.click('[data-testid="save-button"]')

expect(page.getByText('SKU already exists')).toBeVisible()
```

### Test 4: Deletion Safety
```typescript
// ✅ Should prevent deletion of variants used in orders
const variantUsedInOrders = await createVariantWithOrders()
await page.goto(`/admin/products/${productId}/variants/${variantUsedInOrders.id}`)

expect(page.getByText('Delete Variant')).toBeDisabled()
expect(page.getByText('used in orders')).toBeVisible()
```

## 🚀 Implementation Checklist

### ✅ Completed
- [x] Navigation structure with proper page separation
- [x] Domain functions with backend business logic
- [x] Database functions for complex calculations
- [x] Frontend components with UI-only responsibilities
- [x] Proper error handling and validation
- [x] Security constraints and indexes

### 🔄 Next Steps
1. **Implement remaining UI components**
   - Product edit form with variant generation
   - Variant creation flow
   - Bulk operations interface

2. **Add advanced features**
   - CSV import/export
   - Bulk price updates
   - Inventory adjustments
   - Audit trail viewing

3. **Performance optimizations**
   - Implement proper caching
   - Add pagination for large variant lists
   - Optimize database queries

4. **Testing**
   - Unit tests for domain functions
   - Integration tests for page flows
   - E2E tests for critical paths

## 🎯 Success Criteria

Your implementation is complete when:

✅ **Clear Separation**: Frontend handles UI, backend handles business logic
✅ **Proper Navigation**: Each page has a single, clear purpose
✅ **Data Integrity**: All business rules enforced at database level
✅ **Performance**: Fast loading with proper indexing
✅ **Security**: Input validation and access control
✅ **Maintainability**: Changes require updating only one layer
✅ **Testability**: Each layer can be tested independently

## 🔧 Key Files Created

```
src/
├── app/admin/products/
│   ├── [id]/
│   │   ├── page.tsx                    # Product Detail
│   │   ├── edit/page.tsx               # Product Edit  
│   │   └── variants/
│   │       ├── page.tsx                # Variants List
│   │       └── [variantId]/page.tsx    # Variant Detail
│   └── page.tsx                        # Products List
├── components/admin/
│   ├── product-detail/
│   │   └── product-detail-view.tsx     # Read-only product view
│   └── variants/
│       ├── variants-list-view.tsx      # Variants table + inline editing
│       └── variant-detail-view.tsx     # Detailed variant form
└── domains/
    ├── product.ts                      # Product business logic
    └── inventory.ts                    # Inventory business logic
```

## 💡 Key Insights

1. **Pages never talk to pages** - All communication goes through domains
2. **Same function, different views** - `updateVariantStock()` used by both Product and Inventory pages
3. **Backend decides, frontend displays** - Business logic lives in domain functions
4. **Database functions for complex logic** - Use Supabase functions for calculations
5. **Safety first** - Always validate before destructive operations
6. **Audit everything** - Log all inventory changes for debugging

This architecture ensures your admin interface scales without becoming a maintenance nightmare.