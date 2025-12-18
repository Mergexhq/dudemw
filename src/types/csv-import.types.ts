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
  product_highlight_1_label?: string
  product_highlight_1_value?: string
  product_highlight_2_label?: string
  product_highlight_2_value?: string
  
  // Variant Fields
  product_variant_title: string
  product_variant_sku: string
  product_discountable: boolean | string
  variant_manage_inventory: boolean | string
  variant_allow_backorder: boolean | string
  variant_price: number | string
  variant_quantity: number | string
  variant_inventory_stock: number | string
  
  // Taxonomy
  collections?: string // Comma-separated slugs/ids
  categories?: string // Comma-separated slugs/names
  tags?: string // Comma-separated tags

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
  product_highlights?: { label: string; value: string }[]
  
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

  // Options (for variant configuration)
  variant_options?: { name: string; value: string }[]
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
  highlights?: { label: string; value: string }[]
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
  options?: { name: string; value: string }[]
}

export interface PreviewResult {
  success: boolean
  totalRows: number
  validRows: number
  invalidRows: number
  productGroups: ProductGroup[]
  totalProducts: number
  totalVariants: number
  blockingErrors: ValidationError[]
  warnings: ValidationError[]
}

export interface ImportResult {
  success: boolean
  productsCreated: number
  productsUpdated: number
  variantsCreated: number
  variantsUpdated: number
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
  'product_variant_sku',
  'variant_price',
]
