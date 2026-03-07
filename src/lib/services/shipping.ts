/**
 * Shipping Calculation Service for Dude Menswear
 *
 * All shipping rates, option names, and estimated delivery days are
 * fetched from the database (shipping_rules, system_preferences).
 *
 * The ONLY hardcoded value is the ₹100 emergency fallback when the
 * database is completely unreachable.
 */

import { prisma } from '@/lib/db';
import { ShippingRule } from '@/lib/types/settings';

// ─── Single emergency fallback ────────────────────────────────────────────────
const EMERGENCY_FALLBACK_RATE_RUPEES = 100; // ₹100 — used only when DB is unreachable

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ShippingCalculationInput {
  postalCode: string;
  state?: string;
  totalQuantity: number;
}

export interface ShippingCalculationResult {
  success: boolean;
  amount: number;      // in paise (₹1 = 100 paise)
  optionName: string;
  description: string;
  isTamilNadu: boolean;
  estimatedDelivery: string;
  error?: string;
}

// ─── Zone mapping ─────────────────────────────────────────────────────────────

const SOUTH_INDIA_STATES = [
  'andhra pradesh', 'karnataka', 'kerala', 'telangana', 'puducherry', 'lakshadweep'
];

const NORTH_INDIA_STATES = [
  'delhi', 'punjab', 'haryana', 'uttar pradesh', 'himachal pradesh',
  'jammu and kashmir', 'uttarakhand', 'ladakh', 'rajasthan', 'madhya pradesh', 'chandigarh'
];

const EAST_INDIA_STATES = [
  'west bengal', 'odisha', 'bihar', 'jharkhand', 'assam', 'sikkim',
  'nagaland', 'manipur', 'mizoram', 'tripura', 'meghalaya', 'arunachal pradesh',
  'andaman and nicobar islands'
];

const WEST_INDIA_STATES = [
  'maharashtra', 'gujarat', 'goa', 'dadra and nagar haveli and daman and diu', 'chhattisgarh'
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Validate Indian PIN code format (6 digits, first digit non-zero)
 */
export function isValidPinCode(pinCode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pinCode.trim());
}

/**
 * Check if state is Tamil Nadu
 */
export function isTamilNaduState(state: string): boolean {
  const norm = state.trim().toLowerCase();
  return norm === 'tamil nadu' || norm === 'tamilnadu' || norm === 'tn';
}

/**
 * Determine shipping zone from state name
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
 * Build an estimated delivery string from min/max days sourced from DB.
 * Returns empty string if no days are configured.
 */
export function calculateEstimatedDelivery(
  minDays?: number | null,
  maxDays?: number | null
): string {
  if (!minDays && !maxDays) return '';

  const daysToAdd = maxDays || minDays;
  if (!daysToAdd) return '';

  const estimated = new Date();
  estimated.setDate(estimated.getDate() + daysToAdd);

  return estimated.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Calculate shipping cost for an order.
 *
 * Resolution order:
 * 1. Fetch shipping_rules from DB filtered by zone + quantity
 * 2. Pick best-matching rule (zone-specific > all_india, higher min_qty preferred)
 * 3. Read estimated delivery from system_preferences (min_delivery_days / max_delivery_days)
 * 4. If no rule matches  → return success:false with a clear message
 * 5. If DB is unreachable → return success:true with ₹100 emergency fallback
 */
export async function calculateShipping(
  input: ShippingCalculationInput
): Promise<ShippingCalculationResult> {
  const { postalCode, state, totalQuantity } = input;

  // ── Validate PIN format ──────────────────────────────────────────
  if (!isValidPinCode(postalCode)) {
    return {
      success: false,
      amount: 0,
      optionName: 'Invalid PIN Code',
      description: 'Please enter a valid 6-digit Indian PIN code',
      isTamilNadu: false,
      estimatedDelivery: '',
      error: 'Invalid PIN code format',
    };
  }

  try {
    // ── 1. Fetch system preferences (delivery days only — no hardcoded days) ──
    const prefs = await prisma.system_preferences.findFirst({
      select: {
        min_delivery_days: true,
        max_delivery_days: true,
      } as any,
    }) as { min_delivery_days: number | null; max_delivery_days: number | null } | null;

    // ── 2. Determine zone ────────────────────────────────────────────
    const zone: ShippingRule['zone'] = state ? getZoneFromState(state) : 'all_india';
    const isTN = zone === 'tamil_nadu';

    // ── 3. Fetch matching rules from DB ──────────────────────────────
    const rules = await prisma.shipping_rules.findMany({
      where: {
        zone: { in: [zone, 'all_india'] },
        is_enabled: true,
        min_quantity: { lte: totalQuantity },
      } as any,
    });

    // Filter rules where max_quantity is null (unlimited) or covers our qty
    const validRules = (rules ?? []).filter(
      (rule: any) => rule.max_quantity === null || rule.max_quantity >= totalQuantity
    );

    // Sort: specific zone first, then higher min_quantity (more precise tier)
    validRules.sort((a: any, b: any) => {
      if (a.zone === zone && b.zone !== zone) return -1;
      if (a.zone !== zone && b.zone === zone) return 1;
      return (b.min_quantity ?? 0) - (a.min_quantity ?? 0);
    });

    const matchedRule = validRules[0] as any | undefined;

    // ── 4. No matching rule → return descriptive failure ─────────────
    if (!matchedRule) {
      console.warn(
        `[Shipping] No rule for zone="${zone}", qty=${totalQuantity}. ` +
        'Please configure shipping rules in the admin panel.'
      );
      return {
        success: false,
        amount: 0,
        optionName: 'Shipping Unavailable',
        description: 'No shipping option available for this location/quantity',
        isTamilNadu: isTN,
        estimatedDelivery: '',
        error: `No shipping rule configured for zone "${zone}" with quantity ${totalQuantity}. Please set up shipping rules in the admin panel.`,
      };
    }

    // ── 5. Build successful result fully from DB ──────────────────────
    const amountInPaise = Math.round(Number(matchedRule.rate) * 100);

    // optionName comes from the rule; fall back to a generic label only if blank
    const optionName: string =
      matchedRule.name?.trim() || matchedRule.option_name?.trim() || 'Standard Delivery';

    // Description: use rule description if set, else construct one
    const locationLabel = isTN ? 'Tamil Nadu' : 'Standard';
    const description: string =
      matchedRule.description?.trim() ||
      `${locationLabel} Delivery – ${totalQuantity} item${totalQuantity > 1 ? 's' : ''}`;

    const estimatedDelivery = calculateEstimatedDelivery(
      prefs?.min_delivery_days,
      prefs?.max_delivery_days
    );

    return {
      success: true,
      amount: amountInPaise,
      optionName,
      description,
      isTamilNadu: isTN,
      estimatedDelivery,
    };

  } catch (err) {
    // ── Emergency fallback — DB completely unreachable ─────────────────
    console.error('[Shipping] Database error during shipping calculation:', err);

    // Try to at least get delivery days for a better UX
    let estimatedDelivery = '';
    try {
      const fallbackPrefs = await prisma.system_preferences.findFirst({
        select: { min_delivery_days: true, max_delivery_days: true } as any,
      }) as { min_delivery_days: number | null; max_delivery_days: number | null } | null;
      estimatedDelivery = calculateEstimatedDelivery(
        fallbackPrefs?.min_delivery_days,
        fallbackPrefs?.max_delivery_days
      );
    } catch { /* silently ignore */ }

    return {
      success: true,
      amount: EMERGENCY_FALLBACK_RATE_RUPEES * 100, // ₹100 in paise
      optionName: 'Standard Delivery',
      description: 'Standard Delivery',
      isTamilNadu: false,
      estimatedDelivery,
    };
  }
}
