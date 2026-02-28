import { prisma } from '@/lib/db';

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

const ZONE_MAPPING: Record<string, string> = {
    'tamil nadu': 'tamil_nadu',
    'kerala': 'south_india',
    'karnataka': 'south_india',
    'andhra pradesh': 'south_india',
    'telangana': 'south_india',
    'puducherry': 'south_india',
    'default': 'all_india'
};

export function getZoneFromState(state?: string): string {
    if (!state) return 'all_india';
    const normalizedState = state.toLowerCase().trim();
    if (normalizedState === 'tamil nadu' || normalizedState === 'tn' || normalizedState === 'tamilnadu') {
        return 'tamil_nadu';
    }
    return ZONE_MAPPING[normalizedState] || 'all_india';
}

export async function calculateShippingCost(itemCount: number, state?: string): Promise<ShippingCalculationResult> {
    try {
        const zone = getZoneFromState(state);

        const rules = await prisma.shipping_rules.findMany({
            where: {
                zone: { in: [zone, 'all_india'] },
                is_enabled: true,
                min_quantity: { lte: itemCount },
            } as any,
            orderBy: { rate: 'asc' } as any,
        });

        const typedRules = rules as unknown as ShippingRule[];

        if (!typedRules || typedRules.length === 0) {
            console.warn('No matching shipping rules found, using fallback.');
            return { cost: 99, provider: 'Standard' };
        }

        const validRules = typedRules.filter(rule =>
            rule.max_quantity === null || rule.max_quantity >= itemCount
        );

        const bestRule = validRules.sort((a, b) => {
            if (a.zone === zone && b.zone !== zone) return -1;
            if (a.zone !== zone && b.zone === zone) return 1;
            return 0;
        })[0];

        if (!bestRule) return { cost: 99, provider: 'Standard' };

        return {
            cost: bestRule.rate,
            provider: bestRule.provider || 'Standard',
            isFree: bestRule.rate === 0,
        };
    } catch (err) {
        console.error('Shipping calculation failed:', err);
        return { cost: 99, provider: 'Standard' };
    }
}
