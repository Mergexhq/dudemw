# Help Center SKU Documentation Update

## Overview

Updated the admin help center with comprehensive documentation for the new SKU auto-generation feature and CSV import process.

## Changes Made

### 1. Updated SKU Format Guide

**Before**: Basic SKU format rules
**After**: Comprehensive guide covering both auto-generation and manual SKU creation

**New Content**:
- 🔄 **Auto-Generation**: Clear explanation of when SKUs are auto-generated
- 📋 **Formula**: `CATEGORY-DUDE-FZT-SIZE-COLOR` with examples
- 📝 **Requirements**: Specific field requirements for auto-generation
- ✏️ **Manual SKUs**: Alternative manual format for custom SKUs
- 💡 **Examples**: Both auto-generated and manual SKU examples

### 2. Added CSV Import Guide

**New Guide**: "CSV Bulk Import Guide"
- Complete step-by-step process for CSV imports
- Field requirements and formatting rules
- Auto-generation setup instructions
- Validation and error handling guidance
- Transaction safety information

### 3. Updated CSV Templates

**Product Import Template**:
- Updated to use new CSV format with proper field names
- Shows auto-generation examples (empty SKU fields)
- Includes proper JSON format for color variants
- Demonstrates both auto-generated and manual SKU scenarios

**Template Example**:
```csv
product_handle,product_title,product_status,product_variant_title,variant_price,category_1,variant_option_1_name,variant_option_1_value,variant_option_2_name,variant_option_2_value,product_variant_sku
oxford-shirt,Oxford Formal Shirt,published,M / Black,1999,Shirts,Size,M,Color,"{""name"": ""Black"", ""code"": ""#000000""}",
oxford-shirt,Oxford Formal Shirt,published,L / Black,1999,Shirts,Size,L,Color,"{""name"": ""Black"", ""code"": ""#000000""}",
casual-tee,Casual T-Shirt,published,M / Red,799,T-Shirts,Size,M,Color,"{""name"": ""Red"", ""code"": ""#FF0000""}",MANUAL-SKU-001
```

## Help Center Structure

### Guides Available:
1. **Tax Setup Guide** - GST configuration for India
2. **Shipping Rules** - Zone-based shipping setup
3. **SKU Format & Auto-Generation** - ✨ Updated with new formula
4. **CSV Bulk Import Guide** - ✨ New comprehensive import guide

### CSV Templates:
1. **Product Import Template** - ✨ Updated with auto-generation examples
2. **Inventory Update Template** - Stock quantity updates by SKU

## Key Features Documented

### Auto-Generation Formula
- **Pattern**: `CATEGORY-DUDE-FZT-SIZE-COLOR`
- **Example**: `SHIRTS-DUDE-FZT-M-BLACK`
- **Requirements**: 
  - `category_1` field filled
  - `variant_option_1_name` = "Size" with value
  - `variant_option_2_name` = "Color" with JSON format

### Manual SKU Format
- **Pattern**: `BRAND-CAT-PRODUCT-VAR`
- **Example**: `DUDE-SHT-OXFRD-BLK-M`
- **Rules**: Uppercase, hyphens only, max 20 chars

### CSV Import Process
1. Navigate to Admin → Products → Import
2. Download template from Help Center
3. Fill CSV with product data
4. Leave SKU empty for auto-generation
5. Preview and validate
6. Execute import

## User Benefits

### For Admins:
- **Clear Instructions**: Step-by-step guides with emojis for easy scanning
- **Template Downloads**: Ready-to-use CSV templates with examples
- **Error Prevention**: Clear requirements prevent common mistakes
- **Visual Examples**: Both auto-generated and manual SKU examples

### For Bulk Imports:
- **Simplified Process**: No need to manually create SKUs
- **Consistent Format**: Auto-generated SKUs follow standard pattern
- **Flexibility**: Can still use manual SKUs when needed
- **Error Handling**: Clear validation messages and warnings

## Access Path

Users can access the updated help center at:
**Admin Panel → Settings → Help Center**

Or directly navigate to: `/admin/settings/help-center`

## Files Updated

1. `src/app/admin/settings/help-center/page.tsx` - Main help center component
2. `HELP_CENTER_SKU_UPDATE.md` - This documentation

## Testing Recommendations

1. **Navigate to Help Center**: Verify all guides display correctly
2. **Download Templates**: Test CSV template downloads
3. **Guide Content**: Review SKU and CSV import guide content
4. **Dialog Functionality**: Test guide popup dialogs
5. **Responsive Design**: Check on mobile/tablet devices

---

**Status**: ✅ Complete  
**Version**: 1.1.0  
**Date**: December 2024  
**Impact**: Improved user experience for bulk product imports with clear SKU documentation