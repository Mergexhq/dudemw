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
 * Processing: 1-2 business days
 * Delivery: 3-7 business days
 */
export function calculateEstimatedDelivery(): string {
  const today = new Date();
  const minDays = 4; // 1 processing + 3 delivery
  const maxDays = 9; // 2 processing + 7 delivery
  
  const estimatedDate = new Date(today);
  estimatedDate.setDate(today.getDate() + maxDays);
  
  const options: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  };
  
  return estimatedDate.toLocaleDateString('en-IN', options);
}

/**
 * Main shipping calculation function
 */
export function calculateShipping(input: ShippingCalculationInput): ShippingCalculationResult {
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

  // Determine if shipping to Tamil Nadu
  const isTN = state 
    ? isTamilNaduState(state) 
    : isTamilNaduPinCode(postalCode);

  // Calculate shipping cost based on location and quantity
  let shippingAmount: number;
  let tierDescription: string;

  if (totalQuantity <= 4) {
    shippingAmount = isTN ? SHIPPING_RATES.TAMIL_NADU.LOW : SHIPPING_RATES.OUTSIDE_TN.LOW;
    tierDescription = '1-4 items';
  } else {
    shippingAmount = isTN ? SHIPPING_RATES.TAMIL_NADU.HIGH : SHIPPING_RATES.OUTSIDE_TN.HIGH;
    tierDescription = '5+ items';
  }

  // Convert to paise
  const amountInPaise = shippingAmount * 100;

  // Generate description
  const locationText = isTN ? 'Tamil Nadu' : 'Pan India';
  const description = `${locationText} Delivery (${tierDescription})`;

  return {
    success: true,
    amount: amountInPaise,
    optionName: 'ST Courier Standard Delivery',
    description,
    isTamilNadu: isTN,
    estimatedDelivery: calculateEstimatedDelivery()
  };
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
