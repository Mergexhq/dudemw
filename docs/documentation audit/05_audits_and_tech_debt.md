# DMW Architecture Audit - Codebase Audits & Technical Debt

This document presents the detailed findings of the technical audit, cataloging security, performance, UI/UX, and code quality assessments, alongside a complete report of dead code and technical debt items.

---

## 🔒 Security Audit

### 1. Authentication & Authorization Gateways
* Clerk Auth manages storefront and admin login sessions securely, preventing password leaks and authentication bypasses.
* Admin panel routes are guarded by Clerk middleware and layout checks. Admin actions use backend helper checks in `src/lib/admin-auth.ts` to verify user roles in the database.
* **Potential Issue**: Some storefront endpoints do not verify user identity. For example, `submitReview` creates database records using client-supplied reviewer names without checking if the user actually purchased the product or is logged in.

### 2. SQL Injection & Database Safety
* Prisma ORM is utilized for all database calls, which automatically parameterizes SQL queries and prevents SQL injection attacks.
* Raw SQL queries are not used in Server Actions.

### 3. Cross-Site Scripting (XSS) & CSRF Protection
* Next.js automatically escapes values rendered in JSX, protecting against XSS.
* Server Actions have built-in CSRF tokens managed by Next.js.
* **Content Security Policy (CSP)**: Configured in `next.config.js` to restrict scripts to trusted domains (Clerk, Google Tag Manager, Meta Pixel).

### 4. Secrets Management
* Environmental secrets (Neon credentials, Clerk API keys, Upstash Redis endpoints) are kept on the server.
* `src/lib/env.ts` runs a Zod validation on app launch, throwing clear startup errors if any required key is missing, preventing silent runtime failures.

---

## ⚡ Performance Audit

### 1. Bundle Size & Hydration Optimization
* Fonts are optimized in `src/app/layout.tsx` by loading only two Satoshi weights (saving ~100KB of preload weight).
* Recharts and heavy components are imported regularly in the admin panel to resolve Turbopack HMR compilation issues, which can increase the initial bundle size for admin views.

### 2. Rendering & Image Delivery
* Product images are served via Cloudinary.
* Image components use Next.js `Image` wrapper, but some list layouts lack responsive sizing attributes (`sizes="..."`), causing the browser to download larger files than needed.

### 3. Caching Redundancies
* Caching layers are split between `redis.ts` and `server-cache.ts`. Both create separate connections to Upstash Redis, which can cause connection pooling issues.

---

## 🎨 UI/UX Audit

* **Design Tokens**: Standardized in Tailwind CSS config, providing a consistent layout across pages.
* **Responsiveness**: Storefront templates use mobile-first Flexbox and Grid layouts. Checkout elements are optimized for small touch displays.
* **Interactive Elements**: Navigation elements and action buttons feature hover animations and active states.
* **Accessibility**: Forms utilize labels and standard inputs, but some modal overlays lack ARIA attributes (`aria-describedby` / `role="dialog"`).

---

## ⚙️ Code Quality Audit

### 1. File Structure & Naming Conformance
* Custom React hooks feature inconsistent naming styles:
  * `src/hooks/use-admin-filters.ts` (kebab-case)
  * `src/hooks/useAdminFilters.ts` (camelCase)
* Server Actions are split across two directories (`src/app/actions` and `src/lib/actions`).

### 2. Code Duplication
* Upstash Redis connections are defined twice.
* Table query filters are implemented in both `use-admin-filters.ts` and `useAdminFilters.ts`.

---

## 📊 Risk Assessment Matrix

Below is the classification of codebase modules based on their failure impact:

| Module | Risk Level | Failure Impact | Mitigation Strategy |
| :--- | :---: | :--- | :--- |
| **`src/middleware.ts`** | **CRITICAL** | Failure locks admins out or exposes admin routes to the public internet. | Keep routing logic simple. Use automated unit tests to verify access control rules. |
| **`src/lib/db.ts`** | **CRITICAL** | Database pool issues freeze all server actions and API routes. | Set appropriate timeouts for connection pools and run health checks. |
| **`CheckoutFormV2.tsx`** | **HIGH** | Breaks in this component halt order placements and payment collection. | Implement error boundaries, log exceptions, and run end-to-end checkout tests. |
| **`guest-merge.ts`** | **HIGH** | Failed merges lose customer cart details during signup, hurting conversion. | Log cart merge actions. Add fallback logic to prevent blocking the user. |
| **`src/lib/admin-auth.ts`** | **HIGH** | Logic errors could allow low-privilege users to access super-admin settings. | Validate active sessions and enforce role checks on the server. |
| **`redis.ts` / `server-cache.ts`**| **MEDIUM** | Connection leaks can exhaust Upstash limits, slowing down page loads. | Consolidate Redis instances into a single client connection. |
| **`csv-import.service.ts`** | **MEDIUM** | Bad CSV parses can upload corrupted product details or crash database queries. | Validate rows with Zod before running transactions. |

---

## ☠️ Dead Code Report

The technical audit identified several unused code modules and files:

1. **`src/contexts/NotificationContext.tsx`**: Declares a client notification context that imports `NotificationService` (which calls server-side Prisma database methods). This file is never imported or registered, which prevents it from throwing build-time errors.
2. **`src/components/common/notification-center.tsx`**: Implements a notification center dropdown that consumes `useNotifications()`. This component is never rendered.
3. **`src/lib/services/notifications.ts`**: Contains stubs for real-time notification subscriptions. It is only imported by the unused context file.
4. **Stale Supabase References**: Multiple documentation files (e.g. `DOMAIN_INTERCONNECTIONS.md`) still reference Supabase, which has been replaced by Clerk and Neon Postgres.

---

## 🪵 Technical Debt Log

The following architectural, performance, and code quality issues should be resolved in future updates:

### 1. Architectural Duplications
* **Redis Clients**: Both `src/lib/services/redis.ts` and `src/lib/cache/server-cache.ts` instantiate separate Upstash Redis clients.
  * *Impact*: Increases connections and memory usage.
* **Filter Hooks**: Both `use-admin-filters.ts` and `useAdminFilters.ts` handle URL query parameters for admin tables.
  * *Impact*: Leads to inconsistencies in query syncing.

### 2. Code Drift
* **Wishlist Merging**: `src/lib/actions/guest-merge.ts` skips wishlist merging, noting that `guest_id` is missing from the database. However, `schema.prisma` contains the `guest_id` column on the `wishlists` table.
  * *Impact*: Wishlist items saved by guest sessions are lost upon user sign-up.

### 3. Directory Structure Split
* **Server Actions**: Located in both `src/app/actions` and `src/lib/actions`.
  * *Impact*: Confuses developers on where to place or find backend logic.
* **Admin Layout Routes**: Route structures are split between `src/app/(admin)/admin/...` and `src/app/admin/...`.
  * *Impact*: Increases the risk of route conflicts.
