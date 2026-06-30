# DMW Architecture Audit - Database Schema Blueprint

This document outlines the database layer for Dude Men's Wears, describing the structure of all PostgreSQL tables, relations, indexes, foreign keys, enums, and Prisma models.

---

## 🗄️ Database Architecture Diagram

The database structure maps out standard e-commerce relations (Products ↔ Variants, Customers ↔ Orders, Campaigns ↔ Rules):

```
+---------------+           +---------------+           +-----------------------+
|  categories   |<----------|   products    |---------->|   product_variants    |
| (GST rates)   |           | (SEO/Status)  |           | (SKU, Stock, Prices)  |
+---------------+           +---------------+           +-----------+-----------+
                                    |                               |
                                    v                               v
                            +---------------+           +-----------+-----------+
                            |  wishlists    |           |      cart_items       |
                            | (Fav Products)|           | (User/Guest Sessions) |
                            +---------------+           +-----------+-----------+
                                                                    |
                                                                    | Checkout Flow
                                                                    v
+---------------+           +---------------+           +-----------+-----------+
|   customers   |<----------|    orders     |---------->|      order_items      |
| (Notes, Logs) |           | (COD/Gateway) |           | (Quantities, Prices)  |
+---------------+           +---------------+           +-----------------------+
                                    |
            +-----------------------+-----------------------+
            |                       |                       |
            v                       v                       v
+---------------+           +---------------+           +-----------------------+
|  order_taxes  |           |   payments    |           |    order_discounts    |
| (CGST/SGST)   |           | (Verify state)|           | (Promos, Campaigns)   |
+---------------+           +---------------+           +-----------------------+
```

---

## 📋 Comprehensive Database Table Reference

### 1. Catalog Tables

#### `products`
* **Purpose**: Core product metadata.
* **Fields**:
  * `id`: `Uuid` (Primary Key, Default: `gen_random_uuid()`)
  * `title`: `String` (Product Title)
  * `slug`: `String` (Unique slug for URL mapping)
  * `status`: `String` (Draft, Published, etc.)
  * `category_id`: `Uuid` (Foreign Key -> `categories.id`)
  * `default_variant_id`: `Uuid` (Foreign Key -> `product_variants.id`)
  * `average_rating`: `Decimal`
  * `review_count`: `Int`
* **Relations**: Linked to `categories`, `product_variants`, `product_images`, `product_options`, `product_reviews`, and `wishlists`.
* **Indexes**: Unique index on `slug`.

#### `product_variants`
* **Purpose**: The physical SKU level of products, representing specific size/color variants.
* **Fields**:
  * `id`: `Uuid` (Primary Key)
  * `product_id`: `Uuid` (Foreign Key -> `products.id`)
  * `sku`: `String` (Unique SKU code)
  * `price`: `Decimal` (Current selling price)
  * `discount_price`: `Decimal` (Promo price)
  * `stock`: `Int` (Cached physical stock count)
* **Relations**: Child of `products`. Parent of `inventory_items`, `order_items`, `cart_items`, and `variant_images`.
* **Indexes**: Unique index on `sku`.

#### `categories`
* **Purpose**: Product categories (e.g. Cargo, T-Shirts).
* **Fields**:
  * `id`: `Uuid` (Primary Key)
  * `name`: `String`
  * `slug`: `String` (Unique)
  * `display_order`: `Int`
* **Relations**: 1-to-1 with `category_tax_rules`, 1-to-many with `products`.

#### `collections`
* **Purpose**: Logical product groupings (e.g. Bestsellers, New Drops).
* **Fields**:
  * `id`: `Uuid` (Primary Key)
  * `title`: `String`
  * `slug`: `String` (Unique)
  * `type`: `String` (Manual, Smart)
  * `rule_json`: `Json` (Holds conditions for smart collections)

---

### 2. Transactional & Order Tables

#### `orders`
* **Purpose**: Customer purchase transactions.
* **Fields**:
  * `id`: `Uuid` (Primary Key)
  * `order_number`: `String` (Unique invoice reference number: `DMW-YYYYMMDD-XXXX`)
  * `customer_id`: `Uuid` (Foreign Key -> `customers.id`)
  * `total_amount`: `Decimal` (Grand total)
  * `shipping_amount`: `Decimal`
  * `order_status`: `String` (Pending, Processing, Shipped, Delivered, Cancelled)
  * `payment_status`: `String` (Pending, Paid, Failed, Refunded)
  * `razorpay_order_id`: `String` (Razorpay reference ID)
  * `shipping_address`: `Json` (Snapshot of address at time of purchase)
* **Relations**: 1-to-many with `order_items`, `payments`, `order_status_history`, and `order_discounts`. 1-to-1 with `order_taxes`.
* **Indexes**: Unique index on `order_number`.

#### `order_items`
* **Purpose**: Individual lines inside an order.
* **Fields**:
  * `id`: `Uuid` (Primary Key)
  * `order_id`: `Uuid` (Foreign Key -> `orders.id`)
  * `variant_id`: `Uuid` (Foreign Key -> `product_variants.id`)
  * `quantity`: `Int`
  * `price`: `Decimal` (Price snap at purchase)

#### `order_taxes`
* **Purpose**: GST breakdown details for tax compliance.
* **Fields**:
  * `id`: `Uuid` (Primary Key)
  * `order_id`: `Uuid` (Unique, Foreign Key -> `orders.id`)
  * `taxable_amount`: `Decimal`
  * `cgst`: `Decimal` (Central GST)
  * `sgst`: `Decimal` (State GST)
  * `igst`: `Decimal` (Integrated GST)
  * `total_tax`: `Decimal`
  * `tax_type`: `String` (CGST_SGST or IGST)

---

### 3. Customer & Session Tables

#### `customers`
* **Purpose**: Centralized customer profile tracking (both Guest and Registered).
* **Fields**:
  * `id`: `Uuid` (Primary Key)
  * `auth_user_id`: `String` (Unique, stores Clerk User ID)
  * `email`: `String`
  * `phone`: `String`
  * `customer_type`: `String` (registered, guest)
  * `status`: `String` (active, merged)
* **Relations**: Linked to `orders`, `customer_addresses`, `customer_notes`, and `customer_activity_log`.

#### `cart_items`
* **Purpose**: Shopping cart persistence.
* **Fields**:
  * `id`: `Uuid` (Primary Key)
  * `user_id`: `Uuid` (For registered users)
  * `guest_id`: `String` (Session identifier for guests)
  * `variant_id`: `Uuid` (Foreign Key -> `product_variants.id`)
  * `quantity`: `Int`

#### `wishlists`
* **Purpose**: Saved products for later.
* **Fields**:
  * `id`: `Uuid` (Primary Key)
  * `user_id`: `Uuid` (Customer UUID)
  * `guest_id`: `String` (Guest session identifier)
  * `product_id`: `Uuid` (Foreign Key -> `products.id`)
* **Constraints**: Unique constraint on `[user_id, product_id]` when `user_id` is not null.

---

### 4. Promotion & Campaign Tables

#### `campaigns`
* **Purpose**: Automated storefront discount campaigns.
* **Fields**:
  * `id`: `Uuid` (Primary Key)
  * `name`: `String`
  * `status`: `String` (Active, Draft, Expired)
  * `priority`: `Int` (Determines stack sorting order)
  * `apply_type`: `String` (auto, coupon)

#### `campaign_rules`
* **Purpose**: Constraints that must pass for a campaign to apply (e.g. Cart Total >= 1000).
* **Fields**:
  * `id`: `Uuid` (Primary key)
  * `campaign_id`: `Uuid` (Foreign Key -> `campaigns.id`)
  * `rule_type`: `String` (min_cart_amount, specific_categories)
  * `operator`: `String` (>=, ==)
  * `value`: `Json` (Comparison parameters)

---

## ⚡ Enums & Triggers Reference

* **Enums**: Roles are managed as custom text hierarchies inside the code rather than database-level Postgres enums (`super_admin`, `admin`, `manager`, `staff`). Status states are text columns validated by application schemas.
* **Triggers**: DB has a trigger setup on `products` and `product_variants` that can alert other schemas.
* **Partial Indexes**:
  * Wishlist unique constraint: `CREATE UNIQUE INDEX wishlists_user_id_product_id_idx ON wishlists(user_id, product_id) WHERE (user_id IS NOT NULL);`

---

## 🚀 Database Migrations History

1. **Supabase Epoch**: Initial tables created in Supabase with schemas, primary key UUID generators, and foreign keys.
2. **Neon/Prisma Migration**: Transitioned backend to Neon Postgres using Prisma. Models were adapted to Postgres-native settings. Models were generated into `src/generated/prisma`.
3. **Tax Settings Migration (`docs/migrations/tax-settings-tables.sql`)**: Introduces GST rules including `category_tax_rules`, `product_tax_rules`, and `order_taxes` to support CGST/SGST/IGST splits.
