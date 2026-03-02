'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { WhyDudeFeature } from '@/types/database'
import { serializePrisma } from '@/lib/utils/prisma-utils'

export async function getWhyDudeFeatures(): Promise<WhyDudeFeature[]> {
    try {
        const data = await prisma.why_dude_sections.findMany({
            where: { is_active: true } as any,
            orderBy: { sort_order: 'asc' } as any,
        }) as any[]
        return data as WhyDudeFeature[]
    } catch (err) {
        console.error('Exception fetching Why Dude features:', err)
        return []
    }
}

export async function getAllWhyDudeFeatures(): Promise<WhyDudeFeature[]> {
    try {
        const data = await prisma.why_dude_sections.findMany({
            orderBy: { sort_order: 'asc' } as any,
        }) as any[]
        return data as WhyDudeFeature[]
    } catch (err) {
        console.error('Exception fetching all Why Dude features:', err)
        throw new Error('Failed to fetch Why Dude features')
    }
}

export async function createWhyDudeFeature(data: { title: string; description: string; icon_name: string; sort_order?: number }) {
    await prisma.why_dude_sections.create({
        data: { ...data, sort_order: data.sort_order || 0, is_active: true } as any,
    })
    revalidatePath('/admin/settings/cms/why-dude')
    revalidatePath('/(store)')
    return { success: true }
}

export async function updateWhyDudeFeature(id: string, data: Partial<WhyDudeFeature>) {
    await prisma.why_dude_sections.update({
        where: { id } as any,
        data: { ...data, updated_at: new Date() } as any,
    })
    revalidatePath('/admin/settings/cms/why-dude')
    revalidatePath('/(store)')
    return { success: true }
}

export async function deleteWhyDudeFeature(id: string) {
    await prisma.why_dude_sections.delete({ where: { id } as any })
    revalidatePath('/admin/settings/cms/why-dude')
    revalidatePath('/(store)')
    return { success: true }
}

export async function reorderWhyDudeFeatures(features: { id: string; sort_order: number }[]) {
    await prisma.$transaction(
        features.map(feature =>
            (prisma.why_dude_sections as any).update({
                where: { id: feature.id },
                data: { sort_order: feature.sort_order, updated_at: new Date() },
            })
        )
    )
    revalidatePath('/admin/settings/cms/why-dude')
    revalidatePath('/(store)')
    return { success: true }
}