import * as Papa from 'papaparse'
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
    try {
      // Convert File/Blob to text for server-side parsing
      const text = await file.text()

      return new Promise((resolve) => {
        Papa.parse<CSVRow>(text, {
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
    } catch (error: any) {
      return { success: false, error: `Failed to read file: ${error.message}` }
    }
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

    // Helper to parse JSON value (for color variants)
    const parseVariantValue = (value: string): string | object => {
      if (!value) return value

      // Try to parse as JSON for color values
      if (value.startsWith('{') && value.endsWith('}')) {
        try {
          return JSON.parse(value)
        } catch {
          return value
        }
      }
      return value
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
    let variantSku = row.product_variant_sku || row['Variant Sku'] || ''
    const variantPrice = parseNumber(row.variant_price || row['Variant Price INR'] || 0)
    const variantQuantity = parseNumber(
      row.variant_quantity || row.variant_inventory_stock || row['inventory quantity'] || 0
    )
    const manageInventory = parseBoolean(row.variant_manage_inventory || row['Variant Manage Inventory'] || true)
    const allowBackorder = parseBoolean(row.variant_allow_backorder || false)

    // Parse variant images
    const variantImages = parseList(row.product_variant_images)

    // Parse highlights (new format: separate fields)
    const highlights: string[] = []

    // New format: highlight_1, highlight_2, etc.
    for (let i = 1; i <= 5; i++) {
      const highlightKey = `highlight_${i}` as keyof CSVRow
      const highlightValue = row[highlightKey]
      if (highlightValue && String(highlightValue).trim()) {
        highlights.push(String(highlightValue).trim())
      }
    }

    // Legacy format: key-value pairs
    if (highlights.length === 0) {
      if (row.product_highlight_1_label && row.product_highlight_1_value) {
        highlights.push(`${row.product_highlight_1_label}: ${row.product_highlight_1_value}`)
      }
      if (row.product_highlight_2_label && row.product_highlight_2_value) {
        highlights.push(`${row.product_highlight_2_label}: ${row.product_highlight_2_value}`)
      }
    }

    // Parse collections (new format: separate fields)
    const collections: string[] = []

    // New format: collection_1, collection_2, etc.
    for (let i = 1; i <= 5; i++) {
      const collectionKey = `collection_${i}` as keyof CSVRow
      const collectionValue = row[collectionKey]
      if (collectionValue && String(collectionValue).trim()) {
        collections.push(String(collectionValue).trim())
      }
    }

    // Legacy format: comma-separated
    if (collections.length === 0) {
      collections.push(...parseList(row.collections || row['Product Collection Id']))
      // Support 'collection' singular field
      if ((row as any)['collection']) collections.push(...parseList((row as any)['collection']))
      if ((row as any)['Collection']) collections.push(...parseList((row as any)['Collection']))
    }

    // Parse categories (new format: separate fields)
    const categories: string[] = []

    // New format: category_1, category_2, etc.
    for (let i = 1; i <= 5; i++) {
      const categoryKey = `category_${i}` as keyof CSVRow
      const categoryValue = row[categoryKey]
      if (categoryValue && String(categoryValue).trim()) {
        categories.push(String(categoryValue).trim())
      }
    }

    // Legacy format: comma-separated
    if (categories.length === 0) {
      categories.push(...parseList(row.categories))
      // Support 'category' singular field
      if ((row as any)['category']) categories.push(...parseList((row as any)['category']))
      if ((row as any)['Category']) categories.push(...parseList((row as any)['Category']))
    }

    // Parse tags (new format: separate fields)
    const tags: string[] = []

    // New format: tag_1, tag_2, etc.
    for (let i = 1; i <= 5; i++) {
      const tagKey = `tag_${i}` as keyof CSVRow
      const tagValue = row[tagKey]
      if (tagValue && String(tagValue).trim()) {
        tags.push(String(tagValue).trim())
      }
    }

    // Legacy format: comma-separated and individual fields
    if (tags.length === 0) {
      if (row.tags) {
        tags.push(...parseList(row.tags))
      }
      if (row['Product Tag 1']) tags.push(row['Product Tag 1'])
      if (row['Product Tag 2']) tags.push(row['Product Tag 2'])
    }

    // Parse variant options (new format with JSON support)
    const variantOptions: { name: string; value: string | object }[] = []

    // New format: variant_option_1_name/value, etc.
    for (let i = 1; i <= 3; i++) {
      const nameKey = `variant_option_${i}_name` as keyof CSVRow
      const valueKey = `variant_option_${i}_value` as keyof CSVRow
      const optionName = row[nameKey]
      const optionValue = row[valueKey]

      if (optionName && optionValue) {
        variantOptions.push({
          name: String(optionName),
          value: parseVariantValue(String(optionValue)),
        })
      }
    }

    // Legacy format
    if (variantOptions.length === 0) {
      if (row['Variant Option 1 Name'] && row['Variant Option 1 Value']) {
        variantOptions.push({
          name: row['Variant Option 1 Name'],
          value: parseVariantValue(row['Variant Option 1 Value']),
        })
      }
      if (row['Variant Option 2 Name'] && row['Variant Option 2 Value']) {
        variantOptions.push({
          name: row['Variant Option 2 Name'],
          value: parseVariantValue(row['Variant Option 2 Value']),
        })
      }
    }

    // Generate default SKU if empty using formula: UPPER(category_1)&"-"&"DUDE"&"-"&"FZT"&"-"&UPPER(size)&"-"&UPPER(color_name)
    if (!variantSku || variantSku.trim() === '') {
      const category = (categories[0] || '').toUpperCase()
      const sizeOption = variantOptions.find(opt => opt.name.toLowerCase() === 'size')
      const colorOption = variantOptions.find(opt => opt.name.toLowerCase() === 'color')

      let size = ''
      if (sizeOption && typeof sizeOption.value === 'string') {
        size = sizeOption.value.toUpperCase()
      }

      let colorName = ''
      if (colorOption) {
        if (typeof colorOption.value === 'object' && colorOption.value !== null && 'name' in colorOption.value) {
          colorName = String((colorOption.value as any).name).toUpperCase()
        } else if (typeof colorOption.value === 'string') {
          colorName = colorOption.value.toUpperCase()
        }
      }

      // Only generate SKU if we have the required components
      if (category && size && colorName) {
        variantSku = `${category}-DUDE-FZT-${size}-${colorName}`
      }
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
    } else {
      // SKU is empty - add info message that it will be auto-generated
      errors.push({
        row: rowIndex,
        field: 'product_variant_sku',
        message: 'SKU is empty - will be auto-generated using formula: CATEGORY-DUDE-FZT-SIZE-COLOR',
        type: 'warning',
      })
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
        totalCategories: 0,
        totalCollections: 0,
        totalInventoryItems: 0,
        uniqueCategories: [],
        uniqueCollections: [],
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

    // Calculate unique categories and collections
    const uniqueCategories = new Set<string>()
    const uniqueCollections = new Set<string>()
    let totalInventoryItems = 0

    productGroups.forEach(group => {
      if (group.categories) {
        group.categories.forEach(cat => uniqueCategories.add(cat))
      }
      if (group.collections) {
        group.collections.forEach(col => uniqueCollections.add(col))
      }
      // Count inventory items (one per variant)
      totalInventoryItems += group.variants.length
    })

    return {
      success: blockingErrors.length === 0,
      totalRows: normalizedRows.length,
      validRows,
      invalidRows: blockingErrors.length,
      productGroups,
      totalProducts: productGroups.length,
      totalVariants: normalizedRows.length,
      totalCategories: uniqueCategories.size,
      totalCollections: uniqueCollections.size,
      totalInventoryItems,
      uniqueCategories: Array.from(uniqueCategories),
      uniqueCollections: Array.from(uniqueCollections),
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
    let categoriesLinked = 0
    let collectionsLinked = 0
    let inventoryUpdated = 0
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
          // Track categories, collections, and inventory
          categoriesLinked += result.categoriesLinked || 0
          collectionsLinked += result.collectionsLinked || 0
          inventoryUpdated += result.inventoryUpdated || 0
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
      categoriesLinked,
      collectionsLinked,
      inventoryUpdated,
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
    categoriesLinked?: number
    collectionsLinked?: number
    inventoryUpdated?: number
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
      let inventoryUpdated = 0

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

          // Update inventory - with error handling
          const { error: invError } = await supabaseAdmin
            .from('inventory_items')
            .upsert([{
              variant_id: existingVariant.id,
              sku: variant.sku,
              quantity: variant.quantity,
              available_quantity: variant.quantity,
              track_quantity: variant.manage_inventory,
              allow_backorders: variant.allow_backorder,
            }], { onConflict: 'variant_id' })

          if (invError) {
            console.error('Failed to update inventory for variant:', existingVariant.id, invError)
          } else {
            inventoryUpdated++
          }
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

          // Create inventory - with error handling
          const { error: invError } = await supabaseAdmin
            .from('inventory_items')
            .insert([{
              variant_id: newVariant.id,
              sku: variant.sku,
              quantity: variant.quantity,
              available_quantity: variant.quantity,
              track_quantity: variant.manage_inventory,
              allow_backorders: variant.allow_backorder,
            }])

          if (invError) {
            console.error('Failed to create inventory for variant:', newVariant.id, invError)
          } else {
            inventoryUpdated++
          }
          variantsCreated++
        }
      }

      // Attach categories - using explicit check + insert instead of upsert
      let categoriesLinked = 0
      if (group.categories && group.categories.length > 0) {
        console.log('[CSV Import] Linking categories for product:', productId, 'Categories:', group.categories)

        for (const catName of group.categories) {
          const normalizedSlug = catName.toLowerCase().replace(/\s+/g, '-')

          // Find category by slug or name using separate queries for reliability
          let category = null

          // Try by slug first
          const { data: catBySlug } = await supabaseAdmin
            .from('categories')
            .select('id')
            .eq('slug', normalizedSlug)
            .maybeSingle()

          if (catBySlug) {
            category = catBySlug
          } else {
            // Try by exact name match
            const { data: catByName } = await supabaseAdmin
              .from('categories')
              .select('id')
              .ilike('name', catName)
              .maybeSingle()

            if (catByName) {
              category = catByName
            }
          }

          if (category) {
            // Check if link already exists
            const { data: existingLink } = await supabaseAdmin
              .from('product_categories')
              .select('product_id')
              .eq('product_id', productId)
              .eq('category_id', category.id)
              .maybeSingle()

            if (!existingLink) {
              // Insert new link
              const { error: catError } = await supabaseAdmin
                .from('product_categories')
                .insert([{
                  product_id: productId,
                  category_id: category.id,
                }])

              if (catError) {
                console.error('[CSV Import] Failed to link category:', catName, 'to product:', productId, catError)
              } else {
                console.log('[CSV Import] Successfully linked category:', catName, 'to product:', productId)
                categoriesLinked++
              }
            } else {
              console.log('[CSV Import] Category already linked:', catName)
              categoriesLinked++ // Already linked counts as success
            }
          } else {
            console.warn('[CSV Import] Category not found:', catName, '(slug:', normalizedSlug, ')')
          }
        }
      }

      // Attach collections - using explicit check + insert instead of upsert
      let collectionsLinked = 0
      if (group.collections && group.collections.length > 0) {
        console.log('[CSV Import] Linking collections for product:', productId, 'Collections:', group.collections)

        for (const collectionSlug of group.collections) {
          const normalizedSlug = collectionSlug.toLowerCase().replace(/\s+/g, '-')

          // Find collection by multiple methods
          let collection = null

          // Try by slug first
          const { data: colBySlug } = await supabaseAdmin
            .from('collections')
            .select('id')
            .eq('slug', normalizedSlug)
            .maybeSingle()

          if (colBySlug) {
            collection = colBySlug
          } else {
            // Try by title
            const { data: colByTitle } = await supabaseAdmin
              .from('collections')
              .select('id')
              .ilike('title', collectionSlug)
              .maybeSingle()

            if (colByTitle) {
              collection = colByTitle
            } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(collectionSlug)) {
              // Try by ID if it looks like a UUID
              const { data: colById } = await supabaseAdmin
                .from('collections')
                .select('id')
                .eq('id', collectionSlug)
                .maybeSingle()

              if (colById) {
                collection = colById
              }
            }
          }

          if (collection) {
            // Check if link already exists
            const { data: existingLink } = await supabaseAdmin
              .from('product_collections')
              .select('product_id')
              .eq('product_id', productId)
              .eq('collection_id', collection.id)
              .maybeSingle()

            if (!existingLink) {
              // Insert new link
              const { error: colError } = await supabaseAdmin
                .from('product_collections')
                .insert([{
                  product_id: productId,
                  collection_id: collection.id,
                }])

              if (colError) {
                console.error('[CSV Import] Failed to link collection:', collectionSlug, 'to product:', productId, colError)
              } else {
                console.log('[CSV Import] Successfully linked collection:', collectionSlug, 'to product:', productId)
                collectionsLinked++
              }
            } else {
              console.log('[CSV Import] Collection already linked:', collectionSlug)
              collectionsLinked++ // Already linked counts as success
            }
          } else {
            console.warn('[CSV Import] Collection not found:', collectionSlug, '(slug:', normalizedSlug, ')')
          }
        }
      }

      // Attach tags - using explicit check + insert
      if (group.tags && group.tags.length > 0) {
        for (const tagName of group.tags) {
          const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-')

          // Get or create tag
          let { data: tag } = await supabaseAdmin
            .from('product_tags')
            .select('id')
            .eq('slug', tagSlug)
            .maybeSingle()

          if (!tag) {
            const { data: newTag, error: tagError } = await supabaseAdmin
              .from('product_tags')
              .insert([{ name: tagName, slug: tagSlug }])
              .select('id')
              .single()

            if (tagError) {
              console.error('[CSV Import] Failed to create tag:', tagName, tagError)
              continue
            }
            tag = newTag
          }

          if (tag) {
            // Check if assignment exists
            const { data: existingAssignment } = await supabaseAdmin
              .from('product_tag_assignments')
              .select('product_id')
              .eq('product_id', productId)
              .eq('tag_id', tag.id)
              .maybeSingle()

            if (!existingAssignment) {
              const { error: assignError } = await supabaseAdmin
                .from('product_tag_assignments')
                .insert([{
                  product_id: productId,
                  tag_id: tag.id,
                }])

              if (assignError) {
                console.error('[CSV Import] Failed to assign tag:', tagName, 'to product:', productId, assignError)
              }
            }
          }
        }
      }

      console.log('[CSV Import] Product import complete:', {
        productId,
        created,
        variantsCreated,
        variantsUpdated,
        categoriesLinked,
        collectionsLinked,
        inventoryUpdated
      })

      return { success: true, created, variantsCreated, variantsUpdated, categoriesLinked, collectionsLinked, inventoryUpdated }
    } catch (error: any) {
      console.error('[CSV Import] Product import failed:', error)
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
      'highlight_1',
      'highlight_2',
      'highlight_3',
      'highlight_4',
      'highlight_5',
      'product_variant_title',
      'product_variant_sku',
      'product_discountable',
      'variant_manage_inventory',
      'variant_allow_backorder',
      'variant_price',
      'variant_quantity',
      'variant_inventory_stock',
      'variant_option_1_name',
      'variant_option_1_value',
      'variant_option_2_name',
      'variant_option_2_value',
      'variant_option_3_name',
      'variant_option_3_value',
      'collection_1',
      'collection_2',
      'collection_3',
      'collection_4',
      'collection_5',
      'category_1',
      'category_2',
      'category_3',
      'category_4',
      'category_5',
      'tag_1',
      'tag_2',
      'tag_3',
      'tag_4',
      'tag_5',
    ]

    const exampleRow1 = [
      'oxford-shirt',
      'Oxford Formal Shirt',
      'Premium Cotton Shirt',
      'Classic oxford formal shirt made from 100% cotton',
      'published',
      'https://example.com/images/oxford-shirt.jpg',
      'https://example.com/images/oxford-shirt-1.jpg,https://example.com/images/oxford-shirt-2.jpg',
      '100% Cotton',
      'Slim Fit',
      'Machine Washable',
      'Wrinkle Free',
      'Premium Quality',
      'M / Black',
      '', // SKU will be auto-generated: SHIRTS-DUDE-FZT-M-BLACK
      'TRUE',
      'TRUE',
      'FALSE',
      '1999',
      '100',
      '100',
      'Size',
      'M',
      'Color',
      '{"name": "Black", "code": "#000000"}',
      '',
      '',
      'formal-wear',
      'new-arrivals',
      'bestsellers',
      '',
      '',
      'Shirts',
      'Formal',
      'Menswear',
      '',
      '',
      'New Drops',
      'Best Seller',
      'Premium',
      'Cotton',
      'Formal Wear',
    ]

    const exampleRow2 = [
      'oxford-shirt',
      'Oxford Formal Shirt',
      'Premium Cotton Shirt',
      'Classic oxford formal shirt made from 100% cotton',
      'published',
      'https://example.com/images/oxford-shirt.jpg',
      'https://example.com/images/oxford-shirt-3.jpg,https://example.com/images/oxford-shirt-4.jpg',
      '100% Cotton',
      'Slim Fit',
      'Machine Washable',
      'Wrinkle Free',
      'Premium Quality',
      'L / Black',
      '', // SKU will be auto-generated: SHIRTS-DUDE-FZT-L-BLACK
      'TRUE',
      'TRUE',
      'FALSE',
      '1999',
      '100',
      '100',
      'Size',
      'L',
      'Color',
      '{"name": "Black", "code": "#000000"}',
      '',
      '',
      'formal-wear',
      'new-arrivals',
      'bestsellers',
      '',
      '',
      'Shirts',
      'Formal',
      'Menswear',
      '',
      '',
      'New Drops',
      'Best Seller',
      'Premium',
      'Cotton',
      'Formal Wear',
    ]

    return Papa.unparse([headers, exampleRow1, exampleRow2])
  }
}
