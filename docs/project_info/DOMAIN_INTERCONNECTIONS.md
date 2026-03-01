# Domain Interconnections Implementation

This document explains the domain-based architecture implemented for the Next.js + Supabase ecommerce admin dashboard.

## Architecture Overview

The system follows a three-layer architecture:

```
UI Layer (Admin Pages)
     ↓
Frontend Logic Layer (Domain Functions)
     ↓
Backend/Data Layer (Supabase via MCP)
```

## Core Principles

1. **Pages never talk to pages. Pages talk to domains. Domains react to events.**
2. **Frontend orchestrates. UI presents. Backend decides. Database stores.**
3. **If changing something requires updating 3 pages, the architecture is wrong. If it requires updating 1 domain, it's right.**

## Domain Structure

### 1. Product Domain (`src/domains/product.ts`)
**Responsibility**: Core product management

**Key Functions**:
- `createProduct()` - Creates product with variants and inventory
- `getProducts()` - Fetches products with relationships
- `getProduct()` - Single product with full details
- `updateProduct()` - Updates product and triggers revalidation
- `deleteProduct()` - Deletes product and cascades effects

**Interconnections**:
- Creates inventory records when variants are created
- Links to categories and collections
- Triggers revalidation across affected domains

### 2. Inventory Domain (`src/domains/inventory.ts`)
**Responsibility**: Stock management and tracking

**Key Functions**:
- `updateVariantStock()` - **CRITICAL**: Used by both Product and Inventory pages
- `decreaseInventory()` - Called by Order domain when orders placed
- `restoreInventory()` - Called by Order domain when orders cancelled
- `getInventoryItems()` - Global inventory view
- `getProductInventory()` - Contextual inventory for specific product

**Interconnections**:
- **Product ↔ Inventory**: Same data source, different views
- **Order → Inventory**: Automatic stock adjustments
- **Dashboard ← Inventory**: Read-only alerts and metrics

### 3. Order Domain (`src/domains/order.ts`)
**Responsibility**: Order management and inventory effects

**Key Functions**:
- `createOrder()` - Creates order and decreases inventory automatically
- `updateOrderStatus()` - Updates status and handles inventory restoration
- `getOrders()` - Orders with full relationships
- `getOrderStats()` - Statistics for dashboard

**Interconnections**:
- **Order → Inventory**: Automatic inventory decrease on order creation
- **Order → Inventory**: Automatic inventory restoration on cancellation
- **Dashboard ← Order**: Read-only statistics and recent orders

### 4. Collection Domain (`src/domains/collection.ts`)
**Responsibility**: Product groupings and merchandising

**Key Functions**:
- `createCollection()` - Creates collection (view, not ownership)
- `getCollectionProducts()` - **CRITICAL**: Always fetches fresh product data
- `addProductsToCollection()` - Links products (references only)
- `getCollectionsForProduct()` - Shows which collections contain a product

**Interconnections**:
- **Product ↔ Collection**: Collections reference products, never duplicate
- **Collection → Homepage**: Homepage sections use collections
- **Product updates → Collection pages**: Auto-reflect via fresh data fetch

### 5. Banner Domain (`src/domains/banner.ts`)
**Responsibility**: Marketing banners (leaf nodes)

**Key Functions**:
- `createBanner()` - Creates banner with target links
- `getActiveBanners()` - Banners for specific placement
- `updateBanner()` - Updates banner (no reactive logic)

**Interconnections**:
- **Banners are leaf nodes**: They point to products/collections but never react to changes
- **No automatic updates**: Banners remain unchanged when products change

### 6. Customer Domain (`src/domains/customer.ts`)
**Responsibility**: User accounts and guest management

**Key Functions**:
- `getCustomerStats()` - Customer order history and statistics
- `getCustomers()` - All customers with aggregated data
- `getCustomerDashboardStats()` - Statistics for dashboard

### 7. Dashboard Domain (`src/domains/dashboard.ts`)
**Responsibility**: Read-only intelligence and metrics

**Key Functions**:
- `getDashboardOverview()` - Comprehensive dashboard data
- `getSalesAnalytics()` - Sales charts and trends
- `getTopSellingProducts()` - Product performance metrics
- `getInventoryAlerts()` - Stock alerts summary

**Interconnections**:
- **Dashboard never writes**: Only queries other domains
- **Aggregates all domains**: Orders, inventory, products, customers
- **Real-time intelligence**: Always reflects current state

## Critical Interconnection Rules

### 1. Product ↔ Inventory (HIGHEST PRIORITY)
```typescript
// SAME FUNCTION used by both pages
import { updateVariantStock } from '@/domains'

// Product page - contextual editor
await updateVariantStock(variantId, { quantity: newStock })

// Inventory page - global editor  
await updateVariantStock(variantId, { quantity: newStock })
```

**Rule**: Both pages use the SAME `updateVariantStock()` function. Same data, different views.

### 2. Order → Inventory (Automatic Effects)
```typescript
// When order is placed
const orderResult = await createOrder(orderData)
// ↓ Automatically calls decreaseInventory() for each item

// When order is cancelled
const statusResult = await updateOrderStatus(orderId, 'cancelled')
// ↓ Automatically calls restoreInventory() for each item
```

**Rule**: Orders never edit inventory directly. They emit effects through domain functions.

### 3. Product → Collection (References Only)
```typescript
// Collections store references, not duplicates
await addProductsToCollection(collectionId, [productId1, productId2])

// Collection page always fetches fresh product data
const products = await getCollectionProducts(collectionId)
// ↓ Returns current product state, never stale data
```

**Rule**: Collections are views, not ownership. Always fetch fresh product data.

### 4. Banners (Leaf Nodes)
```typescript
// Banners point to targets but never react
await createBanner({
  title: "Summer Sale",
  link_url: "/collections/summer-collection"
})

// When products in summer-collection change:
// ↓ Banner remains unchanged (correct behavior)
// ↓ Banner still points to same collection URL
// ↓ Collection page shows updated products
```

**Rule**: Banners are dumb pointers. They don't "listen" to product changes.

## Implementation Checklist

### ✅ Completed
- [x] Domain layer with all required functions
- [x] Database schema with proper indexes and triggers
- [x] MCP configuration for Supabase
- [x] Updated TypeScript types
- [x] Core interconnection functions implemented

### 🔄 Next Steps (Refactoring Existing Pages)

#### For Each Admin Page:
1. **Replace direct Supabase calls** with domain function imports
2. **Remove inline business logic** from UI components
3. **Add proper revalidatePath calls** in domain functions
4. **Test interconnections** with related pages
5. **Verify no page-to-page coupling** exists

#### Example Refactoring:
```typescript
// ❌ OLD: Direct Supabase call in page
import { supabaseAdmin } from '@/lib/supabase'

// ✅ NEW: Domain function import
import { getProducts, deleteProduct } from '@/domains'
```

## Testing Interconnections

### Test 1: Product → Inventory Sync
1. Update stock in Product page
2. Verify Inventory page shows new stock
3. Update stock in Inventory page  
4. Verify Product page shows new stock

### Test 2: Order → Inventory Effect
1. Place order with 5 units
2. Verify inventory decreased by 5
3. Cancel order with restore stock
4. Verify inventory restored

### Test 3: Product → Collection Reference
1. Update product title in Product page
2. Verify Collection page shows updated title
3. Confirm product not duplicated, just referenced

### Test 4: Banner Independence
1. Update product that banner points to
2. Verify banner still works (points to same product ID)
3. Confirm banner didn't "react" to product change

### Test 5: Dashboard Read-Only
1. Verify dashboard has no update functions
2. Place order, verify dashboard metrics update
3. Update inventory, verify dashboard alerts update

## Success Criteria

Your refactoring is complete when:

✅ All admin pages use domain functions (zero direct Supabase calls in pages)
✅ Product and Inventory pages use the SAME `updateVariantStock` function
✅ Order placement automatically decreases inventory
✅ Order cancellation automatically restores inventory  
✅ Collections store only references, fetch fresh product data
✅ Banners are leaf nodes with no reactive logic
✅ Dashboard has zero write operations
✅ All domain functions include proper revalidatePath calls
✅ All interconnection tests pass

## Common Mistakes to Avoid

❌ **Keeping direct Supabase calls in pages**
❌ **Creating separate functions per page** (e.g., `updateStockFromProductPage`)
❌ **Duplicating product data in collections**
❌ **Making banners reactive to product changes**
❌ **Letting dashboard write data**
❌ **Page-to-page state synchronization**
❌ **Forgetting revalidatePath calls**
❌ **Mixing business logic in UI components**

## File Structure

```
src/
├── domains/
│   ├── index.ts              # Central exports
│   ├── product.ts            # Product management
│   ├── inventory.ts          # Stock management  
│   ├── order.ts              # Order processing
│   ├── collection.ts         # Product groupings
│   ├── banner.ts             # Marketing banners
│   ├── customer.ts           # User management
│   └── dashboard.ts          # Read-only intelligence
├── app/admin/                # Admin pages (import from domains)
├── components/admin/         # Admin UI (no business logic)
└── lib/
    ├── supabase.ts          # Database client
    └── database.types.ts    # Generated types
```

## Key Takeaways

1. **Domain functions are the single source of truth** for business logic
2. **Pages orchestrate, domains decide, database stores**
3. **Interconnections happen through shared functions, not listeners**
4. **Always revalidate affected paths** when data changes
5. **Test interconnections, not just individual features**
6. **Dashboard is read-only intelligence, never writes data**

This architecture ensures your Next.js + Supabase ecommerce will scale without rewrites and maintain clean separation of concerns.