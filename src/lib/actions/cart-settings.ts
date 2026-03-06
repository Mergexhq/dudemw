'use server'

import { prisma } from '@/lib/db'

export interface CartSettings {
    taxEnabled: boolean
    priceIncludesTax: boolean
    defaultGstRate: number
    shippingRules: Array<{
        id: string
        zone: string
        minQuantity: number
        maxQuantity: number | null
        rate: number
        isEnabled: boolean
    }>
}

/**
 * Fetches tax and shipping settings from the DB for use in the cart.
 * This avoids hardcoded values and always reflects admin configuration.
 */
export async function getCartSettings(): Promise<{ success: boolean; data?: CartSettings; error?: string }> {
    try {
        const [taxSettings, shippingRules] = await Promise.all([
            prisma.tax_settings.findFirst(),
            prisma.shipping_rules.findMany({
                where: { is_enabled: true, is_active: true },
                orderBy: [{ zone: 'asc' }, { min_quantity: 'asc' }] as any,
            }),
        ])

        return {
            success: true,
            data: {
                taxEnabled: taxSettings ? Boolean((taxSettings as any).tax_enabled) : false,
                priceIncludesTax: taxSettings ? Boolean((taxSettings as any).price_includes_tax) : true,
                defaultGstRate: taxSettings ? Number((taxSettings as any).default_gst_rate ?? 18) : 18,
                shippingRules: shippingRules.map((rule: any) => ({
                    id: rule.id,
                    zone: rule.zone,
                    minQuantity: rule.min_quantity ?? 1,
                    maxQuantity: rule.max_quantity ?? null,
                    rate: Number(rule.rate ?? 0),
                    isEnabled: Boolean(rule.is_enabled),
                })),
            },
        }
    } catch (error: any) {
        console.error('Error fetching cart settings:', error?.message)
        return { success: false, error: 'Failed to fetch cart settings' }
    }
}
