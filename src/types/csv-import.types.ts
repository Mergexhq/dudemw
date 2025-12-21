// CSV Import Types for Bulk Product Import

export interface CSVRow {
  // Product Fields
  product_handle: string
  product_title: string
  product_subtitle?: string
  product_description?: string
  product_status: 'draft' | 'published' | 'active'
  product_thumbnail?: string
  product_variant_images?: string // Comma-separated URLs

  // Highlights (separate fields)
  highlight_1?: string
  highlight_2?: string
  highlight_3?: string
  highlight_4?: string
  highlight_5?: string

  // Variant Fields
  product_variant_title: string
  product_variant_sku: string
  product_discountable: boolean | string
  variant_manage_inventory: boolean | string
  variant_allow_backorder: boolean | string
  variant_price: number | string
  variant_quantity: number | string
  variant_inventory_stock: number | string

  // Variant Options (with JSON support for color)
  variant_option_1_name?: string
  variant_option_1_value?: string
  variant_option_2_name?: string
  variant_option_2_value?: string
  variant_option_3_name?: string
  variant_option_3_value?: string

  // Taxonomy (separate fields)
  collection_1?: string
  collection_2?: string
  collection_3?: string
  collection_4?: string
  collection_5?: string

  category_1?: string
  category_2?: string
  category_3?: string
  category_4?: string
  category_5?: string

  tag_1?: string
  tag_2?: string
  tag_3?: string
  tag_4?: string
  tag_5?: string

  // Legacy fields (for backward compatibility)
  'Product Id'?: string
  'Product Handle'?: string
  'Product Title'?: string
  'Product Subtitle'?: string
  'Product Description'?: string
  'Product Status'?: string
  'Product Thumbnail'?: string
  'Product Weight'?: string | number
  'Product Discountable'?: boolean | string
  'Variant Title'?: string
  'Variant Sku'?: string
  'Variant Manage Inventory'?: boolean | string
  'Variant Price INR'?: number | string
  'Variant Metadata'?: string
  'inventory quantity'?: number | string
  'Variant Option 1 Name'?: string
  'Variant Option 1 Value'?: string
  'Variant Option 2 Name'?: string
  'Variant Option 2 Value'?: string
  'Product Origin Country'?: string
  'Variant Origin Country'?: string
  'Product Tag 1'?: string
  'Product Tag 2'?: string
  'Product Collection Id'?: string
  'Product Sales Channel 1'?: string
  'Shipping Profile Id'?: string

  // Legacy highlight fields
  product_highlight_1_label?: string
  product_highlight_1_value?: string
  product_highlight_2_label?: string
  product_highlight_2_value?: string

  // Legacy taxonomy fields
  collections?: string // Comma-separated slugs/ids
  categories?: string // Comma-separated slugs/names
  tags?: string // Comma-separated tags
}

export interface NormalizedCSVRow {
  // Product Fields
  product_handle: string
  product_title: string
  product_subtitle?: string
  product_description?: string
  product_status: 'draft' | 'published'
  product_thumbnail?: string
  product_variant_images?: string[]
  product_highlights?: string[] // Changed to simple string array

  // Variant Fields
  product_variant_title: string
  product_variant_sku: string
  product_discountable: boolean
  variant_manage_inventory: boolean
  variant_allow_backorder: boolean
  variant_price: number
  variant_quantity: number

  // Taxonomy
  collections?: string[]
  categories?: string[]
  tags?: string[]

  // Options (for variant configuration with JSON support for color)
  variant_options?: { name: string; value: string | object }[]
}

export interface ValidationError {
  row: number
  field: string
  message: string
  type: 'blocking' | 'warning'
}

export interface ProductGroup {
  handle: string
  title: string
  subtitle?: string
  description?: string
  status: 'draft' | 'published'
  thumbnail?: string
  highlights?: string[] // Changed to simple string array
  discountable: boolean
  collections?: string[]
  categories?: string[]
  tags?: string[]
  variants: VariantData[]
  errors: ValidationError[]
  warnings: ValidationError[]
}

export interface VariantData {
  title: string
  sku: string
  price: number
  quantity: number
  manage_inventory: boolean
  allow_backorder: boolean
  images?: string[]
  options?: { name: string; value: string | object }[] // Support JSON for color
}

export interface PreviewResult {
  success: boolean
  totalRows: number
  validRows: number
  invalidRows: number
  productGroups: ProductGroup[]
  totalProducts: number
  totalVariants: number
  totalCategories: number
  totalCollections: number
  totalInventoryItems: number
  uniqueCategories: string[]
  uniqueCollections: string[]
  blockingErrors: ValidationError[]
  warnings: ValidationError[]
}

export interface ImportResult {
  success: boolean
  productsCreated: number
  productsUpdated: number
  variantsCreated: number
  variantsUpdated: number
  categoriesLinked: number
  collectionsLinked: number
  inventoryUpdated: number
  failed: number
  errors: ImportError[]
  duration: number
}

export interface ImportError {
  productHandle: string
  variantSku?: string
  message: string
  details?: string
}

export const SKU_REGEX = /^[A-Z0-9]{3,5}-[A-Z]{3}-[A-Z0-9]{4,6}-[A-Z]{2,4}-[A-Z0-9]{1,3}$/

export const REQUIRED_FIELDS = [
  'product_handle',
  'product_title',
  'product_status',
  'product_variant_title',
  'variant_price',
]
