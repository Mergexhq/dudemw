import { supabaseAdmin } from '@/lib/supabase/supabase';

export interface ShippingRule {
    id: string;
    zone: string;
    provider: string;
    min_quantity: number;
    max_quantity: number | null;
    rate: number;
    is_enabled: boolean;
}

export interface ShippingCalculationResult {
    cost: number;
    provider: string;
    isFree?: boolean;
}

/**
 * Valid states for Indian zones mapping
 * This is a simplified mapping. In a real scenario, this might need to be more robust or fetched from DB.
 */
const ZONE_MAPPING: Record<string, string> = {
    // South
    'tamil nadu': 'tamil_nadu',
    'kerala': 'south_india',
    'karnataka': 'south_india',
    'andhra pradesh': 'south_india',
    'telangana': 'south_india',
    'puducherry': 'south_india',

    // Default fallback for others if not explicitly mapped
    'default': 'all_india'
};

/**
 * Get zone from state name
 */
export function getZoneFromState(state?: string): string {
    if (!state) return 'all_india';

    const normalizedState = state.toLowerCase().trim();

    // Direct check for Tamil Nadu
    if (normalizedState === 'tamil nadu' || normalizedState === 'tn' || normalizedState === 'tamilnadu') {
        return 'tamil_nadu';
    }

    // Check simple mapping (can be expanded)
    return ZONE_MAPPING[normalizedState] || 'all_india';
}

/**
 * Calculate shipping cost based on item count and zone (derived from state)
 */
export async function calculateShippingCost(
    itemCount: number,
    state?: string
): Promise<ShippingCalculationResult> {
    try {
        const zone = getZoneFromState(state);

        // Fetch applicable rules for the zone (or all_india as fallback)
        // We fetch rules for specific zone AND all_india to find the best match
        const { data: rules, error } = await supabaseAdmin
            .from('shipping_rules')
            .select('*')
            .in('zone', [zone, 'all_india'])
            .eq('is_enabled', true)
            .lte('min_quantity', itemCount)
            .order('rate', { ascending: true }); // Get cheapest applicable rate? Or based on priority?

        if (error) {
            console.error('Error fetching shipping rules:', error);
            throw error;
        }

        const typedRules = rules as unknown as ShippingRule[];

        if (!typedRules || typedRules.length === 0) {
            // Fallback if no rules found
            console.warn('No matching shipping rules found, using fallback.');
            return { cost: 99, provider: 'Standard' }; // Default fallback
        }

        // Filter rules where max_quantity is satisfied (if it exists)
        const validRules = typedRules.filter(rule =>
            rule.max_quantity === null || rule.max_quantity >= itemCount
        );

        // Prioritize specific zone rules over 'all_india'
        // Sort by:
        // 1. Zone match (exact zone > all_india)
        // 2. Specificity (higher min_quantity implies more specific tier usually, but here we just want a valid rule)

        const bestRule = validRules.sort((a, b) => {
            // If a is exact zone match and b is not, a comes first
            if (a.zone === zone && b.zone !== zone) return -1;
            if (a.zone !== zone && b.zone === zone) return 1;
            return 0;
        })[0];

        if (!bestRule) {
            return { cost: 99, provider: 'Standard' };
        }

        return {
            cost: bestRule.rate,
            provider: bestRule.provider || 'Standard',
            isFree: bestRule.rate === 0
        };

    } catch (err) {
        console.error('Shipping calculation failed:', err);
        return { cost: 99, provider: 'Standard' }; // Safe fallback
    }
}
