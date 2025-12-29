'use server'

import { createServerSupabase } from '@/lib/supabase/server'
import { createPublicServerSupabase } from '@/lib/supabase/server-public'
import { revalidatePath } from 'next/cache'
import { WhyDudeFeature } from '@/types/database'

export async function getWhyDudeFeatures(): Promise<WhyDudeFeature[]> {
    try {
        // Use public client for static generation
        const supabase = createPublicServerSupabase()

        const { data, error } = await supabase
            .from('why_dude_sections')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true })

        if (error) {
            console.error('Error fetching Why Dude features:', error)
            return []
        }

        return data as WhyDudeFeature[]
    } catch (err) {
        console.error('Exception fetching Why Dude features:', err)
        return []
    }
}

export async function getAllWhyDudeFeatures(): Promise<WhyDudeFeature[]> {
    try {
        const supabase = await createServerSupabase()

        const { data, error } = await supabase
            .from('why_dude_sections')
            .select('*')
            .order('sort_order', { ascending: true })

        if (error) {
            console.error('Error fetching all Why Dude features:', error)
            throw new Error('Failed to fetch Why Dude features')
        }

        return data as WhyDudeFeature[]
    } catch (err) {
        console.error('Exception fetching all Why Dude features:', err)
        throw new Error('Failed to fetch Why Dude features')
    }
}

export async function createWhyDudeFeature(data: {
    title: string
    description: string
    icon_name: string
    sort_order?: number
}) {
    const supabase = await createServerSupabase()

    const { error } = await supabase
        .from('why_dude_sections')
        .insert({
            ...data,
            sort_order: data.sort_order || 0,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })

    if (error) {
        console.error('Error creating Why Dude feature:', error)
        throw new Error('Failed to create Why Dude feature')
    }

    revalidatePath('/admin/settings/cms/why-dude')
    revalidatePath('/(store)')

    return { success: true }
}

export async function updateWhyDudeFeature(id: string, data: Partial<WhyDudeFeature>) {
    const supabase = await createServerSupabase()

    const { error } = await supabase
        .from('why_dude_sections')
        .update({
            ...data,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)

    if (error) {
        console.error(`Error updating Why Dude feature ${id}:`, error)
        throw new Error('Failed to update Why Dude feature')
    }

    revalidatePath('/admin/settings/cms/why-dude')
    revalidatePath('/(store)')

    return { success: true }
}

export async function deleteWhyDudeFeature(id: string) {
    const supabase = await createServerSupabase()

    const { error } = await supabase
        .from('why_dude_sections')
        .delete()
        .eq('id', id)

    if (error) {
        console.error(`Error deleting Why Dude feature ${id}:`, error)
        throw new Error('Failed to delete Why Dude feature')
    }

    revalidatePath('/admin/settings/cms/why-dude')
    revalidatePath('/(store)')

    return { success: true }
}

export async function reorderWhyDudeFeatures(features: { id: string; sort_order: number }[]) {
    const supabase = await createServerSupabase()

    const updates = features.map(feature =>
        supabase
            .from('why_dude_sections')
            .update({
                sort_order: feature.sort_order,
                updated_at: new Date().toISOString()
            })
            .eq('id', feature.id)
    )

    const results = await Promise.all(updates)

    const hasError = results.some(result => result.error)
    if (hasError) {
        console.error('Error reordering Why Dude features')
        throw new Error('Failed to reorder Why Dude features')
    }

    revalidatePath('/admin/settings/cms/why-dude')
    revalidatePath('/(store)')

    return { success: true }
}