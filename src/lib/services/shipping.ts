/**
 * Shipping Calculation Service for Dude Menswear
 * 
 * Implements PIN code-based shipping calculation with tiered pricing:
 * - Tamil Nadu: ₹60 (1-4 items), ₹120 (5+ items)
 * - Outside TN: ₹100 (1-4 items), ₹150 (5+ items)
 * 
 * Shipping Partner: ST Courier
 * Processing Time: 1-2 business days
 * Delivery Time: 3-7 business days
 */

export interface ShippingCalculationInput {
  postalCode: string;
  state?: string;
  totalQuantity: number;
}

export interface ShippingCalculationResult {
  success: boolean;
  amount: number; // in paise (₹1 = 100 paise)
  optionName: string;
  description: string;
  isTamilNadu: boolean;
  estimatedDelivery: string;
  error?: string;
}

/**
 * Tamil Nadu PIN code ranges
 * TN PIN codes start with 6 (600001-643253)
 */
const TAMIL_NADU_PIN_PREFIXES = ['60', '61', '62', '63', '64'];

/**
 * Store location for reference
 */
export const STORE_LOCATION = {
  city: 'Tharamanagalam',
  state: 'Tamil Nadu',
  pinCode: '638656'
};

/**
 * Shipping rates in rupees (will be converted to paise)
 */
export const SHIPPING_RATES = {
  TAMIL_NADU: {
    LOW: 60,   // 1-4 items
    HIGH: 120  // 5+ items
  },
  OUTSIDE_TN: {
    LOW: 100,  // 1-4 items
    HIGH: 150  // 5+ items
  }
} as const;

/**
 * Validate Indian PIN code format
 */
export function isValidPinCode(pinCode: string): boolean {
  // Indian PIN codes are 6 digits
  const pinRegex = /^[1-9][0-9]{5}$/;
  return pinRegex.test(pinCode.trim());
}

/**
 * Check if PIN code is in Tamil Nadu
 */
export function isTamilNaduPinCode(pinCode: string): boolean {
  const cleanPinCode = pinCode.trim();
  const firstTwoDigits = cleanPinCode.substring(0, 2);
  return TAMIL_NADU_PIN_PREFIXES.includes(firstTwoDigits);
}

/**
 * Check if state is Tamil Nadu
 */
export function isTamilNaduState(state: string): boolean {
  const normalizedState = state.trim().toLowerCase();
  return normalizedState === 'tamil nadu' ||
    normalizedState === 'tamilnadu' ||
    normalizedState === 'tn';
}

/**
 * Calculate estimated delivery date
 * Uses configurable delivery days from system preferences
 * @param maxDays - Maximum delivery days (defaults to 7 if not provided)
 */
export function calculateEstimatedDelivery(maxDays: number = 7): string {
  const today = new Date();

  const estimatedDate = new Date(today);
  estimatedDate.setDate(today.getDate() + maxDays);

  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  };

  return estimatedDate.toLocaleDateString('en-IN', options);
}

/**
 * Fetch estimated delivery date using system preferences
 * Reads min_delivery_days and max_delivery_days from system_preferences table
 */
export async function getEstimatedDeliveryFromPreferences(): Promise<string> {
  try {
    const { data: prefs } = await supabaseAdmin
      .from('system_preferences')
      .select('min_delivery_days, max_delivery_days')
      .single();

    const maxDays = prefs?.max_delivery_days ?? 7;
    return calculateEstimatedDelivery(maxDays);
  } catch (error) {
    console.error('Error fetching delivery preferences:', error);
    // Fallback to 7 days
    return calculateEstimatedDelivery(7);
  }
}

/**
 * Main shipping calculation function
 */
import { supabaseAdmin } from '@/lib/supabase/supabase';
import { ShippingRule } from '@/lib/types/settings';

/**
 * Valid states for Indian zones
 */
const SOUTH_INDIA_STATES = [
  'andhra pradesh', 'karnataka', 'kerala', 'telangana', 'puducherry', 'lakshadweep'
];

const NORTH_INDIA_STATES = [
  'delhi', 'punjab', 'haryana', 'uttar pradesh', 'himachal pradesh',
  'jammu and kashmir', 'uttarakhand', 'ladakh', 'rajasthan', 'madhya pradesh', 'chandigarh'
];

const EAST_INDIA_STATES = [
  'west bengal', 'odisha', 'bihar', 'jharkhand', 'assam', 'sikkim',
  'nagaland', 'manipur', 'mizoram', 'tripura', 'meghalaya', 'arunachal pradesh', 'andaman and nicobar islands'
];

const WEST_INDIA_STATES = [
  'maharashtra', 'gujarat', 'goa', 'dadra and nagar haveli and daman and diu', 'chhattisgarh'
];

/**
 * Determine zone from state
 */
export function getZoneFromState(state: string): ShippingRule['zone'] {
  const normState = state.toLowerCase().trim();

  if (isTamilNaduState(normState)) return 'tamil_nadu';
  if (SOUTH_INDIA_STATES.includes(normState)) return 'south_india';
  if (NORTH_INDIA_STATES.includes(normState)) return 'north_india';
  if (EAST_INDIA_STATES.includes(normState)) return 'east_india';
  if (WEST_INDIA_STATES.includes(normState)) return 'west_india';

  return 'all_india';
}

/**
 * Main shipping calculation function
 */
export async function calculateShipping(input: ShippingCalculationInput): Promise<ShippingCalculationResult> {
  const { postalCode, state, totalQuantity } = input;

  // Validate PIN code format
  if (!isValidPinCode(postalCode)) {
    return {
      success: false,
      amount: 0,
      optionName: 'Invalid PIN Code',
      description: 'Please enter a valid 6-digit Indian PIN code',
      isTamilNadu: false,
      estimatedDelivery: '',
      error: 'Invalid PIN code format'
    };
  }

  try {
    // 1. Check for free shipping preference and delivery days
    const { data: prefs } = await supabaseAdmin
      .from('system_preferences')
      .select('free_shipping_enabled, free_shipping_threshold, min_delivery_days, max_delivery_days')
      .single();

    // Get max delivery days for estimated delivery calculation
    const maxDeliveryDays = prefs?.max_delivery_days ?? 7;

    // Note: We can't apply free shipping here easily because we don't have the cart total, 
    // only quantity. For now, we'll let the frontend handle free shipping logic based 
    // on cart total if needed, or we rely on rules.

    // 2. Determine Zone
    // If state is provided, use it. If not, default to 'all_india' or try to infer (hard with just PIN)
    const zone = state ? getZoneFromState(state) : 'all_india';

    // 3. Fetch applicable rule
    // We look for a rule that matches the zone and quantity
    // Priority: Specific Zone > All India
    // Matches: min_quantity <= totalQuantity AND (max_quantity >= totalQuantity OR max_quantity IS NULL)

    // Fetch rules for specific zone AND all_india
    const { data: rules, error } = await supabaseAdmin
      .from('shipping_rules')
      .select('*')
      .in('zone', [zone, 'all_india'])
      .eq('is_enabled', true)
      .lte('min_quantity', totalQuantity);

    if (error) throw error;

    // Filter rules that match the max_quantity criteria (in-memory filtering because of NULL handling)
    const validRules = rules?.filter(rule =>
      rule.max_quantity === null || rule.max_quantity >= totalQuantity
    ) || [];

    // Find best match:
    // 1. Prefer specific zone over 'all_india'
    // 2. Prefer higher min_quantity (more specific tier)
    validRules.sort((a, b) => {
      // Priority 1: Zone specificity
      if (a.zone === zone && b.zone !== zone) return -1;
      if (a.zone !== zone && b.zone === zone) return 1;

      // Priority 2: Higher min_quantity is more specific
      return (b.min_quantity ?? 0) - (a.min_quantity ?? 0);
    });

    const matchedRule = validRules[0];

    if (!matchedRule) {
      console.warn(`No shipping rule found for Zone: ${zone}, Qty: ${totalQuantity}`);
      return {
        success: false,
        amount: 0,
        optionName: 'Shipping Unavailable',
        description: 'No shipping rule configured for this location/quantity',
        isTamilNadu: zone === 'tamil_nadu',
        estimatedDelivery: '',
        error: 'Shipping calculation failed: No matching rule found.'
      };
    }

    // Convert to paise
    const amountInPaise = matchedRule.rate * 100;

    // Generate description
    const isTN = zone === 'tamil_nadu';
    const locationText = isTN ? 'Tamil Nadu' : 'Standard';
    const description = `${locationText} Delivery (${totalQuantity} item${totalQuantity > 1 ? 's' : ''})`;

    return {
      success: true,
      amount: amountInPaise,
      optionName: 'ST Courier Standard Delivery',
      description,
      isTamilNadu: isTN,
      estimatedDelivery: calculateEstimatedDelivery(maxDeliveryDays)
    };

  } catch (err) {
    console.error('Database shipping calculation failed:', err);
    // Fallback logic
    return {
      success: true,
      amount: 15000, // ₹150 fallback
      optionName: 'Standard Delivery',
      description: 'Standard Delivery (Fallback)',
      isTamilNadu: false,
      estimatedDelivery: calculateEstimatedDelivery()
    };
  }
}

/**
 * Get shipping rates info (for display purposes)
 */
export function getShippingRatesInfo() {
  return {
    tamilNadu: {
      low: {
        items: '1-4 items',
        rate: SHIPPING_RATES.TAMIL_NADU.LOW,
        rateInPaise: SHIPPING_RATES.TAMIL_NADU.LOW * 100
      },
      high: {
        items: '5+ items',
        rate: SHIPPING_RATES.TAMIL_NADU.HIGH,
        rateInPaise: SHIPPING_RATES.TAMIL_NADU.HIGH * 100
      }
    },
    outsideTN: {
      low: {
        items: '1-4 items',
        rate: SHIPPING_RATES.OUTSIDE_TN.LOW,
        rateInPaise: SHIPPING_RATES.OUTSIDE_TN.LOW * 100
      },
      high: {
        items: '5+ items',
        rate: SHIPPING_RATES.OUTSIDE_TN.HIGH,
        rateInPaise: SHIPPING_RATES.OUTSIDE_TN.HIGH * 100
      }
    },
    courier: 'ST Courier',
    processingTime: '1-2 business days',
    deliveryTime: '3-7 business days'
  };
}
