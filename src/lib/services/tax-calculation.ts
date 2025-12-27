/**
 * GST Tax Calculation Service for Dude Menswear
 * 
 * Implements Indian GST (Goods and Services Tax) calculation:
 * - CGST + SGST for intra-state transactions (within Tamil Nadu)
 * - IGST for inter-state transactions (outside Tamil Nadu)
 * 
 * Store Location: Tharamanagalam, Tamil Nadu
 */

import type { TaxType, OrderTaxBreakdown, ItemTaxBreakdown } from '@/types/tax.types';

export interface TaxCalculationInput {
  items: Array<{
    id: string;
    productId: string;
    price: number; // price per unit in rupees
    quantity: number;
    gstRate?: number; // GST rate in percentage (default: 12%)
  }>;
  customerState: string;
  isPriceInclusive?: boolean; // whether price includes tax
  defaultGstRate?: number;
}

export interface TaxCalculationResult {
  success: boolean;
  taxBreakdown: OrderTaxBreakdown;
  error?: string;
}

/**
 * Default GST rate for clothing (18% - as per current Indian GST slab)
 */
export const DEFAULT_GST_RATE = 18;

/**
 * Store state for tax calculation
 */
export const STORE_STATE = 'Tamil Nadu';

/**
 * Normalize state name for comparison
 */
function normalizeStateName(state: string): string {
  return state.trim().toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Determine if transaction is intra-state or inter-state
 */
export function getTaxType(customerState: string): TaxType {
  const normalizedCustomerState = normalizeStateName(customerState);
  const normalizedStoreState = normalizeStateName(STORE_STATE);

  return normalizedCustomerState === normalizedStoreState
    ? 'intra-state'
    : 'inter-state';
}

/**
 * Calculate tax for a single item
 */
function calculateItemTax(
  item: TaxCalculationInput['items'][0],
  taxType: TaxType,
  isPriceInclusive: boolean,
  defaultGstRate: number
): ItemTaxBreakdown {
  const gstRate = item.gstRate || defaultGstRate;
  const itemTotal = item.price * item.quantity;

  let taxableAmount: number;
  let totalTax: number;

  if (isPriceInclusive) {
    // Price includes tax - extract tax amount
    // Formula: Taxable Amount = Total / (1 + GST Rate/100)
    taxableAmount = itemTotal / (1 + gstRate / 100);
    totalTax = itemTotal - taxableAmount;
  } else {
    // Price excludes tax - calculate tax on top
    taxableAmount = itemTotal;
    totalTax = (taxableAmount * gstRate) / 100;
  }

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (taxType === 'intra-state') {
    // Intra-state: Split equally between CGST and SGST
    cgst = totalTax / 2;
    sgst = totalTax / 2;
  } else {
    // Inter-state: Full amount as IGST
    igst = totalTax;
  }

  return {
    variantId: item.id,
    productId: item.productId,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    cgst: Math.round(cgst * 100) / 100,
    sgst: Math.round(sgst * 100) / 100,
    igst: Math.round(igst * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    gstRate,
    taxType
  };
}

/**
 * Calculate GST tax for an order
 */
export function calculateTax(input: TaxCalculationInput): TaxCalculationResult {
  try {
    const { items, customerState, isPriceInclusive = false, defaultGstRate = DEFAULT_GST_RATE } = input;

    // Validate inputs
    if (!items || items.length === 0) {
      return {
        success: false,
        taxBreakdown: {} as OrderTaxBreakdown,
        error: 'No items provided for tax calculation'
      };
    }

    if (!customerState || customerState.trim() === '') {
      return {
        success: false,
        taxBreakdown: {} as OrderTaxBreakdown,
        error: 'Customer state is required for tax calculation'
      };
    }

    // Determine tax type
    const taxType = getTaxType(customerState);

    // Calculate tax for each item
    const itemTaxBreakdowns = items.map(item =>
      calculateItemTax(item, taxType, isPriceInclusive, defaultGstRate)
    );

    // Aggregate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxableAmount = itemTaxBreakdowns.reduce((sum, item) => sum + item.taxableAmount, 0);
    const cgst = itemTaxBreakdowns.reduce((sum, item) => sum + item.cgst, 0);
    const sgst = itemTaxBreakdowns.reduce((sum, item) => sum + item.sgst, 0);
    const igst = itemTaxBreakdowns.reduce((sum, item) => sum + item.igst, 0);
    const totalTax = itemTaxBreakdowns.reduce((sum, item) => sum + item.totalTax, 0);

    const grandTotal = isPriceInclusive ? subtotal : (taxableAmount + totalTax);

    const taxBreakdown: OrderTaxBreakdown = {
      subtotal: Math.round(subtotal * 100) / 100,
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      cgst: Math.round(cgst * 100) / 100,
      sgst: Math.round(sgst * 100) / 100,
      igst: Math.round(igst * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
      taxType,
      storeState: STORE_STATE,
      customerState: customerState.trim(),
      isPriceInclusive,
      items: itemTaxBreakdowns
    };

    return {
      success: true,
      taxBreakdown
    };
  } catch (error) {
    console.error('Tax calculation error:', error);
    return {
      success: false,
      taxBreakdown: {} as OrderTaxBreakdown,
      error: error instanceof Error ? error.message : 'Tax calculation failed'
    };
  }
}

/**
 * Get tax display lines for UI
 */
export function getTaxDisplayLines(taxBreakdown: OrderTaxBreakdown) {
  const lines = [];

  if (taxBreakdown.taxType === 'intra-state') {
    // Show CGST and SGST
    const rate = taxBreakdown.items[0]?.gstRate || DEFAULT_GST_RATE;
    const halfRate = rate / 2;

    if (taxBreakdown.cgst > 0) {
      lines.push({
        label: `CGST (${halfRate}%)`,
        rate: halfRate,
        amount: taxBreakdown.cgst
      });
    }

    if (taxBreakdown.sgst > 0) {
      lines.push({
        label: `SGST (${halfRate}%)`,
        rate: halfRate,
        amount: taxBreakdown.sgst
      });
    }
  } else {
    // Show IGST
    const rate = taxBreakdown.items[0]?.gstRate || DEFAULT_GST_RATE;

    if (taxBreakdown.igst > 0) {
      lines.push({
        label: `IGST (${rate}%)`,
        rate,
        amount: taxBreakdown.igst
      });
    }
  }

  return lines;
}

/**
 * Format tax amount for display
 */
export function formatTaxAmount(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}

/**
 * Get GST invoice number (format: GSTIN/FY/Sequential)
 */
export function generateGSTInvoiceNumber(
  gstin: string,
  sequenceNumber: number
): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Financial year in India: April to March
  const fyStart = month >= 3 ? year : year - 1;
  const fyEnd = (fyStart + 1).toString().slice(-2);
  const fy = `${fyStart}-${fyEnd}`;

  const sequence = sequenceNumber.toString().padStart(6, '0');

  return `${gstin}/${fy}/${sequence}`;
}
