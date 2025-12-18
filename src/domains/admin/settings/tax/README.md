# Tax Settings Module

This module provides a modular, reusable tax settings system for the admin panel. The original monolithic component has been broken down into smaller, focused components with proper separation of concerns.

## Structure

```
tax/
├── components/           # UI Components
│   ├── global-tax-settings.tsx
│   ├── store-location-settings.tsx
│   ├── category-tax-overrides.tsx
│   └── tax-calculation-preview.tsx
├── hooks/               # Custom Hooks
│   ├── use-tax-settings.ts
│   └── use-category-tax-rules.ts
├── types.ts            # Type definitions
├── index.ts            # Barrel exports
└── README.md           # This file
```

## Components

### GlobalTaxSettings
- Handles tax enable/disable toggle
- Manages pricing type (inclusive vs exclusive)
- Controls default GST rate and GSTIN

### StoreLocationSettings
- Manages store state selection
- Shows tax type information (CGST/SGST vs IGST)
- Displays automatic tax calculation logic

### CategoryTaxOverrides
- Lists category-specific tax rules
- Allows adding/editing/deleting category overrides
- Shows available categories for new rules

### TaxCalculationPreview
- Shows sample tax calculations
- Demonstrates inclusive vs exclusive pricing
- Updates dynamically based on settings

## Hooks

### useTaxSettings
- Manages global tax settings state
- Handles data fetching and saving
- Provides loading states

### useCategoryTaxRules
- Manages category tax rules CRUD operations
- Handles available categories filtering
- Provides rule management functions

## Types

All TypeScript interfaces and constants are defined in `types.ts`:
- `TaxSettings` - Main tax configuration
- `CategoryTaxRule` - Category-specific tax rules
- `Category` - Category information
- `INDIAN_STATES` - List of Indian states
- `GST_RATES` - Common GST rates

## Usage

```tsx
import { TaxSettingsForm } from './tax-settings-form'

// Use the complete form
<TaxSettingsForm />

// Or use individual components
import { GlobalTaxSettings, useTaxSettings } from './tax'

function CustomTaxForm() {
  const { taxSettings, setTaxSettings } = useTaxSettings()
  
  return (
    <GlobalTaxSettings 
      taxSettings={taxSettings} 
      setTaxSettings={setTaxSettings} 
    />
  )
}
```

## Benefits

1. **Modularity**: Each component has a single responsibility
2. **Reusability**: Components can be used independently
3. **Maintainability**: Easier to test and modify individual parts
4. **Type Safety**: Full TypeScript support with proper types
5. **Performance**: Better code splitting and loading
6. **Testability**: Smaller components are easier to unit test

## Database Schema

The module expects these database tables:
- `tax_settings` - Global tax configuration
- `category_tax_rules` - Category-specific tax overrides
- `categories` - Product categories

Make sure the database types are updated in `src/types/database.types.ts`.