import { createPublicServerSupabase } from '@/lib/supabase/server-public'
import { CampaignWithDetails, CartData, AppliedCampaign, CampaignAction } from '@/types/database/campaigns'
import { evaluateRule } from './campaign-rules'

/**
 * Fetch all active campaigns within current date range
 */
export async function getActiveCampaigns(): Promise<CampaignWithDetails[]> {
    try {
        const supabase = createPublicServerSupabase()
        const now = new Date().toISOString()

        console.log('Fetching active campaigns at:', now)

        const { data: campaigns, error } = await (supabase as any)
            .from('campaigns')
            .select(`
                *,
                rules:campaign_rules(*),
                actions:campaign_actions(*)
            `)
            .eq('status', 'active')
            .lte('start_at', now)
            .or(`end_at.is.null,end_at.gte.${now}`)
            .order('priority', { ascending: false })

        if (error) {
            console.error('Error fetching active campaigns:', error)
            return []
        }

        console.log(`Found ${campaigns?.length || 0} active campaigns:`, campaigns?.map(c => ({
            id: c.id,
            name: c.name,
            status: c.status,
            start_at: c.start_at,
            end_at: c.end_at,
            priority: c.priority,
            rulesCount: c.rules?.length || 0,
            actionsCount: c.actions?.length || 0
        })))

        return campaigns as CampaignWithDetails[]
    } catch (err) {
        console.error('Exception fetching active campaigns:', err)
        return []
    }
}

/**
 * Check if ALL rules of a campaign match the cart
 * Rules are ANDed together
 */
export function evaluateCampaignRules(campaign: CampaignWithDetails, cart: CartData): boolean {
    if (!campaign.rules || campaign.rules.length === 0) {
        return false // Campaign must have at least one rule
    }

    return campaign.rules.every(rule => evaluateRule(rule, cart))
}

/**
 * Calculate discount amount based on action and cart
 * Returns total discount and optionally per-item breakdown
 */
export function calculateDiscount(
    action: CampaignAction,
    cart: CartData
): { totalDiscount: number; itemDiscounts?: Record<string, number> } {

    // Per-item discount mode
    if (action.applies_to === 'items') {
        const itemDiscounts: Record<string, number> = {}
        let totalDiscount = 0

        for (const item of cart.items) {
            let perItemDiscount = 0

            if (action.discount_type === 'flat') {
                // Flat discount per item × quantity
                perItemDiscount = action.discount_value * item.quantity
            } else if (action.discount_type === 'percentage') {
                // Percentage of item price × quantity
                perItemDiscount = (item.price * item.quantity * action.discount_value) / 100

                // Apply max cap per item if specified
                if (action.max_discount) {
                    const maxPerItem = action.max_discount * item.quantity
                    perItemDiscount = Math.min(perItemDiscount, maxPerItem)
                }
            }

            itemDiscounts[item.id] = perItemDiscount
            totalDiscount += perItemDiscount
        }

        // Ensure total doesn't exceed cart subtotal
        return {
            totalDiscount: Math.min(totalDiscount, cart.subtotal),
            itemDiscounts
        }
    }

    // Cart-level discount mode (existing behavior)
    let discount = 0

    if (action.discount_type === 'flat') {
        discount = action.discount_value
    } else if (action.discount_type === 'percentage') {
        discount = (cart.subtotal * action.discount_value) / 100

        // Apply max discount cap if specified
        if (action.max_discount && discount > action.max_discount) {
            discount = action.max_discount
        }
    }

    // Ensure discount doesn't exceed cart total
    return { totalDiscount: Math.min(discount, cart.subtotal) }
}

/**
 * Find the best eligible campaign for the cart
 * Returns highest priority campaign that matches all rules
 */
export async function findBestCampaign(cart: CartData): Promise<AppliedCampaign | null> {
    if (!cart.items || cart.items.length === 0) {
        console.log('No items in cart, skipping campaign evaluation')
        return null
    }

    const activeCampaigns = await getActiveCampaigns()
    console.log(`Found ${activeCampaigns.length} active campaigns`)

    // Filter campaigns where ALL rules match
    const eligibleCampaigns = activeCampaigns.filter(campaign => {
        const isEligible = evaluateCampaignRules(campaign, cart)
        console.log(`Campaign "${campaign.name}" eligible:`, isEligible, {
            rules: campaign.rules,
            cartItemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
            cartSubtotal: cart.subtotal
        })
        return isEligible
    })

    console.log(`${eligibleCampaigns.length} eligible campaigns after rule matching`)

    if (eligibleCampaigns.length === 0) {
        return null
    }

    // Campaigns are already sorted by priority (descending)
    // Take the first (highest priority) eligible campaign
    const bestCampaign = eligibleCampaigns[0]
    const action = bestCampaign.actions[0] // Assume one action per campaign for now

    if (!action) {
        console.log('No action found for best campaign')
        return null
    }

    const discountResult = calculateDiscount(action, cart)

    console.log(`Applied campaign "${bestCampaign.name}" with discount: ₹${discountResult.totalDiscount}`)

    return {
        id: bestCampaign.id,
        name: bestCampaign.name,
        discount: discountResult.totalDiscount,
        discountType: action.discount_type,
        appliesTo: action.applies_to,
        itemDiscounts: discountResult.itemDiscounts
    }
}

/**
 * Check if cart is close to qualifying for a campaign
 * Used for upsell messaging: "Add 1 more item to save ₹200"
 */
export async function findNearestCampaign(cart: CartData): Promise<{
    campaign: CampaignWithDetails
    itemsNeeded?: number
    amountNeeded?: number
} | null> {
    const activeCampaigns = await getActiveCampaigns()

    for (const campaign of activeCampaigns) {
        // Only check min_items campaigns for now
        const minItemsRule = campaign.rules.find(r => r.rule_type === 'min_items')

        if (minItemsRule) {
            const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0)
            const requiredCount = minItemsRule.value.count as number

            if (totalItems < requiredCount && totalItems >= requiredCount - 2) {
                return {
                    campaign,
                    itemsNeeded: requiredCount - totalItems
                }
            }
        }
    }

    return null
}
