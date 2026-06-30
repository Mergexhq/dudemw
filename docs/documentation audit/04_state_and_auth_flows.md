# DMW Architecture Audit - State, Auth, and Architectural Flows

This document details the critical runtime flows of the Dude Men's Wears platform, covering Authentication, Subdomain Routing, State Management, and External Services Integration.

---

## 🔐 Authentication & Access Control Flow

Authentication is managed externally via Clerk Auth, while authorization (role-based access) is managed locally using the `admin_profiles` database table.

### Admin Authentication Flow Diagram
```
[ User visits admin.dudemw.com ]
              |
              v
     [ Next.js Middleware ]
              |
              +---> Check Session Cookie (Clerk JWT)
              |                 |
              |                 +---> [ NOT authenticated ] ---> Redirect to Clerk Login (/login)
              |                 |
              |                 +---> [ IS authenticated ]
              |                                 |
              v                                 v
     [ Route Rewritten ]             [ Admin Layout Mounted ]
     (Path -> /admin/*)                         |
                                                v
                                     [ Fetch Profile from DB ]
                                     (Clerk userId -> admin_profiles)
                                                |
              +---------------------------------+--------------------------------+
              |                                 |                                |
              v                                 v                                v
     [ No DB Profile ]                 [ Profile Inactive ]             [ Profile Active ]
              |                                 |                                |
              v                                 v                                v
   Show "Unauthorized"                 Redirect to /pending             Allow access to Panel
   (Block Dashboard)                   (Await Activation)               (Render Layout & Sidebar)
```

### RBAC Hierarchy Levels
We define a 4-tier Role-Based Access Control (RBAC) structure. Actions use `hasRolePermission` from `src/lib/admin-auth.ts`:

1. **`super_admin` (Level 4)**: Ultimate control. Can invite other admins, change settings, assign permissions, delete products, and override prices.
2. **`admin` (Level 3)**: Standard admin access. Can create/edit products, manage orders, approve reviews, and modify categories.
3. **`manager` (Level 2)**: Operations lead. Can manage orders and inventory but cannot modify store system settings or delete records.
4. **`staff` (Level 1)**: View and basic edit rights. Can check stock and print shipping labels, but cannot edit pricing or issue refunds.

---

## 🌐 Subdomain Routing & Middleware

DMW implements subdomain routing to isolate the Admin Dashboard (`admin.dudemw.com`) from the Storefront (`dudemw.com`).

### Internal Rewriting Matrix
Next.js `middleware.ts` runs on the edge and routes incoming requests:

```
Incoming Request                        host Header           Resolved Internal Path
--------------------------------------------------------------------------------------
https://dudemw.com/                     dudemw.com            /src/app/page.tsx
https://dudemw.com/products             dudemw.com            /src/app/(store)/products
https://admin.dudemw.com/               admin.dudemw.com      /src/app/admin/page.tsx
https://admin.dudemw.com/orders         admin.dudemw.com      /src/app/admin/orders
https://admin.dudemw.com/admin/orders   admin.dudemw.com      Redirects to /orders (strips prefix)
```

1. **Path Sanitation**: If a request comes in on the admin subdomain containing `/admin` in the path, the middleware issues a `301 Redirect` to strip the prefix (e.g. `admin.dudemw.com/admin/orders` -> `admin.dudemw.com/orders`).
2. **Internal Rewrite**: For all non-API requests on the admin subdomain, the middleware rewrites the request path internally to map to the `/admin` folder group in `src/app/admin/`.
3. **Header Propagation**: The middleware sets the header `x-pathname` to the rewritten path so Server Components can read it using the `headers()` helper.

---

## 📦 State Management & Caching

The application manages data states across three layers: Client UI state, client-side server cache, and server-side Redis cache.

```
+--------------------------------------------------------------------------------+
|                                CLIENT BROWSER                                  |
|                                                                                |
|    +-----------------------------+        +-------------------------------+    |
|    |      Zustand Store          |        |     TanStack Query Cache      |    |
|    |  (Sidebar state, UI themes) |        |  (Orders, Products, Reviews)  |    |
|    +-----------------------------+        +---------------+---------------+    |
+-----------------------------------------------------------|--------------------+
                                                            |
                                                            | Cache Miss (API/Action)
                                                            v
+--------------------------------------------------------------------------------+
|                               NEXT.JS SERVER                                   |
|                                                                                |
|                           [ Server Actions / APIs ]                            |
|                                       |                                        |
|                          Cache Hit    v    Cache Miss                          |
|                     +-----------------+-----------------+                      |
|                     |                                   |                      |
|                     v                                   v                      |
|           +-------------------+               +--------------------+           |
|           |   Upstash Redis   |               |     Neon DB via    |           |
|           | (JSON cached lists|               |     Prisma Client  |           |
|           |   with dynamic TTL|               +--------------------+           |
|           +-------------------+                                                |
+--------------------------------------------------------------------------------+
```

### 1. Client State (Zustand)
Used primarily in the admin dashboard and storefront for UI transitions, filters, sidebar configurations, and active selections. Zustand state does not persist across page reloads.

### 2. Hydrated State (Cart Context)
The shopping cart (`src/domains/cart/context.tsx`) uses a React context provider combined with `localStorage` persistence. On startup, cart items are hydrated into memory. On user login, the `useGuestMerge` hook reads `guest_session_id` and invokes the server action `mergeGuestData`, which reassigns cart rows and guest orders to the registered user ID.

### 3. Server State Caching (TanStack Query)
TanStack Query manages catalog and inventory table states client-side. The dashboard, products table, and orders list fetch data via custom query hooks with specific configuration settings:
* **Stale Time**: 2-5 minutes (prevents redundant fetches on panel tab switching).
* **Mutations**: Invalidate corresponding cache keys (e.g. updating stock invalidates `inventory` keys, triggering background updates).

### 4. Server-Side Caching (Upstash Redis)
The application utilizes Upstash Redis to cache heavy storefront query results:
* **Product Detail**: Cached for 5 minutes (`product:[slug]`).
* **Collections & Categories**: Cached for 10-15 minutes.
* **Invalidation**: Write actions (like updating a product) trigger path revalidations and clear corresponding Redis keys via `invalidateProductCache` or `invalidateCache`.

---

## 🔌 External Integrations Flow

DMW integrates with five key external service providers:

```
                                +-------------------+
                                |    Cloudinary     |
                                | (Image hosting)   |
                                +---------^---------+
                                          |
                                          | Uploads
+-------------------+           +---------+---------+           +-------------------+
|     Razorpay      |           |                   |           |      Resend       |
| (Payment Gateway) <----------->   DMW Backend     <-----------> (Transactional    |
|                   | Pay event |                   | Mail runs |  Email Campaigns) |
+---------^---------+           +---------+---------+           +-------------------+
          |                               |
          | Webhook Callback              | WhatsApp triggers
          v                               v
+---------+---------+           +---------+---------+
|  Razorpay Webhook |           |     Interakt      |
|  (Captures success|           |  (WhatsApp API)   |
|   async orders)   |           +-------------------+
+-------------------+
```

### 1. Razorpay Payment Flow
* **Initiation**: During checkout, the client calls `/api/payments/create-order` to generate a Razorpay order ID.
* **Checkout Modal**: The Razorpay SDK loads (`checkout.js`) and opens the overlay payment form.
* **Verification**: Upon completion, signature payloads (`razorpay_signature`, `razorpay_payment_id`) are posted to `/api/payments/verify` and verified via SHA256 HMAC signature hashing.
* **Webhook Fallback**: A Razorpay webhook listens to `payment.captured` and updating order/payment tables in case the client modal fails to close cleanly.

### 2. Resend Email Flow
* **Verification**: Initialized with `RESEND_API_KEY`.
* **Triggers**: Fired asynchronously during order placements, registration signups, and password recoveries. Uses pre-configured HTML templates.

### 3. Interakt WhatsApp Flow
* **Notification API**: When orders transition to `processing` or `shipped`, `interakt.ts` triggers REST notifications containing customer numbers and Meta template identifiers (`order_confirmation_dudemw` / `order_shipped_utility`).
* **Phone Sanitization**: Automatically strips leading country codes and spaces from phone strings before sending.
