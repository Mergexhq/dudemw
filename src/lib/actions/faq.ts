'use server'

import { createServerSupabase } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface FAQ {
    id: string
    title: string
    question: string
    answer: string
    sort_order: number
    is_published: boolean
    created_at: string
    updated_at: string
}

export async function getAllFAQs() {
    try {
        const supabase = await createServerSupabase()
        const { data, error } = await (supabase
            .from('faqs') as any)
            .select('*')
            .order('sort_order', { ascending: true })

        if (error) throw error

        return { success: true, data: data as unknown as FAQ[] }
    } catch (error: any) {
        console.error('Error fetching FAQs:', error)
        return { success: false, error: error.message }
    }
}

export async function getPublishedFAQs() {
    try {
        const supabase = await createServerSupabase()
        const { data, error } = await (supabase
            .from('faqs') as any)
            .select('*')
            .eq('is_published', true)
            .order('sort_order', { ascending: true })

        if (error) throw error

        return { success: true, data: data as unknown as FAQ[] }
    } catch (error: any) {
        console.error('Error fetching published FAQs:', error)
        return { success: false, error: error.message }
    }
}

export async function createFAQ(input: Omit<FAQ, 'id' | 'created_at' | 'updated_at'>) {
    try {
        const supabase = await createServerSupabase()
        const { data, error } = await (supabase
            .from('faqs') as any)
            .insert(input)
            .select()
            .single()

        if (error) throw error

        revalidatePath('/admin/settings/cms')
        revalidatePath('/faq')

        return { success: true, data: data as unknown as FAQ }
    } catch (error: any) {
        console.error('Error creating FAQ:', error)
        return { success: false, error: error.message }
    }
}

export async function updateFAQ(id: string, input: Partial<Omit<FAQ, 'id' | 'created_at' | 'updated_at'>>) {
    try {
        const supabase = await createServerSupabase()
        const { data, error } = await (supabase
            .from('faqs') as any)
            .update(input)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        revalidatePath('/admin/settings/cms')
        revalidatePath('/faq')

        return { success: true, data: data as unknown as FAQ }
    } catch (error: any) {
        console.error('Error updating FAQ:', error)
        return { success: false, error: error.message }
    }
}

export async function deleteFAQ(id: string) {
    try {
        const supabase = await createServerSupabase()
        const { error } = await (supabase
            .from('faqs') as any)
            .delete()
            .eq('id', id)

        if (error) throw error

        revalidatePath('/admin/settings/cms')
        revalidatePath('/faq')

        return { success: true }
    } catch (error: any) {
        console.error('Error deleting FAQ:', error)
        return { success: false, error: error.message }
    }
}

export async function reorderFAQs(orderedIds: string[]) {
    try {
        const supabase = await createServerSupabase()

        // Update sort_order for each FAQ
        const updates = orderedIds.map((id, index) =>
            (supabase
                .from('faqs') as any)
                .update({ sort_order: index + 1 })
                .eq('id', id)
        )

        await Promise.all(updates)

        revalidatePath('/admin/settings/cms')
        revalidatePath('/faq')

        return { success: true }
    } catch (error: any) {
        console.error('Error reordering FAQs:', error)
        return { success: false, error: error.message }
    }
}
