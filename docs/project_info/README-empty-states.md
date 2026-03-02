# Admin Empty States

This directory contains empty state components for all admin pages. Empty states are shown when there's no data to display, providing users with clear guidance on what to do next.

## Available Empty States

- `ProductsEmptyState` - For when there are no products
- `OrdersEmptyState` - For when there are no orders
- `CustomersEmptyState` - For when there are no customers
- `CollectionsEmptyState` - For when there are no collections
- `CouponsEmptyState` - For when there are no coupons
- `InventoryEmptyState` - For when there's no inventory data
- `BannersEmptyState` - For when there are no banners
- `CategoriesEmptyState` - For when there are no categories

## Usage

Import the empty state component you need:

```tsx
import { ProductsEmptyState } from "@/components/admin/empty-states"
```

Use conditional rendering to show empty state when there's no data:

```tsx
export default function ProductsPage() {
  const hasProducts = products.length > 0
  
  if (!hasProducts) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          {/* Page header */}
        </div>
        <ProductsEmptyState />
      </div>
    )
  }
  
  // Normal page content when there's data
  return (
    <div className="space-y-8">
      {/* Normal page content */}
    </div>
  )
}
```

## Features

Each empty state includes:
- **Relevant Icon** - Visual representation of the content type
- **Clear Title** - Explains what's missing
- **Helpful Description** - Provides context and guidance
- **Action Buttons** - Primary and secondary actions to get started
- **Consistent Styling** - Matches the admin interface design
- **Dark Mode Support** - Works in both light and dark themes

## Demo

Visit `/admin/empty-demo` to see all empty states in action.

## Customization

You can customize the empty states by:
1. Modifying the text content
2. Changing the icons
3. Updating the action buttons
4. Adjusting the styling

All empty states use the shadcn/ui `Empty` component as a base, ensuring consistency across the interface.