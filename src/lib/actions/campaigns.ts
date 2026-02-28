'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { Campaign, CampaignWithDetails, CampaignRule, CampaignAction } from '@/types/database/campaigns'

export async function getAllCampaigns(): Promise<CampaignWithDetails[]> {
    try {
        const data = await prisma.campaigns.findMany({
            include: { campaign_rules: true, campaign_actions: true } as any,
            orderBy: { created_at: 'desc' } as any,
        }) as any[]
        return data.map((c: any) => ({ ...c, rules: c.campaign_rules, actions: c.campaign_actions })) as CampaignWithDetails[]
    } catch (err) {
        console.error('Exception fetching campaigns:', err)
        throw new Error('Failed to fetch campaigns')
    }
}

export async function getCampaign(id: string): Promise<CampaignWithDetails | null> {
    try {
        const data = await prisma.campaigns.findUnique({
            where: { id } as any,
            include: { campaign_rules: true, campaign_actions: true } as any,
        }) as any
        if (!data) return null
        return { ...data, rules: data.campaign_rules, actions: data.campaign_actions } as CampaignWithDetails
    } catch (err) {
        console.error('Exception fetching campaign:', err)
        return null
    }
}

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
    const campaign = await prisma.campaigns.create({
        data: {
            name: data.name,
            description: data.description,
            status: data.status,
            priority: data.priority,
            start_at: data.start_at,
            end_at: data.end_at,
            apply_type: data.apply_type,
            stackable: false,
        } as any,
    }) as any

    try {
        if (data.rules.length > 0) {
            await prisma.campaign_rules.createMany({
                data: data.rules.map((rule: any) => ({ campaign_id: campaign.id, rule_type: rule.rule_type, operator: rule.operator, value: rule.value })) as any,
            })
        }
        if (data.actions.length > 0) {
            await prisma.campaign_actions.createMany({
                data: data.actions.map((action: any) => ({ campaign_id: campaign.id, discount_type: action.discount_type, discount_value: action.discount_value, max_discount: action.max_discount, applies_to: action.applies_to })) as any,
            })
        }
    } catch (err) {
        await prisma.campaigns.delete({ where: { id: campaign.id } as any }).catch(() => { })
        throw new Error('Failed to create campaign rules/actions')
    }

    revalidatePath('/admin/campaigns')
    revalidatePath('/(store)', 'layout')
    return { success: true, id: campaign.id }
}

export async function updateCampaign(
    id: string,
    data: Partial<Campaign> & {
        rules?: Omit<CampaignRule, 'id' | 'campaign_id' | 'created_at'>[]
        actions?: Omit<CampaignAction, 'id' | 'campaign_id' | 'created_at'>[]
    }
) {
    await prisma.campaigns.update({
        where: { id } as any,
        data: { name: data.name, description: data.description, status: data.status, priority: data.priority, start_at: data.start_at, end_at: data.end_at, apply_type: data.apply_type, updated_at: new Date() } as any,
    })

    if (data.rules) {
        await prisma.campaign_rules.deleteMany({ where: { campaign_id: id } as any })
        if (data.rules.length > 0) {
            await prisma.campaign_rules.createMany({
                data: data.rules.map((rule: any) => ({ campaign_id: id, rule_type: rule.rule_type, operator: rule.operator, value: rule.value })) as any,
            })
        }
    }

    if (data.actions) {
        await prisma.campaign_actions.deleteMany({ where: { campaign_id: id } as any })
        if (data.actions.length > 0) {
            await prisma.campaign_actions.createMany({
                data: data.actions.map((action: any) => ({ campaign_id: id, discount_type: action.discount_type, discount_value: action.discount_value, max_discount: action.max_discount, applies_to: action.applies_to })) as any,
            })
        }
    }

    revalidatePath('/admin/campaigns')
    revalidatePath('/(store)', 'layout')
    return { success: true }
}

export async function deleteCampaign(id: string) {
    await prisma.campaigns.delete({ where: { id } as any })
    revalidatePath('/admin/campaigns')
    revalidatePath('/(store)', 'layout')
    return { success: true }
}

export async function toggleCampaignStatus(id: string, status: 'active' | 'inactive') {
    await prisma.campaigns.update({ where: { id } as any, data: { status, updated_at: new Date() } as any })
    revalidatePath('/admin/campaigns')
    revalidatePath('/(store)', 'layout')
    return { success: true }
}

export const getCampaignById = getCampaign
