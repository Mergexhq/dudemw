'use server'

import { createServerSupabase } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Campaign, CampaignWithDetails, CampaignRule, CampaignAction } from '@/types/database/campaigns'

/**
 * Fetch all campaigns for admin dashboard
 */
export async function getAllCampaigns(): Promise<CampaignWithDetails[]> {
    try {
        const supabase = await createServerSupabase()

        const { data, error } = await (supabase as any)
            .from('campaigns')
            .select(`
                *,
                rules:campaign_rules(*),
                actions:campaign_actions(*)
            `)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching campaigns:', error)
            throw new Error('Failed to fetch campaigns')
        }

        return data as CampaignWithDetails[]
    } catch (err) {
        console.error('Exception fetching campaigns:', err)
        throw new Error('Failed to fetch campaigns')
    }
}

/**
 * Get a single campaign by ID
 */
export async function getCampaign(id: string): Promise<CampaignWithDetails | null> {
    try {
        const supabase = await createServerSupabase()

        const { data, error } = await (supabase as any)
            .from('campaigns')
            .select(`
                *,
                rules:campaign_rules(*),
                actions:campaign_actions(*)
            `)
            .eq('id', id)
            .single()

        if (error) {
            console.error('Error fetching campaign:', error)
            return null
        }

        return data as CampaignWithDetails
    } catch (err) {
        console.error('Exception fetching campaign:', err)
        return null
    }
}

/**
 * Create a new campaign with rules and actions
 */
export async function createCampaign(data: {
    name: string
    description?: string
    status: 'active' | 'inactive' | 'draft'
    priority: number
    start_at: string
    end_at?: string
    apply_type: 'auto' | 'coupon'
    rules: Omit<CampaignRule, 'id' | 'campaign_id' | 'created_at'>[]
    actions: Omit<CampaignAction, 'id' | 'campaign_id' | 'created_at'>[]
}) {
    const supabase = await createServerSupabase()

    // Create campaign
    const { data: campaign, error: campaignError } = await (supabase as any)
        .from('campaigns')
        .insert({
            name: data.name,
            description: data.description,
            status: data.status,
            priority: data.priority,
            start_at: data.start_at,
            end_at: data.end_at,
            apply_type: data.apply_type,
            stackable: false
        })
        .select()
        .single()

    if (campaignError) {
        console.error('Error creating campaign:', campaignError)
        throw new Error('Failed to create campaign')
    }

    // Create rules
    if (data.rules.length > 0) {
        const { error: rulesError } = await (supabase as any)
            .from('campaign_rules')
            .insert(
                data.rules.map((rule: any) => ({
                    campaign_id: campaign.id,
                    rule_type: rule.rule_type,
                    operator: rule.operator,
                    value: rule.value
                }))
            )

        if (rulesError) {
            console.error('Error creating campaign rules:', rulesError)
            // Rollback campaign creation
            await (supabase as any).from('campaigns').delete().eq('id', campaign.id)
            throw new Error('Failed to create campaign rules')
        }
    }

    // Create actions
    if (data.actions.length > 0) {
        const { error: actionsError } = await (supabase as any)
            .from('campaign_actions')
            .insert(
                data.actions.map((action: any) => ({
                    campaign_id: campaign.id,
                    discount_type: action.discount_type,
                    discount_value: action.discount_value,
                    max_discount: action.max_discount,
                    applies_to: action.applies_to
                }))
            )

        if (actionsError) {
            console.error('Error creating campaign actions:', actionsError)
            // Rollback campaign creation
            await (supabase as any).from('campaigns').delete().eq('id', campaign.id)
            throw new Error('Failed to create campaign actions')
        }
    }

    revalidatePath('/admin/campaigns')
    revalidatePath('/(store)', 'layout')

    return { success: true, id: campaign.id }
}

/**
 * Update an existing campaign
 */
export async function updateCampaign(
    id: string,
    data: Partial<Campaign> & {
        rules?: Omit<CampaignRule, 'id' | 'campaign_id' | 'created_at'>[]
        actions?: Omit<CampaignAction, 'id' | 'campaign_id' | 'created_at'>[]
    }
) {
    const supabase = await createServerSupabase()

    // Update campaign
    const { error: campaignError } = await (supabase as any)
        .from('campaigns')
        .update({
            name: data.name,
            description: data.description,
            status: data.status,
            priority: data.priority,
            start_at: data.start_at,
            end_at: data.end_at,
            apply_type: data.apply_type,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)

    if (campaignError) {
        console.error('Error updating campaign:', campaignError)
        throw new Error('Failed to update campaign')
    }

    // Update rules if provided
    if (data.rules) {
        // Delete existing rules
        await (supabase as any).from('campaign_rules').delete().eq('campaign_id', id)

        // Insert new rules
        if (data.rules.length > 0) {
            const { error: rulesError } = await (supabase as any)
                .from('campaign_rules')
                .insert(
                    data.rules.map((rule: any) => ({
                        campaign_id: id,
                        rule_type: rule.rule_type,
                        operator: rule.operator,
                        value: rule.value
                    }))
                )

            if (rulesError) {
                console.error('Error updating campaign rules:', rulesError)
                throw new Error('Failed to update campaign rules')
            }
        }
    }

    // Update actions if provided
    if (data.actions) {
        // Delete existing actions
        await (supabase as any).from('campaign_actions').delete().eq('campaign_id', id)

        // Insert new actions
        if (data.actions.length > 0) {
            const { error: actionsError } = await (supabase as any)
                .from('campaign_actions')
                .insert(
                    data.actions.map((action: any) => ({
                        campaign_id: id,
                        discount_type: action.discount_type,
                        discount_value: action.discount_value,
                        max_discount: action.max_discount,
                        applies_to: action.applies_to
                    }))
                )

            if (actionsError) {
                console.error('Error updating campaign actions:', actionsError)
                throw new Error('Failed to update campaign actions')
            }
        }
    }

    revalidatePath('/admin/campaigns')
    revalidatePath('/(store)', 'layout')

    return { success: true }
}

/**
 * Delete a campaign (cascade deletes rules and actions)
 */
export async function deleteCampaign(id: string) {
    const supabase = await createServerSupabase()

    const { error } = await (supabase as any)
        .from('campaigns')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting campaign:', error)
        throw new Error('Failed to delete campaign')
    }

    revalidatePath('/admin/campaigns')
    revalidatePath('/(store)', 'layout')

    return { success: true }
}

/**
 * Toggle campaign status (activate/deactivate)
 */
export async function toggleCampaignStatus(id: string, status: 'active' | 'inactive') {
    const supabase = await createServerSupabase()

    const { error } = await (supabase as any)
        .from('campaigns')
        .update({
            status,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)

    if (error) {
        console.error('Error toggling campaign status:', error)
        throw new Error('Failed to toggle campaign status')
    }

    revalidatePath('/admin/campaigns')
    revalidatePath('/(store)', 'layout')

    return { success: true }
}

// Alias for getCampaign
export const getCampaignById = getCampaign
