# DMW Architecture Audit - Folder & File Inventory

This document provides a complete inventory of the Dude Men's Wears codebase layout, mapping every folder and critical file to its exact purpose, dependency list, and risk assessment.

---

## 📁 Complete Folder Tree

Below is the complete tree of the `src/` and `prisma/` directories in the project:

```
src/
├── app/
│   ├── (admin)/
│   │   └── admin/
│   │       └── products/
│   │           └── [id]/
│   │               └── variants/
│   │                   └── [variantId]/
│   │                       └── page.tsx
│   ├── (store)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── about/
│   │   ├── account/
│   │   ├── cart/
│   │   ├── categories/
│   │   ├── checkout/
│   │   ├── contact/
│   │   ├── faq/
│   │   ├── order/
│   │   ├── privacy/
│   │   ├── products/
│   │   ├── profile/
│   │   ├── refund-policy/
│   │   ├── returns/
│   │   ├── shipping/
│   │   ├── shipping-policy/
│   │   ├── size-guide/
│   │   ├── stores/
│   │   ├── terms/
│   │   ├── track/
│   │   └── wishlist/
│   ├── actions/
│   │   ├── coupons.ts
│   │   ├── inventory.ts
│   │   ├── media.ts
│   │   ├── reviews.ts
│   │   └── wishlist.ts
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── (auth)/
│   │   ├── banners/
│   │   ├── campaigns/
│   │   ├── categories/
│   │   ├── collections/
│   │   ├── coupons/
│   │   ├── customers/
│   │   ├── inventory/
│   │   ├── invite/
│   │   ├── orders/
│   │   ├── products/
│   │   ├── reviews/
│   │   └── settings/
│   ├── api/
│   │   ├── addresses/
│   │   ├── admin/
│   │   ├── banners/
│   │   ├── campaigns/
│   │   ├── categories/
│   │   ├── cron/
│   │   ├── health/
│   │   ├── instagram/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── products/
│   │   ├── search/
│   │   ├── settings/
│   │   ├── shipping/
│   │   ├── tax/
│   │   ├── webhooks/
│   │   └── wishlist/
│   ├── auth/
│   │   ├── layout.tsx
│   │   └── ... (forgot-password, login, signup, verify-otp)
│   ├── globals.css
│   ├── layout.tsx
│   ├── not-found.tsx
│   ├── page.tsx
│   ├── robots.ts
│   ├── sitemap.ts
│   └── sso-callback/
│
├── components/
│   ├── WhatsAppButton.tsx
│   ├── admin/
│   │   ├── ActivityLogsViewer.tsx
│   │   ├── PermissionGuard.tsx
│   │   ├── ProductMultiSelector.tsx
│   │   └── filters/ (FilterBar, DateRangeFilter, FilterDrawer)
│   ├── application/
│   │   └── date-picker/
│   ├── auth/
│   │   └── AuthGuard.tsx
│   ├── base/
│   │   ├── avatar/
│   │   ├── badges/
│   │   ├── buttons/
│   │   ├── input/
│   │   ├── select/
│   │   ├── tags/
│   │   └── tooltip/
│   ├── cms/
│   ├── common/
│   │   ├── empty-states.tsx
│   │   ├── global-search.tsx
│   │   ├── header.tsx
│   │   ├── notification-center.tsx
│   │   └── sidebar.tsx
│   ├── core/
│   │   └── tab.tsx
│   ├── error/
│   │   ├── AdminErrorBoundary.tsx
│   │   └── GlobalErrorBoundary.tsx
│   ├── faq/
│   ├── policy/
│   ├── providers/
│   │   ├── guest-merge-provider.tsx
│   │   └── query-provider.tsx
│   ├── search/
│   └── ui/ (accordion, alert-dialog, button, table, tabs, etc.)
│
├── contexts/
│   ├── NotificationContext.tsx
│   └── OfferBarContext.tsx
│
├── domains/
│   ├── admin/
│   │   ├── banner-creation/
│   │   ├── campaigns/
│   │   ├── category-creation/
│   │   ├── collection-creation/
│   │   ├── coupons/
│   │   ├── customers/
│   │   ├── dashboard/
│   │   ├── inventory/
│   │   ├── orders/
│   │   ├── product-creation/
│   │   ├── product-detail/
│   │   ├── product-edit/
│   │   ├── products/
│   │   ├── reviews/
│   │   └── settings/
│   ├── auth/
│   ├── campaign/
│   ├── cart/
│   ├── categories/
│   ├── checkout/
│   ├── collections/
│   ├── homepage/
│   ├── order/
│   ├── plp/
│   ├── product/
│   ├── profile/
│   └── wishlist/
│
├── generated/
│   └── prisma/ (Generated client and model mappings)
│
├── hooks/
│   ├── use-admin-filters.ts
│   ├── useAdminFilters.ts
│   ├── useGuestMerge.ts
│   ├── useProductDraft.ts
│   ├── mutations/
│   └── queries/
│
├── lib/
│   ├── admin-auth.ts
│   ├── auth.ts
│   ├── db.ts
│   ├── env.ts
│   ├── error-logger.ts
│   ├── query-client.ts
│   ├── actions/
│   │   ├── about.ts
│   │   ├── addresses.ts
│   │   ├── admin-auth.ts
│   │   ├── products/ (create-product, delete-product, etc.)
│   │   └── ...
│   ├── cache/
│   │   └── server-cache.ts
│   ├── data/
│   ├── layout/
│   ├── monitoring/
│   ├── services/
│   │   ├── interakt.ts
│   │   ├── notifications.ts
│   │   ├── razorpay.ts
│   │   ├── redis.ts
│   │   └── resend.ts
│   └── utils/
│
└── pdf/
    ├── OrderDetailsPDF.tsx
    └── ShippingLabel.tsx

prisma/
├── migrations/
└── schema.prisma
```

---

## 📁 Folder Explanations

### 1. `src/app/(admin)` & `src/app/admin`
* **Purpose**: Next.js App Router folders that represent the admin dashboard views.
* **Responsibilities**: Orchestrate view layers for admin banners, campaigns, inventory, coupons, reviews, categories, and settings.
* **Dependencies**: `src/domains/admin`, `src/hooks/queries`, `src/hooks/mutations`, `src/lib/actions`.
* **Used By**: Admin panel subdomain requests.
* **Potential Issues**: Some overlapping route structures between `(admin)/admin` and `admin/`. For example, `src/app/(admin)/admin/products/[id]/variants` and `src/app/admin/products/[id]/variants` exist simultaneously, creating potential route collisions or code confusion.
* **Suggested Ownership**: Lead Admin Core Team.

### 2. `src/app/(store)`
* **Purpose**: User-facing storefront routes group.
* **Responsibilities**: Renders about, cart, catalog, checkout, FAQ, order confirmation, and user profiles.
* **Dependencies**: `src/domains/product`, `src/domains/cart`, `src/domains/checkout`, `src/domains/wishlist`, `src/domains/profile`.
* **Used By**: Storefront end users.
* **Potential Issues**: Highly reliant on client-side state hydration for carts and wishlists.
* **Suggested Ownership**: Storefront UX Team.

### 3. `src/app/actions` & `src/lib/actions`
* **Purpose**: Next.js Server Actions.
* **Responsibilities**: Executes database inserts, updates, and transactional functions directly from form submissions and hooks.
* **Dependencies**: `src/lib/db.ts`, `src/lib/services/*`.
* **Used By**: Storefront pages, client-side hooks, and admin panels.
* **Potential Issues**: Server Actions are split across two directories (`src/app/actions` and `src/lib/actions`). For example, review submission actions live in `src/app/actions/reviews.ts` while admin reviews management actions live in `src/lib/actions/reviews.ts`. This creates developer friction.
* **Suggested Ownership**: Backend API Team.

### 4. `src/components/ui` & `src/components/base`
* **Purpose**: UI primitives (shadcn UI/Radix) and base elements.
* **Responsibilities**: Button variants, tables, sheets, calendars, dropdowns, input elements.
* **Dependencies**: Radix UI, Class Variance Authority (CVA), Lucide React.
* **Used By**: Storefront, Admin Panel, and all layouts.
* **Potential Issues**: Contains duplicate button and input variants.
* **Suggested Ownership**: Design System / UI Team.

### 5. `src/domains`
* **Purpose**: Domain-driven logic structures.
* **Responsibilities**: Encapsulates specific features (cart context, checkout form logic, product grids).
* **Dependencies**: `src/lib/actions`, `src/lib/services`.
* **Used By**: Routing pages in `src/app`.
* **Potential Issues**: Highly coupled internal features (e.g. Cart and Product domains reference each other).
* **Suggested Ownership**: Feature Architects.

### 6. `src/hooks`
* **Purpose**: Custom React hooks.
* **Responsibilities**: Houses data queries, mutation triggers, filter handlers, and responsive breakpoints.
* **Dependencies**: `@tanstack/react-query`, Next.js Navigation hooks.
* **Used By**: Client components.
* **Potential Issues**: Hook naming inconsistencies (`use-admin-filters.ts` in kebab-case vs `useAdminFilters.ts` in camelCase). Both files implement similar URL-based query filtering.
* **Suggested Ownership**: Shared Platform Team.

---

## 📄 Key File Explanations

### 1. `src/middleware.ts`
* **Purpose**: Intercepts requests to handle subdomain routing and gate admin areas.
* **Exports**: Default middleware wrapper, `config` (route matcher).
* **Imports**: `@clerk/nextjs/server`, `next/server`.
* **Dependencies**: Clerk API, NextUrl pathname parser.
* **Used By**: Next.js core runtime.
* **Description**: Checks request hostnames. If on `admin.dudemw.com`, it rewrites `/` to `/admin` internally. Restricts access to `/admin` paths to signed-in users (redirecting to `/admin/login`). Passes the resolved pathname as `x-pathname` in headers to downstream Server Components.
* **Risk Level**: **CRITICAL** (Central entry point; failures break routing for the entire site).
* **Notes**: Avoid writing heavy database calls here. Keep it on the edge.

### 2. `src/lib/db.ts`
* **Purpose**: Instantiates the Prisma database client using connection pool.
* **Exports**: `prisma` (Default client instance).
* **Imports**: `@prisma/adapter-pg`, `pg`, `../generated/prisma/client`.
* **Dependencies**: `pg` Pool, `@prisma/adapter-pg` connector.
* **Used By**: Virtually all server actions and services.
* **Description**: Sets up connection pooling with Neon serverless database. Configures timeouts to prevent cold starts from crashing Nginx.
* **Risk Level**: **CRITICAL** (Database pool failures freeze the entire application).
* **Notes**: Configured with 8s connection timeout and 20s idle timeout to prevent Hostinger's Nginx gateway timeouts.

### 3. `src/lib/admin-auth.ts`
* **Purpose**: Core authorization checks, roles, and setup flags for admin users.
* **Exports**: `getAdminProfile`, `isActiveAdmin`, `isSuperAdmin`, `getCurrentAdmin`, `hasRolePermission`, `verifySetupKey`.
* **Imports**: `@clerk/nextjs/server`, `@/lib/db`.
* **Dependencies**: Prisma DB client, Clerk Auth payload.
* **Used By**: Admin routes, server actions, and layout gates.
* **Description**: Implements a four-tier role hierarchy: `super_admin` (4), `admin` (3), `manager` (2), `staff` (1). Maps Clerk's `userId` to the database `admin_profiles` table.
* **Risk Level**: **HIGH** (Flaws could allow unauthorized users to gain write access to inventory and settings).

### 4. `src/lib/services/redis.ts` & `src/lib/cache/server-cache.ts`
* **Purpose**: Upstash Redis caching utilities.
* **Exports**: `CacheService`, `getCached`, `invalidateCache`.
* **Imports**: `@upstash/redis`.
* **Dependencies**: Upstash REST credentials.
* **Used By**: Server Actions, storefront components, homepage filters.
* **Description**: Duplicated client instantiations connecting to the same Upstash Redis instance. `CacheService` handles catalog and campaigns caching. `server-cache.ts` handles analytics and general settings caching.
* **Risk Level**: **MEDIUM** (Duplication risk; double connections could exceed Upstash server limits).
* **Notes**: Needs unification to prevent resource leaks.

### 5. `src/domains/checkout/components/CheckoutFormV2.tsx`
* **Purpose**: Orchestrates single-step checkout UI, address selector, tax calculation, and payment gateway launcher.
* **Exports**: Default `CheckoutFormV2` component.
* **Imports**: `react`, `react-hook-form`, `sonner`, `@/domains/cart`, `@/lib/actions/orders`.
* **Dependencies**: Razorpay script loader, pincode shipping rate checker, tax calculation endpoint.
* **Used By**: `src/domains/checkout/components/CheckoutPage.tsx`.
* **Description**: Coordinates user inputs, validates them using React Hook Form, calculates local taxes (CGST/SGST/IGST), handles coupon codes, and displays the Razorpay checkout overlay.
* **Risk Level**: **HIGH** (The most complex client component. Breaks in this file halt sales).
* **Notes**: Contains fallbacks for Clerk auth timeouts to ensure transactions are never blocked by external auth failures.
