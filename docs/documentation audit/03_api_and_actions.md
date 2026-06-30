# DMW Architecture Audit - API & Server Actions Directory

This document provides a comprehensive reference of all REST API endpoints and Next.js Server Actions used in the DMW application.

---

## 🌐 API Route Inventory (`/api/*`)

All API routes are implemented as Route Handlers inside the Next.js App Router.

### 1. Storefront Public APIs

#### `GET /api/categories`
* **Purpose**: Retrieves all active categories.
* **Authentication**: None.
* **Request**: No parameters.
* **Response**:
  ```json
  {
    "success": true,
    "data": [
      { "id": "uuid", "name": "Cargo", "slug": "cargo", "image_url": "url" }
    ]
  }
  ```
* **Service**: `src/lib/services/categories.ts`
* **Database Tables**: `categories`
* **Consumers**: Navbar, Categories Grid component.

#### `GET /api/products/featured`
* **Purpose**: Fetch bestseller and new drop items for the home page.
* **Authentication**: None.
* **Request**: Query parameters: `?limit=8`.
* **Response**: List of product objects with primary images.
* **Service**: `src/lib/services/products.ts`
* **Database Tables**: `products`, `product_variants`, `product_images`
* **Consumers**: Homepage Client sections.

#### `GET /api/search/instant`
* **Purpose**: Performs high-speed search queries for search suggestions.
* **Authentication**: None.
* **Request**: `?q=black+tshirt`
* **Response**: List of matching titles and handles.
* **Service**: `src/lib/services/filter-service.ts`
* **Database Tables**: `products`
* **Consumers**: `GlobalSearch` dialog search input.

---

### 2. Transactional & Calculation APIs

#### `POST /api/shipping/calculate`
* **Purpose**: Calculates shipping fees for checkout.
* **Authentication**: None (accepts guest details).
* **Request**:
  ```json
  {
    "postalCode": "636306",
    "state": "Tamil Nadu",
    "totalQuantity": 2,
    "variantIds": ["uuid-1"]
  }
  ```
* **Response**:
  ```json
  {
    "success": true,
    "rate": 60.00,
    "provider": "Standard Courier",
    "estimatedDaysMin": 3,
    "estimatedDaysMax": 5
  }
  ```
* **Service**: `src/lib/services/shipping-calculation.ts`
* **Database Tables**: `shipping_rules`, `shipping_zones`, `shipping_rates`
* **Consumers**: `CheckoutFormV2.tsx` (real-time fee update).

#### `POST /api/tax/calculate`
* **Purpose**: Computes correct CGST/SGST/IGST rates according to Indian Interstate laws.
* **Authentication**: None.
* **Request**:
  ```json
  {
    "customerState": "Karnataka",
    "items": [
      { "productId": "uuid", "price": 999.00, "quantity": 1 }
    ]
  }
  ```
* **Response**:
  ```json
  {
    "success": true,
    "taxableAmount": 846.61,
    "cgst": 0,
    "sgst": 0,
    "igst": 152.39,
    "totalTax": 152.39,
    "gstRate": 18
  }
  ```
* **Service**: `src/lib/services/tax-calculation.ts`
* **Database Tables**: `tax_settings`, `category_tax_rules`
* **Consumers**: `CheckoutFormV2.tsx` (invoice breakdown).

#### `POST /api/payments/create-order`
* **Purpose**: Registers checkout order and creates Razorpay instance.
* **Authentication**: Guest ID cookie or Clerk JWT.
* **Request**:
  ```json
  {
    "amount": 199800, // in paise
    "currency": "INR",
    "receipt": "invoice_xxxx"
  }
  ```
* **Response**: Razorpay Order details.
* **Service**: `src/lib/services/razorpay.ts`
* **Consumers**: `CheckoutFormV2.tsx` (initiating Razorpay modal).

#### `POST /api/payments/verify`
* **Purpose**: Verifies HMAC payment signature from Razorpay.
* **Authentication**: Guest ID cookie or Clerk JWT.
* **Request**:
  ```json
  {
    "razorpay_order_id": "order_xxxx",
    "razorpay_payment_id": "pay_xxxx",
    "razorpay_signature": "signature_xxxx"
  }
  ```
* **Response**: `{ "success": true }`
* **Service**: `src/lib/services/razorpay.ts`
* **Database Tables**: `orders`, `payments`
* **Consumers**: `CheckoutFormV2.tsx` (captures paid success).

---

### 3. Webhooks & Cron Job APIs

#### `POST /api/webhooks/razorpay`
* **Purpose**: Background capture verification for payments.
* **Authentication**: Razorpay Webhook Secret Header validation.
* **Request**: Razorpay event JSON payload.
* **Response**: `{ "status": "ok" }`
* **Database Tables**: `orders`, `payments`, `inventory_items`
* **Description**: Processes order updates asynchronously if client modal fails to close cleanly. Handles order status and captures payments.

#### `GET /api/cron/abandoned-cart-emails`
* **Purpose**: Periodically fires recovery emails to cart dropouts.
* **Authentication**: Secret Cron Authorization header.
* **Request**: Cron trigger.
* **Response**: Status of emails sent.
* **Service**: `src/lib/services/resend.ts`, `src/lib/services/redis.ts`
* **Database Tables**: `cart_items`, `customers`

---

## ⚡ Next.js Server Actions Inventory

Server Actions are asynchronous code modules executing on the server, invoked directly from clients.

### 1. Storefront Client Actions

#### `submitReview(formData: FormData)`
* **Location**: `src/app/actions/reviews.ts`
* **Purpose**: Submits reviews from product detail page.
* **Payload**: FormData containing name, rating, comment, productId, and image URLs.
* **Database Actions**: Creates `product_reviews` record.
* **Revalidation**: Revalidates paths `/products` and `/`.
* **Risk Level**: **MEDIUM** (Requires validation inputs to prevent spam).

#### `addToWishlist(productId: string)`
* **Location**: `src/app/actions/wishlist.ts`
* **Purpose**: Links product to customer wishlist.
* **Payload**: `productId` UUID string.
* **Database Actions**: Finds or creates `wishlists` record mapping user UUID to product UUID.
* **Risk Level**: **LOW**.

---

### 2. Admin Management Actions

#### `createProduct(data: ProductCreateInput)`
* **Location**: `src/lib/actions/products/create-product.ts`
* **Purpose**: Admin product wizard submit handler.
* **Payload**: Structured product details, metadata, images list, options layout, and variant configurations.
* **Database Actions**: Performs transaction: creates `products`, inserts options, creates `product_variants` and registers `inventory_items`.
* **Revalidation**: Revalidates `/admin/products` and `/products`.
* **Risk Level**: **HIGH** (Nested creation structure must avoid circular validation failures).

#### `getDashboardAnalytics()`
* **Location**: `src/lib/actions/analytics.ts`
* **Purpose**: Aggregates all KPI analytics metrics.
* **Payload**: None.
* **Database Actions**: Aggregates sales, orders, low stock items, and audit activities.
* **Caching**: Wrapped in `getCached('dashboard:stats')` with 5-minute TTL.
* **Used By**: Admin Dashboard component.
* **Risk Level**: **LOW**.
