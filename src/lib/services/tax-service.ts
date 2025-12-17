/**
 * Tax Service for Indian GST Calculations
 * 
 * This service handles all tax-related calculations for the store.
 * Tax calculation should ONLY happen on the backend - never on frontend.
 * 
 * Key concepts:
 * - CGST: Central GST (half of total GST for intra-state)
 * - SGST: State GST (half of total GST for intra-state)
 * - IGST: Integrated GST (full GST for inter-state)
 * 
 * Source of truth for tax:
 * 1. Product-level GST override
 * 2. Category-level GST override
 * 3. Default GST rate from settings
 * 
 * NOTE: After running the SQL migration in Supabase, regenerate types using:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts
 * Then remove the 'as any' type assertions from this file.
 */

import { createClient } from '@/lib/supabase/client'

export interface TaxSettings {
    id: string
    tax_enabled: boolean
    price_includes_tax: boolean
    default_gst_rate: number
    store_state: string
    gstin: string
}

export interface TaxBreakdown {
    taxable_amount: number
    cgst: number
    sgst: number
    igst: number
    total_tax: number
    gst_rate: number
    tax_type: 'intra-state' | 'inter-state'
    is_tax_inclusive: boolean
}

export interface CartItemForTax {
    variant_id: string
    product_id: string
    category_id?: string
    price: number
    quantity: number
    gst_rate?: number | null // Product-level override
}

export interface OrderTaxRecord {
    order_id: string
    taxable_amount: number
    cgst: number
    sgst: number
    igst: number
    total_tax: number
    gst_rate: number
    tax_type: 'intra-state' | 'inter-state'
    store_state: string
    customer_state: string
    price_includes_tax: boolean
}

/**
 * Get the current tax settings from the database
 */
export async function getTaxSettings(): Promise<TaxSettings | null> {
    const supabase = createClient()

    // Using 'as any' because tax_settings table needs SQL migration first
    const { data, error } = await (supabase as any)
        .from('tax_settings')
        .select('*')
        .limit(1)
        .single()

    if (error || !data) {
        console.error('Failed to fetch tax settings:', error)
        return null
    }

    return data as TaxSettings
}

/**
 * Get category tax rules
 */
export async function getCategoryTaxRules(): Promise<Map<string, number>> {
    const supabase = createClient()

    // Using 'as any' because category_tax_rules table needs SQL migration first
    const { data, error } = await (supabase as any)
        .from('category_tax_rules')
        .select('category_id, gst_rate')

    if (error || !data) {
        console.error('Failed to fetch category tax rules:', error)
        return new Map()
    }

    return new Map((data as Array<{ category_id: string; gst_rate: number }>).map(rule => [rule.category_id, rule.gst_rate]))
}

/**
 * Get product tax override
 */
export async function getProductTaxRate(productId: string): Promise<number | null> {
    const supabase = createClient()

    // Using 'as any' because product_tax_rules table needs SQL migration first
    const { data, error } = await (supabase as any)
        .from('product_tax_rules')
        .select('gst_rate')
        .eq('product_id', productId)
        .single()

    if (error || !data) {
        return null
    }

    return (data as { gst_rate: number }).gst_rate
}

/**
 * Determine the effective GST rate for an item
 * Priority: Product > Category > Default
 */
export async function getEffectiveGstRate(
    item: CartItemForTax,
    taxSettings: TaxSettings,
    categoryRules: Map<string, number>
): Promise<number> {
    // 1. Check product-level override
    if (item.gst_rate !== null && item.gst_rate !== undefined) {
        return item.gst_rate
    }

    // 2. Check category-level override
    if (item.category_id && categoryRules.has(item.category_id)) {
        return categoryRules.get(item.category_id)!
    }

    // 3. Use default rate
    return taxSettings.default_gst_rate
}

/**
 * Determine tax type based on store state and shipping state
 */
export function determineTaxType(
    storeState: string,
    shippingState: string
): 'intra-state' | 'inter-state' {
    // Normalize state names for comparison
    const normalizedStore = storeState.toLowerCase().trim()
    const normalizedShipping = shippingState.toLowerCase().trim()

    return normalizedStore === normalizedShipping ? 'intra-state' : 'inter-state'
}

/**
 * Calculate tax for a single item
 */
export function calculateItemTax(
    price: number,
    quantity: number,
    gstRate: number,
    priceIncludesTax: boolean,
    taxType: 'intra-state' | 'inter-state'
): TaxBreakdown {
    const totalPrice = price * quantity

    let taxableAmount: number
    let totalTax: number

    if (priceIncludesTax) {
        // Price includes GST - extract tax from price
        // Formula: taxable_amount = price / (1 + gst_rate/100)
        taxableAmount = totalPrice / (1 + gstRate / 100)
        totalTax = totalPrice - taxableAmount
    } else {
        // Price excludes GST - add tax on top
        // Formula: tax = price * (gst_rate / 100)
        taxableAmount = totalPrice
        totalTax = totalPrice * (gstRate / 100)
    }

    // Split tax based on tax type
    let cgst = 0
    let sgst = 0
    let igst = 0

    if (taxType === 'intra-state') {
        // Split evenly between CGST and SGST
        cgst = totalTax / 2
        sgst = totalTax / 2
    } else {
        // Full amount as IGST
        igst = totalTax
    }

    return {
        taxable_amount: Math.round(taxableAmount * 100) / 100,
        cgst: Math.round(cgst * 100) / 100,
        sgst: Math.round(sgst * 100) / 100,
        igst: Math.round(igst * 100) / 100,
        total_tax: Math.round(totalTax * 100) / 100,
        gst_rate: gstRate,
        tax_type: taxType,
        is_tax_inclusive: priceIncludesTax
    }
}

/**
 * Calculate tax for entire cart
 */
export async function calculateCartTax(
    items: CartItemForTax[],
    shippingState: string
): Promise<{
    itemTaxes: Map<string, TaxBreakdown>
    totalTax: TaxBreakdown
} | null> {
    // Get tax settings
    const taxSettings = await getTaxSettings()

    if (!taxSettings || !taxSettings.tax_enabled) {
        // Tax is disabled - return zero tax
        const zeroTax: TaxBreakdown = {
            taxable_amount: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
            cgst: 0,
            sgst: 0,
            igst: 0,
            total_tax: 0,
            gst_rate: 0,
            tax_type: 'intra-state',
            is_tax_inclusive: false
        }
        return {
            itemTaxes: new Map(),
            totalTax: zeroTax
        }
    }

    // Get category rules
    const categoryRules = await getCategoryTaxRules()

    // Determine tax type
    const taxType = determineTaxType(taxSettings.store_state, shippingState)

    const itemTaxes = new Map<string, TaxBreakdown>()
    let totalTaxableAmount = 0
    let totalCgst = 0
    let totalSgst = 0
    let totalIgst = 0
    let totalTaxAmount = 0

    // Calculate tax for each item
    for (const item of items) {
        const gstRate = await getEffectiveGstRate(item, taxSettings, categoryRules)
        const itemTax = calculateItemTax(
            item.price,
            item.quantity,
            gstRate,
            taxSettings.price_includes_tax,
            taxType
        )

        itemTaxes.set(item.variant_id, itemTax)

        totalTaxableAmount += itemTax.taxable_amount
        totalCgst += itemTax.cgst
        totalSgst += itemTax.sgst
        totalIgst += itemTax.igst
        totalTaxAmount += itemTax.total_tax
    }

    return {
        itemTaxes,
        totalTax: {
            taxable_amount: Math.round(totalTaxableAmount * 100) / 100,
            cgst: Math.round(totalCgst * 100) / 100,
            sgst: Math.round(totalSgst * 100) / 100,
            igst: Math.round(totalIgst * 100) / 100,
            total_tax: Math.round(totalTaxAmount * 100) / 100,
            gst_rate: taxSettings.default_gst_rate, // Average/default rate for summary
            tax_type: taxType,
            is_tax_inclusive: taxSettings.price_includes_tax
        }
    }
}

/**
 * Save order tax record (IMPORTANT: Legal requirement to lock tax at order time)
 */
export async function saveOrderTaxRecord(
    orderId: string,
    taxBreakdown: TaxBreakdown,
    storeState: string,
    customerState: string
): Promise<boolean> {
    const supabase = createClient()

    const record: OrderTaxRecord = {
        order_id: orderId,
        taxable_amount: taxBreakdown.taxable_amount,
        cgst: taxBreakdown.cgst,
        sgst: taxBreakdown.sgst,
        igst: taxBreakdown.igst,
        total_tax: taxBreakdown.total_tax,
        gst_rate: taxBreakdown.gst_rate,
        tax_type: taxBreakdown.tax_type,
        store_state: storeState,
        customer_state: customerState,
        price_includes_tax: taxBreakdown.is_tax_inclusive
    }

    // Using 'as any' because order_taxes table needs SQL migration first
    const { error } = await (supabase as any)
        .from('order_taxes')
        .insert(record)

    if (error) {
        console.error('Failed to save order tax record:', error)
        return false
    }

    return true
}

/**
 * Get order tax record for display/invoice
 */
export async function getOrderTaxRecord(orderId: string): Promise<OrderTaxRecord | null> {
    const supabase = createClient()

    // Using 'as any' because order_taxes table needs SQL migration first
    const { data, error } = await (supabase as any)
        .from('order_taxes')
        .select('*')
        .eq('order_id', orderId)
        .single()

    if (error || !data) {
        console.error('Failed to fetch order tax record:', error)
        return null
    }

    return data as OrderTaxRecord
}

/**
 * Format tax for display in checkout/invoice
 */
export function formatTaxDisplay(taxBreakdown: TaxBreakdown): {
    lines: Array<{ label: string; amount: number }>
    subtotal: number
    grandTotal: number
} {
    const lines: Array<{ label: string; amount: number }> = []

    if (taxBreakdown.tax_type === 'intra-state') {
        if (taxBreakdown.cgst > 0) {
            lines.push({
                label: `CGST (${taxBreakdown.gst_rate / 2}%)`,
                amount: taxBreakdown.cgst
            })
        }
        if (taxBreakdown.sgst > 0) {
            lines.push({
                label: `SGST (${taxBreakdown.gst_rate / 2}%)`,
                amount: taxBreakdown.sgst
            })
        }
    } else {
        if (taxBreakdown.igst > 0) {
            lines.push({
                label: `IGST (${taxBreakdown.gst_rate}%)`,
                amount: taxBreakdown.igst
            })
        }
    }

    // Calculate totals
    const subtotal = taxBreakdown.taxable_amount
    const grandTotal = taxBreakdown.is_tax_inclusive
        ? taxBreakdown.taxable_amount + taxBreakdown.total_tax
        : taxBreakdown.taxable_amount + taxBreakdown.total_tax

    return { lines, subtotal, grandTotal }
}
