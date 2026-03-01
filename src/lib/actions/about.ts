"use server"

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { AboutFeature, AboutStat } from '@/types/database'

// ============= ABOUT FEATURES =============

export async function getAllAboutFeatures() {
    try {
        const data = await prisma.about_features.findMany({
            orderBy: { sort_order: 'asc' }
        })
        return { success: true, data: data as unknown as AboutFeature[] }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function createAboutFeature(feature: {
    title: string
    description: string
    icon_name: string
    sort_order?: number
}) {
    try {
        const data = await prisma.about_features.create({ data: feature })

        revalidatePath('/admin/settings/cms/about')
        revalidatePath('/about')

        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function updateAboutFeature(id: string, updates: {
    title?: string
    description?: string
    icon_name?: string
    is_active?: boolean
}) {
    try {
        const data = await prisma.about_features.update({
            where: { id },
            data: { ...updates, updated_at: new Date() }
        })

        revalidatePath('/admin/settings/cms/about')
        revalidatePath('/about')

        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteAboutFeature(id: string) {
    try {
        await prisma.about_features.delete({ where: { id } })

        revalidatePath('/admin/settings/cms/about')
        revalidatePath('/about')

        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function reorderAboutFeatures(orderedIds: string[]) {
    try {
        await Promise.all(
            orderedIds.map((id, index) =>
                prisma.about_features.update({
                    where: { id },
                    data: { sort_order: index + 1 }
                })
            )
        )

        revalidatePath('/admin/settings/cms/about')
        revalidatePath('/about')

        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// ============= ABOUT STATS =============

export async function getAllAboutStats() {
    try {
        const data = await prisma.about_stats.findMany({
            orderBy: { sort_order: 'asc' }
        })
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function createAboutStat(stat: {
    value: string
    label: string
    sort_order?: number
}) {
    try {
        const data = await prisma.about_stats.create({ data: stat })

        revalidatePath('/admin/settings/cms/about')
        revalidatePath('/about')

        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function updateAboutStat(id: string, updates: {
    value?: string
    label?: string
    is_active?: boolean
}) {
    try {
        const data = await prisma.about_stats.update({
            where: { id },
            data: { ...updates, updated_at: new Date() }
        })

        revalidatePath('/admin/settings/cms/about')
        revalidatePath('/about')

        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteAboutStat(id: string) {
    try {
        await prisma.about_stats.delete({ where: { id } })

        revalidatePath('/admin/settings/cms/about')
        revalidatePath('/about')

        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function reorderAboutStats(orderedIds: string[]) {
    try {
        await Promise.all(
            orderedIds.map((id, index) =>
                prisma.about_stats.update({
                    where: { id },
                    data: { sort_order: index + 1 }
                })
            )
        )

        revalidatePath('/admin/settings/cms/about')
        revalidatePath('/about')

        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
