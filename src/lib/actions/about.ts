"use server"

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'
import { AboutFeature, AboutStat } from '@/types/database'

// ============= ABOUT FEATURES =============

export async function getAllAboutFeatures() {
    try {
        const { data, error } = await supabase
            .from('about_features')
            .select('*')
            .order('sort_order', { ascending: true })

        if (error) throw error
        return { success: true, data: data as AboutFeature[] }
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
        const { data, error } = await supabase
            .from('about_features')
            .insert(feature)
            .select()
            .single()

        if (error) throw error

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
        const { data, error } = await supabase
            .from('about_features')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        revalidatePath('/admin/settings/cms/about')
        revalidatePath('/about')

        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteAboutFeature(id: string) {
    try {
        const { error } = await supabase
            .from('about_features')
            .delete()
            .eq('id', id)

        if (error) throw error

        revalidatePath('/admin/settings/cms/about')
        revalidatePath('/about')

        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function reorderAboutFeatures(orderedIds: string[]) {
    try {
        const updates = orderedIds.map((id, index) =>
            supabase
                .from('about_features')
                .update({ sort_order: index + 1 })
                .eq('id', id)
        )

        await Promise.all(updates)

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
        const { data, error } = await supabase
            .from('about_stats')
            .select('*')
            .order('sort_order', { ascending: true })

        if (error) throw error
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
        const { data, error } = await supabase
            .from('about_stats')
            .insert(stat)
            .select()
            .single()

        if (error) throw error

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
        const { data, error } = await supabase
            .from('about_stats')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        revalidatePath('/admin/settings/cms/about')
        revalidatePath('/about')

        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteAboutStat(id: string) {
    try {
        const { error } = await supabase
            .from('about_stats')
            .delete()
            .eq('id', id)

        if (error) throw error

        revalidatePath('/admin/settings/cms/about')
        revalidatePath('/about')

        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function reorderAboutStats(orderedIds: string[]) {
    try {
        const updates = orderedIds.map((id, index) =>
            supabase
                .from('about_stats')
                .update({ sort_order: index + 1 })
                .eq('id', id)
        )

        await Promise.all(updates)

        revalidatePath('/admin/settings/cms/about')
        revalidatePath('/about')

        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
