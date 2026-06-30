# Dude Men's Wears (DMW) - Core Architecture Documentation

Welcome to the **DMW Complete Codebase Architecture Documentation**. This document serves as the **single source of truth** and architectural blueprint for the project. It provides a complete, high-fidelity mapping of the entire system, enabling any senior engineer or AI architect to understand, optimize, or rebuild the application without reading the raw source code.

---

## 🗺️ Documentation Map
To maintain the highest level of detail and prevent information loss, the documentation is divided into the following dedicated modules:

1. **[Folder & File Inventory](./01_folder_file_inventory.md)**: Explains the purpose, responsibilities, dependencies, and risk level of every directory and core source file.
2. **[Database Schema Blueprint](./02_database_schema.md)**: Comprehensive mapping of tables, relationships, indexes, foreign keys, enums, triggers, and Prisma models.
3. **[API and Server Actions Directory](./03_api_and_actions.md)**: Detailed reference of all REST API endpoints and Next.js Server Actions (payloads, schemas, consumers).
4. **[State, Auth, and Architectural Flows](./04_state_and_auth_flows.md)**: Details on authentication (Clerk), routing (App Router / Subdomains), state management (Zustand / TanStack Query), caching (Upstash Redis), and external integrations (Razorpay, Resend, Interakt).
5. **[Codebase Audits and Technical Debt Log](./05_audits_and_tech_debt.md)**: Full security audit, performance audit, UI/UX audit, circular dependencies report, dead code report, and a detailed list of identified technical debt items.

---

## 📊 System Overview & Metrics

Dude Men's Wears is a premium e-commerce platform built on Next.js 16 (App Router) with a multi-tenant layout (Storefront and Admin Dashboard) separated by subdomains. It follows a modular, domain-driven structure within a monolithic Next.js repository.

### 🌟 Core Architectural Scores
Below is the technical evaluation of the current codebase state (scaled out of 10):

| Dimension | Score | Rationale |
| :--- | :---: | :--- |
| **Scalability** | **8.5/10** | Modular `src/domains/` structure is highly scalable. Neon serverless DB scales storage and compute. Upstash Redis mitigates server load. |
| **Maintainability** | **7.5/10** | Caching layers are duplicated in two distinct locations (`server-cache.ts` and `redis.ts`). Kebab-case vs CamelCase hook names create developer friction. Barrel exports (`src/lib/actions/products.ts`) improve layout cleanlines. |
| **Code Quality** | **7.8/10** | Strong Zod validations on forms and envs. Virtual scrolling is applied to all heavy admin tables. Dead code exists (e.g. `NotificationContext`, `NotificationCenter`). |
| **Security** | **8.2/10** | Auth is securely delegated to Clerk. Strict Content Security Policy (CSP) is implemented in `next.config.js`. Middleware checks token state. Database features proper constraint checks. |
| **Performance** | **8.8/10** | Turbopack is active. Recharts and heavy components are dynamically loaded. Bundle chunk splitting is optimized in Webpack config. Client-side caching utilizes TanStack Query. |
| **Documentation** | **9.5/10** | Highly structured directories, domain interconnection guides, and checklists already present in `docs/` provide deep context. |

---

## 🛠️ Technology Stack

Below is the verified inventory of all technical dependencies of the DMW project:

```
+-------------------------------------------------------------------------------+
|                                  FRONTEND LAYER                               |
|   React 19.2.4   |   Next.js 16.1.6 (App Router)   |   Tailwind CSS v4 (Styling)  |
|   Framer Motion  |   Recharts (Analytics Charts)   |   lucide-react / Tabler Icons|
+----------------------+--------------------------------+-----------------------+
                       |                                |
                       v                                v
+----------------------+---------+              +-------+-----------------------+
|        STATE MANAGEMENT        |              |       CLIENT FORM VALIDATION  |
|  Zustand 5.0.9 (Client UI)     |              |  React Hook Form 7.71.2       |
|  TanStack Query 5.90 (Server)  |              |  Zod 4.3.6 (Schemas)          |
+----------------------+---------+              +-------+-----------------------+
                       |                                |
                       +---------------+----------------+
                                       |
                                       v
+--------------------------------------|----------------------------------------+
|                                BACKEND & MIDDLEWARE                           |
|      Clerk Auth (^6.39)              |   Prisma ORM (^7.4.2)                  |
|      (Authentication & RBAC)         |   (Database Client Client Engine)      |
+--------------------------------------+----------------------------------------+
                       |                                |
                       v                                v
+----------------------+---------+              +-------+-----------------------+
|          DATABASE              |              |      EXTERNAL SERVICE APIs    |
|  Neon Serverless (PostgreSQL)  |              |  Razorpay (^2.9.6) - Payments |
|  @prisma/adapter-neon          |              |  Resend (^6.6.0) - Trans. Mail|
|                                |              |  Interakt - WhatsApp API      |
|  Upstash Redis - Caching       |              |  Cloudinary (^2.9) - Images   |
+--------------------------------+--------------+-------------------------------+
```

### Dependency Details

#### 1. Next.js (v16.1.6)
* **Purpose**: Application routing engine, layouts, SEO configurations, API endpoints, Server Actions, Standalone output builds.
* **Used in**: Entire application.
* **Pros**: Subdomain routing using internal rewrites in `middleware.ts`, optimized Webpack chunk splitting, standalone deployment builds.
* **Cons**: Major version upgrades introduces breaking changes to routing behavior.

#### 2. React (v19.2.4)
* **Purpose**: UI rendering and component architecture.
* **Used in**: Storefront, Admin Dashboard, PDF generation.
* **Pros**: Concurrent rendering support, compiler improvements, cleaner hook lifecycle.
* **Cons**: Library ecosystem compatibility (some older packages require legacy peer deps).

#### 3. Tailwind CSS (v4)
* **Purpose**: Responsive, modern utility styling.
* **Used in**: Entire UI.
* **Pros**: Fast compiler, css-first configuration, theme variable generation.
* **Cons**: Clutters JSX styling with long class strings if not componentized.

#### 4. Prisma ORM (v7.4.2)
* **Purpose**: Database schema definition, migration management, type-safe query building.
* **Used in**: `src/lib/db.ts` and all Server Actions / API routes.
* **Pros**: Generated types reside directly in `src/generated/prisma`, Neon adapter support, schema-level check constraints.
* **Cons**: Prisma adapter mapping layer introduces small cold-start latency compared to native PG queries.

#### 5. Clerk Auth (v6.39.0)
* **Purpose**: Managed user authentication, login/registration UI, SSO callback routing, session JWT handling.
* **Used in**: `src/middleware.ts`, `src/contexts/AuthContext.tsx`, and admin layout auth gates.
* **Pros**: Offloads password security and OAuth flows completely. Highly secure.
* **Cons**: External latency on user info fetch.

#### 6. Upstash Redis (v1.35.8)
* **Purpose**: High-speed REST/TCP caching layer for products, collections, categories, and API rate limiting.
* **Used in**: `src/lib/services/redis.ts` and `src/lib/cache/server-cache.ts`.
* **Pros**: Fully serverless, low-latency, HTTP-based API calls prevent socket pooling exhaustion.
* **Cons**: Data synchronization drift risk.

#### 7. Razorpay (v2.9.6)
* **Purpose**: Merchant payment capture, order processing, refunds, webhook verification.
* **Used in**: `src/lib/services/razorpay.ts` and `/api/payments`.
* **Pros**: Standardized integration for Indian debit card, UPI, and net banking systems.
* **Cons**: No native sandbox simulation; requires test-mode transaction cycles.

#### 8. Resend (v6.6.0)
* **Purpose**: Transactional email notification delivery (secured order receipts, welcome newsletters, password recovery).
* **Used in**: `src/lib/services/resend.ts`.
* **Pros**: Clean HTML templates, low latency, robust analytics.
* **Cons**: Subject to outbound spam filter thresholds if IP is not dedicated.

#### 9. Interakt API
* **Purpose**: WhatsApp Business Notification delivery (order confirmation, shipping updates).
* **Used in**: `src/lib/services/interakt.ts`.
* **Pros**: Directly reaches users on active messaging apps (Tamil Nadu / Indian market optimized).
* **Cons**: Requires pre-approved WhatsApp templates from Meta.

---

## 🏛️ High-Level Architecture Diagram

Below is the visual map of how frontend requests flow down to the data persistence layer:

```
[ STOREFRONT / WISH / CHECKOUT ]        [ ADMIN DASHBOARD PANELS ]
               |                                     |
               v (Clerk Auth Gate)                   v (Role hierarchy gate: 1-4)
     [ Next.js middleware.ts ]               [ Next.js middleware.ts ]
     (Subdomain detection / rewrite)         (Subdomain internal rewrite)
               |                                     |
               v                                     v
   [ React 19 Client Components ]        [ React 19 Client Dashboard ]
   (Zustand UI state)                    (Zustand / TanStack Query client cache)
               |                                     |
      +--------+--------+                            |
      |                 |                            |
      v (Client side)   v (Server Action)            v (Server Action / API Call)
 [ React Query Hook ] [ Server Actions ]       [ TanStack Query Hook ]
      |                 (src/lib/actions/*)          |
      |                 (src/app/actions/*)          v
      |                         |              [ Server Actions ]
      v                         v              (getAllReviews, csvImport, etc.)
 [ API Endpoints ] ------------->                        |
 (Resends, calculating taxes)                            |
      |                                                  |
      +-------------------------+------------------------+
                                |
                                v
                   [ Service Orchestration Layer ]
                   (src/lib/services/* - Redis, Resend,
                    Razorpay, TaxCalculation, Shipping)
                                |
                                v
                     [ Database Client Layer ]
                     (Prisma Client / pg connection pool)
                                |
                                v
                    [ Data Persistence Layer ]
                   (Neon serverless / PostgreSQL)
```

---

## 🏛️ Architectural Principles

1. **Domain Isolation (`src/domains`)**: Feature-based organization holds all domain-specific components, hooks, utilities, and services. Admin dashboard components live alongside customer store domains.
2. **Double Caching**: Redis (Upstash) acts as the server-side cache for high-traffic read queries (catalog, homepage settings) while TanStack Query maintains client-side in-memory cache to eliminate redundant HTTP overhead.
3. **No Direct Database access in UI**: All views fetch data via Server Actions or API routes which delegate to services (`src/lib/services/`). Pages never query the database directly.
4. **Standalone Builds**: The application builds as a standalone package (`output: 'standalone'` in `next.config.js`) to allow deployment on modern server environments (Hostinger / Vercel).
