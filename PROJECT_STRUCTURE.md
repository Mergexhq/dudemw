# Dude Men's Wears - Project Structure

## 📋 Project Overview

**Dude Men's Wears** is a modern e-commerce platform built with Next.js 16, featuring a comprehensive admin dashboard and customer-facing store. The project follows a domain-driven architecture with clean separation of concerns.

### 🛠️ Tech Stack

- **Framework**: Next.js 16.0.10 with App Router
- **Frontend**: React 19.2.1, TypeScript 5
- **UI Library**: shadcn/ui + Radix UI components
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payment**: Razorpay integration
- **State Management**: React Context + Hooks
- **Icons**: Lucide React, Tabler Icons
- **Caching**: Upstash Redis
- **Email**: Resend
- **Drag & Drop**: @dnd-kit
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation

## 📁 Root Directory Structure

```
dude-mens-wears/
├── 📄 .env.local                    # Environment variables
├── 📁 .git/                        # Git repository
├── 📄 .gitignore                    # Git ignore rules
├── 📁 .next/                       # Next.js build output
├── 📁 .vscode/                     # VS Code settings
├── 📄 components.json               # shadcn/ui configuration
├── 📁 docs/                        # Project documentation
├── 📄 eslint.config.mjs            # ESLint configuration
├── 📄 middleware.ts                 # Next.js middleware
├── 📄 next-env.d.ts                # Next.js TypeScript declarations
├── 📄 next.config.ts               # Next.js configuration
├── 📁 node_modules/                # Dependencies
├── 📄 package-lock.json            # Dependency lock file
├── 📄 package.json                 # Project dependencies & scripts
├── 📄 postcss.config.mjs           # PostCSS configuration
├── 📁 public/                      # Static assets
├── 📄 README.md                    # Project README
├── 📁 src/                         # Source code
├── 📄 tailwind.config.ts           # Tailwind CSS configuration
├── 📄 tsconfig.json                # TypeScript configuration
└── 📄 tsconfig.tsbuildinfo         # TypeScript build info
```

## 📁 Source Code Structure (`src/`)

### 🎯 App Router (`src/app/`)

The application uses Next.js App Router with route groups for organization:

```
src/app/
├── 📄 globals.css                  # Global styles
├── 📄 layout.tsx                   # Root layout
├── 📄 not-found.tsx               # 404 page
├── 📄 page.tsx                    # Homepage
├── 📄 sitemap.ts                  # SEO sitemap
├── 📁 (auth)/                     # Authentication routes
│   ├── 📄 layout.tsx              # Auth layout
│   ├── 📁 callback/               # OAuth callback
│   ├── 📁 forgot-password/        # Password reset
│   ├── 📁 login/                  # Login page
│   ├── 📁 reset-password/         # Password reset form
│   ├── 📁 signup/                 # Registration page
│   └── 📁 verify-otp/             # OTP verification
├── 📁 (store)/                    # Customer-facing store
│   ├── 📄 layout.tsx              # Store layout
│   ├── 📄 page.tsx                # Store homepage
│   ├── 📁 about/                  # About page
│   ├── 📁 account/                # User account
│   ├── 📁 cart/                   # Shopping cart
│   ├── 📁 categories/             # Product categories
│   ├── 📁 checkout/               # Checkout process
│   ├── 📁 collections/            # Product collections
│   ├── 📁 contact/                # Contact page
│   ├── 📁 faq/                    # FAQ page
│   ├── 📁 order/                  # Order confirmation
│   ├── 📁 privacy/                # Privacy policy
│   ├── 📁 products/               # Product pages
│   ├── 📁 profile/                # User profile
│   ├── 📁 returns/                # Returns policy
│   ├── 📁 shipping/               # Shipping info
│   ├── 📁 size-guide/             # Size guide
│   ├── 📁 terms/                  # Terms of service
│   ├── 📁 track-order/            # Order tracking
│   └── 📁 wishlist/               # User wishlist
├── 📁 admin/                      # Admin dashboard
│   ├── 📄 layout.tsx              # Admin layout
│   ├── 📄 page.tsx                # Admin dashboard
│   ├── 📁 banners/                # Banner management
│   ├── 📁 categories/             # Category management
│   ├── 📁 collections/            # Collection management
│   ├── 📁 coupons/                # Coupon management
│   ├── 📁 customers/              # Customer management
│   ├── 📁 inventory/              # Inventory management
│   ├── 📁 orders/                 # Order management
│   ├── 📁 products/               # Product management
│   └── 📁 settings/               # Admin settings
│       ├── 📄 layout.tsx          # Settings layout
│       ├── 📄 page.tsx            # Settings overview
│       ├── 📁 locations/          # Store locations
│       ├── 📁 payments/           # Payment settings
│       ├── 📁 shipping/           # Shipping settings
│       ├── 📁 store/              # Store settings
│       ├── 📁 system/             # System settings
│       ├── 📁 tax/                # Tax settings
│       └── 📁 users/              # User management
└── 📁 api/                        # API routes
    └── 📁 webhook/                # Webhook handlers
        └── 📁 razorpay/           # Razorpay webhooks
```

### 🧩 Components (`src/components/`)

Reusable UI components organized by purpose:

```
src/components/
├── 📁 auth/                       # Authentication components
│   └── 📄 AuthGuard.tsx           # Route protection
├── 📁 common/                     # Shared components
│   ├── 📄 empty-states.tsx        # Empty state displays
│   ├── 📄 global-search.tsx       # Global search functionality
│   ├── 📄 header.tsx              # Site header
│   └── 📄 sidebar.tsx             # Navigation sidebar
├── 📁 core/                       # Core UI components
│   └── 📄 tab.tsx                 # Tab component
└── 📁 ui/                         # shadcn/ui components
    ├── 📄 alert-dialog.tsx        # Alert dialogs
    ├── 📄 avatar.tsx              # User avatars
    ├── 📄 badge.tsx               # Status badges
    ├── 📄 button.tsx              # Button variants
    ├── 📄 card.tsx                # Card layouts
    ├── 📄 checkbox.tsx            # Checkboxes
    ├── 📄 color-picker.tsx        # Color selection
    ├── 📄 command.tsx             # Command palette
    ├── 📄 dialog.tsx              # Modal dialogs
    ├── 📄 dropdown-menu.tsx       # Dropdown menus
    ├── 📄 empty.tsx               # Empty states
    ├── 📄 form.tsx                # Form components
    ├── 📄 input.tsx               # Input fields
    ├── 📄 kbd.tsx                 # Keyboard shortcuts
    ├── 📄 label.tsx               # Form labels
    ├── 📄 navigation-menu.tsx     # Navigation menus
    ├── 📄 popover.tsx             # Popover components
    ├── 📄 progress.tsx            # Progress bars
    ├── 📄 radio-group.tsx         # Radio buttons
    ├── 📄 scroll-area.tsx         # Scrollable areas
    ├── 📄 select.tsx              # Select dropdowns
    ├── 📄 separator.tsx           # Visual separators
    ├── 📄 sheet.tsx               # Side sheets
    ├── 📄 sidebar.tsx             # Sidebar component
    ├── 📄 skeleton.tsx            # Loading skeletons
    ├── 📄 sonner.tsx              # Toast notifications
    ├── 📄 switch.tsx              # Toggle switches
    ├── 📄 table.tsx               # Data tables
    ├── 📄 tabs.tsx                # Tab navigation
    ├── 📄 textarea.tsx            # Text areas
    └── 📄 tooltip.tsx             # Tooltips
```

### 🏗️ Domain Architecture (`src/domains/`)

Domain-driven design with feature-based organization:

```
src/domains/
├── 📁 admin/                      # Admin-specific features
│   ├── 📁 banner-creation/        # Banner creation workflow
│   ├── 📁 dashboard/              # Admin dashboard components
│   ├── 📁 inventory/              # Inventory management
│   ├── 📁 orders/                 # Order management
│   ├── 📁 product-creation/       # Product creation workflow
│   ├── 📁 product-detail/         # Product detail views
│   ├── 📁 product-edit/           # Product editing
│   ├── 📁 products/               # Product management
│   ├── 📁 settings/               # Admin settings
│   └── 📁 variants/               # Product variants
├── 📁 auth/                       # Authentication domain
│   ├── 📁 components/             # Auth UI components
│   ├── 📁 hooks/                  # Auth hooks
│   ├── 📄 context.tsx             # Auth context
│   ├── 📄 index.ts                # Domain exports
│   └── 📄 types.ts                # Auth types
├── 📁 banner/                     # Banner management
├── 📁 campaign/                   # Marketing campaigns
├── 📁 cart/                       # Shopping cart
│   ├── 📁 components/             # Cart UI components
│   ├── 📁 hooks/                  # Cart hooks
│   ├── 📄 context.tsx             # Cart context
│   ├── 📄 index.ts                # Domain exports
│   └── 📄 types.ts                # Cart types
├── 📁 categories/                 # Product categories
├── 📁 checkout/                   # Checkout process
├── 📁 collections/                # Product collections
├── 📁 homepage/                   # Homepage features
│   ├── 📁 components/             # Homepage components
│   ├── 📁 sections/               # Homepage sections
│   └── 📄 index.ts                # Domain exports
├── 📁 inventory/                  # Inventory management
├── 📁 order/                      # Order management
├── 📁 product/                    # Product domain
│   ├── 📁 components/             # Product components
│   │   ├── 📁 banners/            # Product banners
│   │   ├── 📁 cards/              # Product cards
│   │   ├── 📁 detail/             # Product details
│   │   ├── 📁 listing/            # Product listings
│   │   └── 📁 pages/              # Product pages
│   ├── 📁 hooks/                  # Product hooks
│   ├── 📁 sections/               # Product sections
│   ├── 📁 services/               # Product services
│   ├── 📁 types/                  # Product types
│   ├── 📁 utils/                  # Product utilities
│   ├── 📄 index.ts                # Domain exports
│   └── 📄 types.ts                # Product types
├── 📁 profile/                    # User profile
│   ├── 📁 components/             # Profile components
│   ├── 📁 hooks/                  # Profile hooks
│   ├── 📁 sections/               # Profile sections
│   ├── 📄 index.ts                # Domain exports
│   └── 📄 types.ts                # Profile types
└── 📁 wishlist/                   # User wishlist
    ├── 📁 components/             # Wishlist components
    ├── 📁 hooks/                  # Wishlist hooks
    ├── 📄 index.ts                # Domain exports
    └── 📄 types.ts                # Wishlist types
```

### 🔧 Utilities & Libraries (`src/lib/`)

Core utilities and service integrations:

```
src/lib/
├── 📁 actions/                    # Server actions
│   └── 📄 products.ts             # Product actions
├── 📁 layout/                     # Layout utilities
│   ├── 📁 feedback/               # User feedback
│   ├── 📁 hooks/                  # Layout hooks
│   ├── 📁 layout/                 # Layout components
│   └── 📁 media/                  # Media handling
├── 📁 services/                   # External services
│   ├── 📄 index.ts                # Service exports
│   ├── 📄 razorpay.ts             # Payment integration
│   ├── 📄 redis.ts                # Redis caching
│   ├── 📄 resend.ts               # Email service
│   └── 📄 tax-service.ts          # Tax calculations
├── 📁 supabase/                   # Database integration
│   ├── 📄 client.ts               # Client-side Supabase
│   ├── 📄 server.ts               # Server-side Supabase
│   └── 📄 supabase.ts             # Supabase configuration
├── 📁 utils/                      # Utility functions
│   └── 📄 seo.ts                  # SEO utilities
├── 📄 auth.ts                     # Authentication utilities
├── 📄 constants.ts                # App constants
├── 📄 env.ts                      # Environment validation
├── 📄 guest.ts                    # Guest user handling
├── 📄 utils.ts                    # General utilities
└── 📄 validators.ts               # Form validation schemas
```

### 🎣 Custom Hooks (`src/hooks/`)

```
src/hooks/
└── 📄 use-mobile.ts               # Mobile detection hook
```

### 🔧 Server Code (`src/server/`)

```
src/server/
├── 📁 banners/                    # Banner server logic
└── 📁 supabase/                   # Supabase server utilities
```

### 📝 TypeScript Types (`src/types/`)

```
src/types/
├── 📄 banner.ts                   # Banner type definitions
├── 📄 collections.ts              # Collection type definitions
├── 📄 database.types.ts           # Generated Supabase types
└── 📄 tax.types.ts                # Tax-related types
```

## 📁 Public Assets (`public/`)

```
public/
├── 📁 fonts/                      # Custom fonts (Satoshi)
│   ├── 📄 Satoshi-Black.woff2
│   ├── 📄 Satoshi-Bold.woff2
│   ├── 📄 Satoshi-Medium.woff2
│   └── 📄 Satoshi-Regular.woff2
├── 📁 illustration/               # Illustrations
│   └── 📄 track_order.png
├── 📁 logo/                       # Brand assets
│   ├── 📄 logo.png
│   └── 📄 typography-logo.png
└── 📁 sfx/                        # Sound effects
```

## 📚 Documentation (`docs/`)

```
docs/
├── 📄 ADMIN_DASHBOARD.md          # Admin dashboard documentation
├── 📄 ADMIN_NAVIGATION_GUIDE.md   # Admin navigation guide
├── 📄 COMPONENT_UPDATE_EXAMPLE.md # Component update examples
├── 📄 DATABASE_SCHEMA_UPDATE.md   # Database schema updates
├── 📄 DOMAIN_INTERCONNECTIONS.md  # Domain architecture guide
├── 📄 MIGRATION_GUIDE.md          # Migration instructions
├── 📄 QUICK_FIX_GUIDE.md          # Quick fixes guide
├── 📄 README-empty-states.md      # Empty states documentation
└── 📁 migrations/                 # Database migrations
    └── 📄 tax-settings-tables.sql # Tax settings migration
```

## 🏗️ Architecture Principles

### 1. Domain-Driven Design
- Each domain encapsulates related business logic
- Clear separation between UI, business logic, and data layers
- Domains communicate through well-defined interfaces

### 2. Component Architecture
- **UI Components**: Pure presentation components in `src/components/ui/`
- **Common Components**: Shared business components in `src/components/common/`
- **Domain Components**: Feature-specific components within domains

### 3. Route Organization
- **Route Groups**: `(auth)`, `(store)`, `admin` for logical separation
- **Nested Layouts**: Shared layouts for related routes
- **Dynamic Routes**: `[slug]` and `[id]` for dynamic content

### 4. State Management
- **React Context**: For global state (auth, cart, wishlist)
- **Local State**: useState/useReducer for component state
- **Server State**: Supabase for persistent data

### 5. Type Safety
- **Generated Types**: Database types from Supabase
- **Domain Types**: Business logic types per domain
- **Component Props**: Strict TypeScript interfaces

## 🚀 Key Features

### Customer Features
- **Product Catalog**: Browse products by categories and collections
- **Shopping Cart**: Add/remove items with persistent storage
- **User Authentication**: Login, signup, password reset
- **Checkout Process**: Multi-step checkout with payment integration
- **Order Tracking**: Track order status and history
- **Wishlist**: Save favorite products
- **User Profile**: Manage account settings and addresses

### Admin Features
- **Dashboard**: Business metrics and KPIs
- **Product Management**: CRUD operations for products and variants
- **Inventory Control**: Stock management and alerts
- **Order Management**: Process and fulfill orders
- **Category Management**: Organize product catalog
- **Banner Management**: Create promotional banners
- **Customer Management**: View customer data and orders
- **Settings**: Configure store, payments, shipping, and taxes

### Technical Features
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark Mode**: Theme switching with next-themes
- **SEO Optimization**: Meta tags, sitemaps, and structured data
- **Performance**: Image optimization, lazy loading, and caching
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support
- **Real-time Updates**: Live data with Supabase subscriptions
- **Payment Integration**: Razorpay for secure payments
- **Email Notifications**: Transactional emails with Resend

## 🔧 Development Scripts

```json
{
  "dev": "next dev",           // Start development server
  "build": "next build",       // Build for production
  "start": "next start",       // Start production server
  "lint": "eslint"             // Run ESLint
}
```

## 🌟 Notable Dependencies

### Core Framework
- **Next.js 16.0.10**: React framework with App Router
- **React 19.2.1**: UI library
- **TypeScript 5**: Type safety

### UI & Styling
- **Tailwind CSS v4**: Utility-first CSS framework
- **shadcn/ui**: High-quality React components
- **Radix UI**: Unstyled, accessible components
- **Lucide React**: Icon library
- **next-themes**: Theme switching

### Database & Auth
- **Supabase**: PostgreSQL database and authentication
- **@supabase/ssr**: Server-side rendering support

### Forms & Validation
- **React Hook Form**: Form handling
- **Zod**: Schema validation
- **@hookform/resolvers**: Form validation integration

### Payments & Services
- **Razorpay**: Payment processing
- **Resend**: Email service
- **Upstash Redis**: Caching layer

### Development Tools
- **ESLint**: Code linting
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixes

This project structure follows modern Next.js best practices with a focus on maintainability, scalability, and developer experience. The domain-driven architecture ensures clean separation of concerns while the comprehensive component library provides consistent UI patterns throughout the application.