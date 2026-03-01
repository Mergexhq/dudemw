# SKU Auto-Generation Feature Update

## Overview

Updated the bulk CSV import system to automatically generate SKU values when the `product_variant_sku` field is left empty, using the formula: `CATEGORY-DUDE-FZT-SIZE-COLOR`.

## Changes Made

### 1. CSV Import Service (`src/lib/services/csv-import.service.ts`)

**SKU Auto-Generation Logic**:
- Added automatic SKU generation in `normalizeRow()` method
- Formula: `UPPER(category_1) + "-DUDE-FZT-" + UPPER(size) + "-" + UPPER(color_name)`
- Only generates SKU if all required components are present:
  - `category_1` field has value
  - `variant_option_1_name` = "Size" and `variant_option_1_value` has value
  - `variant_option_2_name` = "Color" and `variant_option_2_value` has JSON with "name" field

**Validation Updates**:
- Updated validation to handle empty SKUs gracefully
- Added informational warning when SKU will be auto-generated
- SKU field is now optional during validation

**Template Updates**:
- Updated CSV template examples to show empty SKU fields
- Added comments showing what the auto-generated SKU would be

### 2. CSV Import Types (`src/types/csv-import.types.ts`)

**Required Fields Update**:
- Removed `product_variant_sku` from `REQUIRED_FIELDS` array
- SKU is now optional and will be auto-generated if missing

### 3. Documentation (`CSV_IMPORT_DOCUMENTATION.md`)

**Updated Sections**:
- **SKU Format**: Added auto-generation formula and examples
- **Required Fields**: Marked SKU as optional with auto-generation note
- **Validation Rules**: Added warning for empty SKU fields
- **Examples**: Updated to show auto-generation behavior

## Auto-Generation Formula

### Input Mapping
Based on the original Excel formula: `=UPPER(Y3)&"-"&"DUDE"&"-"&"FZT"&"-"&UPPER(T3)&"-"&UPPER(REGEXEXTRACT(V3, "name"": ""(.+?)""))`

- **Y3** (category_1) → First category in uppercase
- **"DUDE"** → Fixed brand identifier
- **"FZT"** → Fixed product type identifier
- **T3** (variant_option_1_value) → Size value in uppercase
- **V3** (variant_option_2_value) → Color name extracted from JSON in uppercase

### Examples

| Category | Size | Color JSON | Generated SKU |
|----------|------|------------|---------------|
| Shirts | M | `{"name": "Black", "code": "#000000"}` | `SHIRTS-DUDE-FZT-M-BLACK` |
| Hoodies | XL | `{"name": "Grey", "code": "#808080"}` | `HOODIES-DUDE-FZT-XL-GREY` |
| Jeans | L | `{"name": "Blue", "code": "#0000FF"}` | `JEANS-DUDE-FZT-L-BLUE` |

## Backward Compatibility

- **Manual SKUs**: Still supported - if SKU field has value, it will be used as-is
- **Legacy Formats**: All existing CSV formats continue to work
- **Validation**: Manual SKUs still validated against recommended format (warning only)

## Usage Instructions

### For Auto-Generation
1. Leave `product_variant_sku` field empty
2. Ensure `category_1` is filled
3. Set `variant_option_1_name` = "Size" and provide `variant_option_1_value`
4. Set `variant_option_2_name` = "Color" and provide JSON: `{"name": "ColorName", "code": "#HEX"}`

### For Manual SKUs
1. Fill `product_variant_sku` with desired SKU
2. System will use provided SKU and validate format

## Error Handling

- **Missing Components**: If category, size, or color is missing, SKU remains empty and validation will show warning
- **Invalid JSON**: If color JSON is malformed, falls back to string value
- **Duplicate SKUs**: Auto-generated SKUs are checked for duplicates like manual ones

## Testing

The system maintains full backward compatibility while adding the new auto-generation feature. Test with:

1. **Empty SKU fields** → Should auto-generate
2. **Filled SKU fields** → Should use provided SKU
3. **Mixed scenarios** → Should handle both appropriately
4. **Missing components** → Should show appropriate warnings

## Files Modified

1. `src/lib/services/csv-import.service.ts` - Core logic
2. `src/types/csv-import.types.ts` - Type definitions
3. `CSV_IMPORT_DOCUMENTATION.md` - Documentation
4. `SKU_AUTO_GENERATION_UPDATE.md` - This summary

---

**Status**: ✅ Complete  
**Version**: 1.1.0  
**Date**: December 2024