/**
 * Tax-related TypeScript types for Indian GST
 * 
 * These types extend the auto-generated Supabase types
 * and should be used throughout the application for tax calculations.
 * 
 * NOTE: After running the SQL migration, regenerate database.types.ts
 * using: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts
 */

// ============================================
// Database Table Types (matching Supabase schema)
// ============================================

export interface TaxSettingsRow {
    id: string
    tax_enabled: boolean
    price_includes_tax: boolean
    default_gst_rate: number
    store_state: string
    gstin: string | null
    created_at: string
    updated_at: string
}

export interface TaxSettingsInsert {
    id?: string
    tax_enabled?: boolean
    price_includes_tax?: boolean
    default_gst_rate?: number
    store_state?: string
    gstin?: string | null
    created_at?: string
    updated_at?: string
}

export interface TaxSettingsUpdate {
    id?: string
    tax_enabled?: boolean
    price_includes_tax?: boolean
    default_gst_rate?: number
    store_state?: string
    gstin?: string | null
    updated_at?: string
}

export interface CategoryTaxRuleRow {
    id: string
    category_id: string
    gst_rate: number
    created_at: string
    updated_at: string
}

export interface CategoryTaxRuleInsert {
    id?: string
    category_id: string
    gst_rate: number
    created_at?: string
    updated_at?: string
}

export interface CategoryTaxRuleUpdate {
    id?: string
    category_id?: string
    gst_rate?: number
    updated_at?: string
}

export interface ProductTaxRuleRow {
    id: string
    product_id: string
    gst_rate: number
    created_at: string
    updated_at: string
}

export interface ProductTaxRuleInsert {
    id?: string
    product_id: string
    gst_rate: number
    created_at?: string
    updated_at?: string
}

export interface ProductTaxRuleUpdate {
    id?: string
    product_id?: string
    gst_rate?: number
    updated_at?: string
}

export type TaxType = 'intra-state' | 'inter-state'

export interface OrderTaxRow {
    id: string
    order_id: string
    taxable_amount: number
    cgst: number
    sgst: number
    igst: number
    total_tax: number
    gst_rate: number
    tax_type: TaxType
    store_state: string
    customer_state: string
    price_includes_tax: boolean
    created_at: string
}

export interface OrderTaxInsert {
    id?: string
    order_id: string
    taxable_amount: number
    cgst?: number
    sgst?: number
    igst?: number
    total_tax: number
    gst_rate: number
    tax_type: TaxType
    store_state: string
    customer_state: string
    price_includes_tax?: boolean
    created_at?: string
}

// ============================================
// Application Types (for use in components/services)
// ============================================

/**
 * Tax calculation result for a single item
 */
export interface ItemTaxBreakdown {
    variantId: string
    productId: string
    taxableAmount: number
    cgst: number
    sgst: number
    igst: number
    totalTax: number
    gstRate: number
    taxType: TaxType
}

/**
 * Complete tax calculation for an order
 */
export interface OrderTaxBreakdown {
    subtotal: number
    taxableAmount: number
    cgst: number
    sgst: number
    igst: number
    totalTax: number
    grandTotal: number
    taxType: TaxType
    storeState: string
    customerState: string
    isPriceInclusive: boolean
    items: ItemTaxBreakdown[]
}

/**
 * Tax display line for UI
 */
export interface TaxDisplayLine {
    label: string
    rate: number
    amount: number
}

/**
 * Tax invoice data for GST-compliant invoices
 */
export interface TaxInvoiceData {
    invoiceNumber: string
    invoiceDate: string
    gstin: string
    storeState: string
    customerState: string
    taxType: TaxType
    items: Array<{
        description: string
        hsnCode?: string
        quantity: number
        unitPrice: number
        taxableValue: number
        cgstRate?: number
        cgstAmount?: number
        sgstRate?: number
        sgstAmount?: number
        igstRate?: number
        igstAmount?: number
        totalAmount: number
    }>
    totals: {
        taxableValue: number
        cgst: number
        sgst: number
        igst: number
        totalTax: number
        grandTotal: number
    }
}

// ============================================
// Constants
// ============================================

/**
 * Standard GST rates in India
 */
export const GST_RATES = [0, 5, 12, 18, 28] as const
export type GstRate = typeof GST_RATES[number]

/**
 * All Indian states and union territories
 */
export const INDIAN_STATES = [
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
    'Andaman and Nicobar Islands',
    'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi',
    'Jammu and Kashmir',
    'Ladakh',
    'Lakshadweep',
    'Puducherry'
] as const

export type IndianState = typeof INDIAN_STATES[number]

/**
 * State codes for GST (first 2 digits of GSTIN)
 */
export const STATE_CODES: Record<IndianState, string> = {
    'Andhra Pradesh': '37',
    'Arunachal Pradesh': '12',
    'Assam': '18',
    'Bihar': '10',
    'Chhattisgarh': '22',
    'Goa': '30',
    'Gujarat': '24',
    'Haryana': '06',
    'Himachal Pradesh': '02',
    'Jharkhand': '20',
    'Karnataka': '29',
    'Kerala': '32',
    'Madhya Pradesh': '23',
    'Maharashtra': '27',
    'Manipur': '14',
    'Meghalaya': '17',
    'Mizoram': '15',
    'Nagaland': '13',
    'Odisha': '21',
    'Punjab': '03',
    'Rajasthan': '08',
    'Sikkim': '11',
    'Tamil Nadu': '33',
    'Telangana': '36',
    'Tripura': '16',
    'Uttar Pradesh': '09',
    'Uttarakhand': '05',
    'West Bengal': '19',
    'Andaman and Nicobar Islands': '35',
    'Chandigarh': '04',
    'Dadra and Nagar Haveli and Daman and Diu': '26',
    'Delhi': '07',
    'Jammu and Kashmir': '01',
    'Ladakh': '38',
    'Lakshadweep': '31',
    'Puducherry': '34'
}

/**
 * Validate GSTIN format
 */
export function isValidGstin(gstin: string): boolean {
    // GSTIN format: 2 digit state code + 10 digit PAN + 1 digit entity code + 1 digit check + 1 alphanumeric
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    return gstinRegex.test(gstin.toUpperCase())
}

/**
 * Extract state code from GSTIN
 */
export function getStateFromGstin(gstin: string): IndianState | null {
    if (!gstin || gstin.length < 2) return null

    const stateCode = gstin.substring(0, 2)
    const entry = Object.entries(STATE_CODES).find(([, code]) => code === stateCode)

    return entry ? entry[0] as IndianState : null
}
