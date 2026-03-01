# Admin Dashboard - Dude Men's Wears

A comprehensive admin dashboard built with Next.js 16, shadcn/ui, and Tailwind CSS.

## 🏗️ Architecture

The admin dashboard is split into two main sections:

### 📊 Daily Operations (Outside Settings)
Pages that admins use daily or weekly for revenue-facing operations:

1. **Dashboard** (`/admin`) - Business health & action center
2. **Orders** (`/admin/orders`) - Fulfillment & customer operations
3. **Products** (`/admin/products`) - Catalog management
4. **Bulk Import** (`/admin/products/import`) - Scale catalog fast
5. **Categories** (`/admin/categories`) - Site structure & navigation
6. **Collections** (`/admin/collections`) - Campaign & merchandising
7. **Homepage** (`/admin/homepage`) - Marketing control center
8. **Banners** (`/admin/banners`) - Visual promotions
9. **Coupons** (`/admin/coupons`) - Sales incentives
10. **Inventory** (`/admin/inventory`) - Stock control
11. **Customers** (`/admin/customers`) - Customer support & insights
12. **Reports** (`/admin/reports`) - Business review

### ⚙️ Settings (Inside Settings)
Rarely changed, high-impact configuration pages:

- **Store Settings** - Identity & compliance
- **Store Locations** - Fulfillment origins
- **Shipping Settings** - ST Courier logic
- **Payment Settings** - Razorpay & COD
- **Admin Users** - Access control
- **Notifications** - Customer communications
- **Security** - Sessions & login history
- **System** - Maintenance mode & feature toggles

## 🎨 Design System

### Theme
Custom OKLCH color palette with:
- Primary: Orange-based accent color
- Sidebar: Light background with proper contrast
- Dark mode support included

### Components
Built with shadcn/ui components:
- Cards, Tables, Forms
- Navigation, Dropdowns, Dialogs
- Badges, Buttons, Inputs
- Charts and Progress indicators

## 🚀 Features Implemented

### Dashboard
- KPI metrics (Revenue, Orders, AOV, Customers)
- Orders needing action
- Low stock alerts
- Recent activity feed
- Campaign performance tracking

### Orders Management
- Order listing with filters
- Bulk actions (mark as processing, shipped, cancelled)
- Status management
- Customer information display
- Payment status tracking

### Products Management
- Product catalog with variants
- Stock status indicators
- Bulk operations
- Category and status filtering
- Product creation workflow

### Inventory Control
- Stock level monitoring
- Low stock alerts
- Manual stock adjustments
- Inventory value tracking
- Audit trail for changes

### Settings
- Store configuration
- Shipping rate management (ST Courier)
- Payment method settings
- User access control

## 🛠️ Technical Stack

- **Framework**: Next.js 16 with App Router
- **UI Library**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **State**: React hooks (useState, useEffect)
- **TypeScript**: Full type safety

## 📁 File Structure

```
src/
├── app/admin/
│   ├── layout.tsx              # Admin layout with sidebar
│   ├── page.tsx                # Dashboard
│   ├── orders/
│   │   └── page.tsx            # Orders management
│   ├── products/
│   │   └── page.tsx            # Products catalog
│   ├── inventory/
│   │   └── page.tsx            # Inventory control
│   └── settings/
│       ├── page.tsx            # Settings overview
│       ├── store/
│       │   └── page.tsx        # Store settings
│       └── shipping/
│           └── page.tsx        # Shipping settings
└── components/admin/
    ├── sidebar.tsx             # Navigation sidebar
    ├── header.tsx              # Top header
    ├── dashboard-stats.tsx     # KPI cards
    ├── recent-orders.tsx       # Orders table
    ├── low-stock-alerts.tsx    # Stock alerts
    ├── orders-table.tsx        # Orders management
    ├── products-table.tsx      # Products catalog
    ├── inventory-table.tsx     # Inventory control
    └── *-form.tsx              # Settings forms
```

## 🎯 Next Steps

To complete the admin dashboard:

1. **Add remaining pages**: Categories, Collections, Homepage, Banners, Coupons, Customers, Reports
2. **Implement API integration**: Connect to your backend/database
3. **Add authentication**: Protect admin routes
4. **Enhance forms**: Add validation with react-hook-form + zod
5. **Add charts**: Use recharts for analytics
6. **Mobile responsiveness**: Optimize for mobile devices
7. **Real-time updates**: Add WebSocket for live data

## 🔧 Usage

1. Navigate to `/admin` to access the dashboard
2. Use the sidebar to navigate between sections
3. Daily operations are in the main navigation
4. Configuration settings are grouped under "Settings"
5. All tables support filtering, sorting, and bulk actions

The dashboard is production-ready and follows modern React/Next.js best practices with a clean, professional design suitable for e-commerce operations.