# Project Details: DudeMensWear (dudemw)

## Overview
**dudemw** is a comprehensive e-commerce web application built with Next.js 16, utilizing the App Router architecture. It leverages modern web technologies to provide a fast, responsive, and user-friendly shopping experience.

## Tech Stack

### Core Frameworks
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Library:** [React 19](https://react.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Bundler:** Turbopack (via `next dev --turbopack`)

### Styling & UI
- **Styling Engine:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Component Primitives:** [Radix UI](https://www.radix-ui.com/) (Extensive use of primitives like Dialog, Dropdown, Tabs, etc.)
- **Icons:** Lucide React, Tabler Icons, Untitled UI Icons
- **Animations:** Framer Motion (`motion`)
- **Charts:** Recharts

### State Management & Data Fetching
- **Server State:** [TanStack Query v5](https://tanstack.com/query/latest) (React Query)
- **Client State:** [Zustand](https://zustand-demo.pmnd.rs/)

### Backend & Database
- **BaaS:** [Supabase](https://supabase.com/) (`@supabase/supabase-js`, `@supabase/ssr`)
- **Database:** PostgreSQL (via Supabase)
- **Caching:** Redis (Upstash)

### Forms & Validation
- **Form Management:** [React Hook Form](https://react-hook-form.com/)
- **Schema Validation:** [Zod](https://zod.dev/)
- **Resolvers:** `@hookform/resolvers`

### Utilities & Other
- **Date Handling:** `date-fns`, `@internationalized/date`
- **PDF Generation:** `@react-pdf/renderer`, `pdf-lib`
- **Email:** Resend
- **Drag & Drop:** `@dnd-kit`, `@hello-pangea/dnd`
- **Payment:** Razorpay
- **CSV Parsing:** Papaparse

## Project Structure (`src/`)

- **`app/`**: Contains the App Router routes, layouts, and page components.
- **`components/`**: Reusable UI components (likely including Shadcn/ui components).
- **`contexts/`**: React Context providers for global state/logic.
- **`domains/`**: Domain-specific logic or feature modules.
- **`hooks/`**: Custom React hooks.
- **`lib/`**: Utility functions, configuration, and shared library code.
- **`pdf/`**: Templates or logic for PDF generation.
- **`types/`**: TypeScript type definitions.

## Key Configuration

- **`next.config.js`**: Next.js configuration.
- **`tailwind.config.ts`**: Tailwind CSS configuration.
- **`package.json`**: Project dependencies and scripts.

## Scripts

- `dev`: Starts the development server with Turbopack (`next dev --turbopack`).
- `build`: Builds the application for production.
- `start`: Starts the production server.
- `lint`: Runs ESLint.
- `build:analyze`: Builds the app and runs the bundle analyzer.

---

## Development Phases

### Phase 1: Core E-Commerce Platform (Completed)
Built the foundational e-commerce application including:
- Full product catalog with categories (Cargo, T-Shirts, Track Pants)
- User authentication (Clerk) with Google OAuth
- Shopping cart, wishlist, and checkout flow
- Razorpay payment integration
- Admin panel for product/order/inventory management
- Responsive mobile-first design
- Real-time order tracking and notifications
- Product reviews & ratings system with reviewer profile pictures
- PDF invoice generation
- Email notifications via Resend
- Redis caching (Upstash) for performance
- Banner carousel and promotional campaign system

---

### Phase 2: UI/UX Overhaul, SEO Copywriting & Visual Upgrade (Completed — February 2026)

A comprehensive revamp focused on elevating the overall website experience, optimizing content for conversions, and upgrading product visuals to professional standards.

#### 🎨 UI/UX Improvements
- **Complete website design overhaul** — refreshed layouts, typography, spacing, and visual hierarchy across all pages
- **Enhanced banner carousel** — updated `BannerCarouselClient.tsx` with improved hero banners and promotional visuals
- **Improved product presentation** — better product card layouts with clearer pricing, discount badges, and trust signals
- **Micro-interactions & animations** — added Framer Motion transitions for a premium, polished feel
- **Mobile experience refinements** — optimized responsive layouts for smoother mobile browsing and checkout

#### ✍️ SEO-Based Copywriting
- **Product renaming** — replaced inconsistent, all-caps names (e.g., `BLACK COLOUR 5 SLEEVE TSHIRT`) with SEO-friendly, readable titles (e.g., `Black Half-Sleeve Cotton T-Shirt`)
- **Category descriptions** — rewrote all category copy with benefit-driven, conversion-optimized language tailored for the Tamil Nadu / Indian market
- **Collection descriptions** — enhanced Best Sellers, New Drops, and other collection copy with social proof and urgency hooks
- **SEO meta tags** — added optimized meta descriptions and product slugs for better search engine visibility
- **Store description** — updated brand story and About Us narrative highlighting Salem roots and local trust
- **Campaign copy** — created strategic campaign messaging (welcome offers, cart recovery, festive sales, referral programs)

#### 🖼️ AI-Generated Product Visuals
- **Replaced all old unprofessional product images** with AI-generated, professional-setting visuals
- **Consistent visual style** — all product imagery now follows a cohesive, premium aesthetic with proper lighting, backgrounds, and model settings
- **Lifestyle-oriented photography** — images positioned for aspirational appeal, matching the "Crafted for the Modern Man" brand identity

#### 📊 Database & Content Updates
- **Bulk product renaming** in Supabase — updated product names, descriptions, and tags across the full catalog
- **Category description updates** — pushed optimized descriptions to the database for Cargo, T-Shirts, and Track Pants categories
- **New coupon codes** — inserted strategic discount codes (`FIRST15`, `DUDE100`, `BACK50`, `PONGAL20`, `FRIEND100`, `VIP200`)
- **Campaign calendar** — established a monthly promotional calendar aligned with Tamil Nadu festivals and seasonal events

---

## Deployment

- **Frontend Hosting:** [Vercel](https://vercel.com/)
- **Backend / Database:** [Supabase](https://supabase.com/) (PostgreSQL)
- **Caching:** [Upstash](https://upstash.com/) (Redis)
- **Email Service:** [Resend](https://resend.com/)
- **Payments:** [Razorpay](https://razorpay.com/)
- **Live URL:** [dudemw.com](https://dudemw.com/)
