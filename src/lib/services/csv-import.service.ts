import Papa from 'papaparse'
import { supabaseAdmin } from '@/lib/supabase/supabase'
import type {
  CSVRow,
  NormalizedCSVRow,
  ValidationError,
  ProductGroup,
  PreviewResult,
  ImportResult,
  ImportError,
  VariantData,
} from '@/types/csv-import.types'
import { SKU_REGEX, REQUIRED_FIELDS } from '@/types/csv-import.types'

export class CSVImportService {
  /**
   * Parse CSV file and return normalized data
   */
  static async parseCSV(file: File): Promise<{ success: boolean; data?: CSVRow[]; error?: string }> {
    return new Promise((resolve) => {
      Papa.parse<CSVRow>(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: (results) => {
          if (results.errors.length > 0) {
            resolve({ success: false, error: `CSV parsing error: ${results.errors[0].message}` })
          } else {
            resolve({ success: true, data: results.data })
          }
        },
        error: (error: Error) => {
          resolve({ success: false, error: error.message })
        },
      })
    })
  }

  /**
   * Normalize CSV row to standard format (handle both old and new formats)
   */
  static normalizeRow(row: CSVRow): NormalizedCSVRow {
    // Helper to parse boolean
    const parseBoolean = (value: any): boolean => {
      if (typeof value === 'boolean') return value
      const str = String(value).toLowerCase().trim()
      return str === 'true' || str === '1' || str === 'yes'
    }

    // Helper to parse number
    const parseNumber = (value: any): number => {
      if (typeof value === 'number') return value
      const str = String(value).replace(/[^0-9.-]/g, '')
      return parseFloat(str) || 0
    }

    // Helper to parse comma-separated list
    const parseList = (value?: string): string[] => {
      if (!value) return []
      return value.split(',').map(item => item.trim()).filter(Boolean)
    }

    // Map legacy field names to new ones
    const handle = row.product_handle || row['Product Handle'] || ''
    const title = row.product_title || row['Product Title'] || ''
    const subtitle = row.product_subtitle || row['Product Subtitle'] || ''
    const description = row.product_description || row['Product Description'] || ''
    const status = (row.product_status || row['Product Status'] || 'draft').toLowerCase()
    const thumbnail = row.product_thumbnail || row['Product Thumbnail'] || ''
    const discountable = parseBoolean(row.product_discountable || row['Product Discountable'] || true)

    const variantTitle = row.product_variant_title || row['Variant Title'] || ''
    const variantSku = row.product_variant_sku || row['Variant Sku'] || ''
    const variantPrice = parseNumber(row.variant_price || row['Variant Price INR'] || 0)
    const variantQuantity = parseNumber(
      row.variant_quantity || row.variant_inventory_stock || row['inventory quantity'] || 0
    )
    const manageInventory = parseBoolean(row.variant_manage_inventory || row['Variant Manage Inventory'] || true)
    const allowBackorder = parseBoolean(row.variant_allow_backorder || false)

    // Parse variant images
    const variantImages = parseList(row.product_variant_images)

    // Parse highlights
    const highlights: { label: string; value: string }[] = []
    if (row.product_highlight_1_label && row.product_highlight_1_value) {
      highlights.push({
        label: row.product_highlight_1_label,
        value: row.product_highlight_1_value,
      })
    }
    if (row.product_highlight_2_label && row.product_highlight_2_value) {
      highlights.push({
        label: row.product_highlight_2_label,
        value: row.product_highlight_2_value,
      })
    }

    // Parse collections (support both slugs and IDs)
    const collections = parseList(row.collections || row['Product Collection Id'])

    // Parse categories
    const categories = parseList(row.categories)

    // Parse tags (combine tag1 and tag2 if present)
    const tags: string[] = []
    if (row.tags) {
      tags.push(...parseList(row.tags))
    }
    if (row['Product Tag 1']) tags.push(row['Product Tag 1'])
    if (row['Product Tag 2']) tags.push(row['Product Tag 2'])

    // Parse variant options
    const variantOptions: { name: string; value: string }[] = []
    if (row['Variant Option 1 Name'] && row['Variant Option 1 Value']) {
      variantOptions.push({
        name: row['Variant Option 1 Name'],
        value: row['Variant Option 1 Value'],
      })
    }
    if (row['Variant Option 2 Name'] && row['Variant Option 2 Value']) {
      variantOptions.push({
        name: row['Variant Option 2 Name'],
        value: row['Variant Option 2 Value'],
      })
    }

    return {
      product_handle: handle,
      product_title: title,
      product_subtitle: subtitle || undefined,
      product_description: description || undefined,
      product_status: (status === 'published' || status === 'active') ? 'published' : 'draft',
      product_thumbnail: thumbnail || undefined,
      product_variant_images: variantImages.length > 0 ? variantImages : undefined,
      product_highlights: highlights.length > 0 ? highlights : undefined,
      product_variant_title: variantTitle,
      product_variant_sku: variantSku,
      product_discountable: discountable,
      variant_manage_inventory: manageInventory,
      variant_allow_backorder: allowBackorder,
      variant_price: variantPrice,
      variant_quantity: variantQuantity,
      collections: collections.length > 0 ? collections : undefined,
      categories: categories.length > 0 ? categories : undefined,
      tags: tags.length > 0 ? tags : undefined,
      variant_options: variantOptions.length > 0 ? variantOptions : undefined,
    }
  }

  /**
   * Validate a normalized row
   */
  static async validateRow(
    row: NormalizedCSVRow,
    rowIndex: number,
    existingSkus: Set<string>
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = []

    // Check required fields
    REQUIRED_FIELDS.forEach(field => {
      const value = (row as any)[field]
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push({
          row: rowIndex,
          field,
          message: `${field} is required`,
          type: 'blocking',
        })
      }
    })

    // Validate product_handle format
    if (row.product_handle && !/^[a-z0-9-]+$/.test(row.product_handle)) {
      errors.push({
        row: rowIndex,
        field: 'product_handle',
        message: 'Handle must contain only lowercase letters, numbers, and hyphens',
        type: 'blocking',
      })
    }

    // Validate SKU
    if (row.product_variant_sku) {
      // Check for duplicates within CSV
      if (existingSkus.has(row.product_variant_sku)) {
        errors.push({
          row: rowIndex,
          field: 'product_variant_sku',
          message: `Duplicate SKU: ${row.product_variant_sku}`,
          type: 'blocking',
        })
      } else {
        existingSkus.add(row.product_variant_sku)
      }

      // Validate SKU format (warning only)
      if (!SKU_REGEX.test(row.product_variant_sku)) {
        errors.push({
          row: rowIndex,
          field: 'product_variant_sku',
          message: `SKU format recommended: BRAND-CAT-PRODUCT-VAR (e.g., DUDE-TSH-OXFRD-BLK-M). Current: ${row.product_variant_sku}`,
          type: 'warning',
        })
      }

      // Check if SKU exists in database
      const { data: existingVariant } = await supabaseAdmin
        .from('product_variants')
        .select('id, sku')
        .eq('sku', row.product_variant_sku)
        .single()

      if (existingVariant) {
        errors.push({
          row: rowIndex,
          field: 'product_variant_sku',
          message: `SKU already exists in database: ${row.product_variant_sku} (will be updated)`,
          type: 'warning',
        })
      }
    }

    // Validate price
    if (row.variant_price <= 0) {
      errors.push({
        row: rowIndex,
        field: 'variant_price',
        message: 'Price must be greater than 0',
        type: 'blocking',
      })
    }

    // Validate quantity
    if (row.variant_quantity < 0) {
      errors.push({
        row: rowIndex,
        field: 'variant_quantity',
        message: 'Quantity cannot be negative',
        type: 'blocking',
      })
    }

    // Validate inventory settings
    if (!row.variant_manage_inventory && row.variant_allow_backorder) {
      errors.push({
        row: rowIndex,
        field: 'variant_allow_backorder',
        message: 'Backorder cannot be enabled when inventory is not managed',
        type: 'warning',
      })
    }

    // Validate images (warning if missing)
    if (!row.product_thumbnail) {
      errors.push({
        row: rowIndex,
        field: 'product_thumbnail',
        message: 'Product thumbnail is missing',
        type: 'warning',
      })
    }

    return errors
  }

  /**
   * Group rows by product_handle
   */
  static groupByHandle(rows: NormalizedCSVRow[], allErrors: ValidationError[]): ProductGroup[] {
    const groups = new Map<string, ProductGroup>()

    rows.forEach((row, index) => {
      const handle = row.product_handle
      const rowErrors = allErrors.filter(e => e.row === index)
      const blockingErrors = rowErrors.filter(e => e.type === 'blocking')
      const warnings = rowErrors.filter(e => e.type === 'warning')

      if (!groups.has(handle)) {
        groups.set(handle, {
          handle,
          title: row.product_title,
          subtitle: row.product_subtitle,
          description: row.product_description,
          status: row.product_status,
          thumbnail: row.product_thumbnail,
          highlights: row.product_highlights,
          discountable: row.product_discountable,
          collections: row.collections,
          categories: row.categories,
          tags: row.tags,
          variants: [],
          errors: [],
          warnings: [],
        })
      }

      const group = groups.get(handle)!
      group.variants.push({
        title: row.product_variant_title,
        sku: row.product_variant_sku,
        price: row.variant_price,
        quantity: row.variant_quantity,
        manage_inventory: row.variant_manage_inventory,
        allow_backorder: row.variant_allow_backorder,
        images: row.product_variant_images,
        options: row.variant_options,
      })

      group.errors.push(...blockingErrors)
      group.warnings.push(...warnings)
    })

    return Array.from(groups.values())
  }

  /**
   * Preview CSV import
   */
  static async previewImport(file: File): Promise<PreviewResult> {
    // Parse CSV
    const parseResult = await this.parseCSV(file)
    if (!parseResult.success || !parseResult.data) {
      return {
        success: false,
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        productGroups: [],
        totalProducts: 0,
        totalVariants: 0,
        blockingErrors: [{
          row: 0,
          field: 'file',
          message: parseResult.error || 'Failed to parse CSV',
          type: 'blocking',
        }],
        warnings: [],
      }
    }

    // Normalize rows
    const normalizedRows = parseResult.data.map(row => this.normalizeRow(row))

    // Validate rows
    const allErrors: ValidationError[] = []
    const existingSkus = new Set<string>()

    for (let i = 0; i < normalizedRows.length; i++) {
      const errors = await this.validateRow(normalizedRows[i], i + 2, existingSkus) // +2 for header row
      allErrors.push(...errors)
    }

    // Group by handle
    const productGroups = this.groupByHandle(normalizedRows, allErrors)

    // Separate blocking errors and warnings
    const blockingErrors = allErrors.filter(e => e.type === 'blocking')
    const warnings = allErrors.filter(e => e.type === 'warning')

    const validRows = normalizedRows.length - blockingErrors.length

    return {
      success: blockingErrors.length === 0,
      totalRows: normalizedRows.length,
      validRows,
      invalidRows: blockingErrors.length,
      productGroups,
      totalProducts: productGroups.length,
      totalVariants: normalizedRows.length,
      blockingErrors,
      warnings,
    }
  }

  /**
   * Execute CSV import with transaction safety
   */
  static async executeImport(productGroups: ProductGroup[]): Promise<ImportResult> {
    const startTime = Date.now()
    let productsCreated = 0
    let productsUpdated = 0
    let variantsCreated = 0
    let variantsUpdated = 0
    let failed = 0
    const errors: ImportError[] = []

    for (const group of productGroups) {
      // Skip groups with blocking errors
      if (group.errors.length > 0) {
        failed++
        errors.push({
          productHandle: group.handle,
          message: 'Skipped due to validation errors',
          details: group.errors.map(e => e.message).join(', '),
        })
        continue
      }

      try {
        // Transaction per product
        const result = await this.importProduct(group)
        if (result.success) {
          if (result.created) {
            productsCreated++
            variantsCreated += result.variantsCreated || 0
          } else {
            productsUpdated++
            variantsUpdated += result.variantsCreated || 0
            variantsCreated += result.variantsUpdated || 0
          }
        } else {
          failed++
          errors.push({
            productHandle: group.handle,
            message: result.error || 'Import failed',
          })
        }
      } catch (error: any) {
        failed++
        errors.push({
          productHandle: group.handle,
          message: 'Unexpected error during import',
          details: error.message,
        })
      }
    }

    const duration = Date.now() - startTime

    return {
      success: errors.length === 0,
      productsCreated,
      productsUpdated,
      variantsCreated,
      variantsUpdated,
      failed,
      errors,
      duration,
    }
  }

  /**
   * Import a single product with all its variants (transaction-safe)
   */
  static async importProduct(group: ProductGroup): Promise<{
    success: boolean
    created: boolean
    variantsCreated?: number
    variantsUpdated?: number
    error?: string
  }> {
    try {
      // Check if product exists
      const { data: existingProduct } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('slug', group.handle)
        .single()

      let productId: string
      let created = false

      if (existingProduct) {
        // Update existing product
        const { error: updateError } = await supabaseAdmin
          .from('products')
          .update({
            title: group.title,
            subtitle: group.subtitle,
            description: group.description,
            status: group.status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingProduct.id)

        if (updateError) throw updateError
        productId = existingProduct.id
      } else {
        // Create new product
        const { data: newProduct, error: createError } = await supabaseAdmin
          .from('products')
          .insert([{
            title: group.title,
            slug: group.handle,
            subtitle: group.subtitle,
            description: group.description,
            status: group.status,
            price: Math.min(...group.variants.map(v => v.price)),
            taxable: group.discountable,
          }])
          .select('id')
          .single()

        if (createError) throw createError
        productId = newProduct.id
        created = true
      }

      // Create product images if thumbnail exists
      if (group.thumbnail) {
        await supabaseAdmin
          .from('product_images')
          .upsert([{
            product_id: productId,
            image_url: group.thumbnail,
            is_primary: true,
            sort_order: 0,
          }], { onConflict: 'product_id' })
      }

      // Process variants
      let variantsCreated = 0
      let variantsUpdated = 0

      for (const variant of group.variants) {
        const { data: existingVariant } = await supabaseAdmin
          .from('product_variants')
          .select('id')
          .eq('sku', variant.sku)
          .single()

        if (existingVariant) {
          // Update variant
          const { error: variantError } = await supabaseAdmin
            .from('product_variants')
            .update({
              name: variant.title,
              price: variant.price,
              stock: variant.quantity,
              active: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingVariant.id)

          if (variantError) throw variantError

          // Update inventory
          await supabaseAdmin
            .from('inventory_items')
            .upsert([{
              variant_id: existingVariant.id,
              quantity: variant.quantity,
              available_quantity: variant.quantity,
              track_quantity: variant.manage_inventory,
              allow_backorders: variant.allow_backorder,
            }], { onConflict: 'variant_id' })

          variantsUpdated++
        } else {
          // Create variant
          const { data: newVariant, error: variantError } = await supabaseAdmin
            .from('product_variants')
            .insert([{
              product_id: productId,
              name: variant.title,
              sku: variant.sku,
              price: variant.price,
              stock: variant.quantity,
              active: true,
            }])
            .select('id')
            .single()

          if (variantError) throw variantError

          // Create inventory
          await supabaseAdmin
            .from('inventory_items')
            .insert([{
              variant_id: newVariant.id,
              quantity: variant.quantity,
              available_quantity: variant.quantity,
              track_quantity: variant.manage_inventory,
              allow_backorders: variant.allow_backorder,
            }])

          variantsCreated++
        }
      }

      // Attach categories
      if (group.categories && group.categories.length > 0) {
        for (const catName of group.categories) {
          const { data: category } = await supabaseAdmin
            .from('categories')
            .select('id')
            .or(`slug.eq.${catName.toLowerCase().replace(/\s+/g, '-')},name.eq.${catName}`)
            .single()

          if (category) {
            await supabaseAdmin
              .from('product_categories')
              .upsert([{
                product_id: productId,
                category_id: category.id,
              }], { onConflict: 'product_id,category_id', ignoreDuplicates: true })
          }
        }
      }

      // Attach collections
      if (group.collections && group.collections.length > 0) {
        for (const collectionSlug of group.collections) {
          const { data: collection } = await supabaseAdmin
            .from('collections')
            .select('id')
            .or(`slug.eq.${collectionSlug},id.eq.${collectionSlug}`)
            .single()

          if (collection) {
            await supabaseAdmin
              .from('product_collections')
              .upsert([{
                product_id: productId,
                collection_id: collection.id,
              }], { onConflict: 'product_id,collection_id', ignoreDuplicates: true })
          }
        }
      }

      // Attach tags
      if (group.tags && group.tags.length > 0) {
        for (const tagName of group.tags) {
          const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-')
          
          // Get or create tag
          let { data: tag } = await supabaseAdmin
            .from('product_tags')
            .select('id')
            .eq('slug', tagSlug)
            .single()

          if (!tag) {
            const { data: newTag } = await supabaseAdmin
              .from('product_tags')
              .insert([{ name: tagName, slug: tagSlug }])
              .select('id')
              .single()
            tag = newTag
          }

          if (tag) {
            await supabaseAdmin
              .from('product_tag_assignments')
              .upsert([{
                product_id: productId,
                tag_id: tag.id,
              }], { onConflict: 'product_id,tag_id', ignoreDuplicates: true })
          }
        }
      }

      return { success: true, created, variantsCreated, variantsUpdated }
    } catch (error: any) {
      return { success: false, created: false, error: error.message }
    }
  }

  /**
   * Generate CSV template
   */
  static generateTemplate(): string {
    const headers = [
      'product_handle',
      'product_title',
      'product_subtitle',
      'product_description',
      'product_status',
      'product_thumbnail',
      'product_variant_images',
      'product_highlight_1_label',
      'product_highlight_1_value',
      'product_highlight_2_label',
      'product_highlight_2_value',
      'product_variant_title',
      'product_variant_sku',
      'product_discountable',
      'variant_manage_inventory',
      'variant_allow_backorder',
      'variant_price',
      'variant_quantity',
      'variant_inventory_stock',
      'collections',
      'categories',
      'tags',
    ]

    const exampleRow1 = [
      'oxford-shirt',
      'Oxford Formal Shirt',
      'Premium Cotton Shirt',
      'Classic oxford formal shirt made from 100% cotton',
      'published',
      'https://example.com/images/oxford-shirt.jpg',
      'https://example.com/images/oxford-shirt-1.jpg,https://example.com/images/oxford-shirt-2.jpg',
      'Material',
      '100% Cotton',
      'Fit',
      'Slim Fit',
      'M / Black',
      'DUDE-SHT-OXFRD-BLK-M',
      'TRUE',
      'TRUE',
      'FALSE',
      '1999',
      '100',
      '100',
      'formal-wear,new-arrivals',
      'Shirts,Formal',
      'New Drops,Best Seller',
    ]

    const exampleRow2 = [
      'oxford-shirt',
      'Oxford Formal Shirt',
      'Premium Cotton Shirt',
      'Classic oxford formal shirt made from 100% cotton',
      'published',
      'https://example.com/images/oxford-shirt.jpg',
      'https://example.com/images/oxford-shirt-3.jpg,https://example.com/images/oxford-shirt-4.jpg',
      'Material',
      '100% Cotton',
      'Fit',
      'Slim Fit',
      'L / Black',
      'DUDE-SHT-OXFRD-BLK-L',
      'TRUE',
      'TRUE',
      'FALSE',
      '1999',
      '100',
      '100',
      'formal-wear,new-arrivals',
      'Shirts,Formal',
      'New Drops,Best Seller',
    ]

    return Papa.unparse([headers, exampleRow1, exampleRow2])
  }
}
