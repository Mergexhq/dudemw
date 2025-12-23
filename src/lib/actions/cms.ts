'use server'

import { createServerSupabase } from '@/lib/supabase/server'
import { createPublicServerSupabase } from '@/lib/supabase/server-public'
import { revalidatePath } from 'next/cache'

export type CMSPage = {
    id: string
    slug: string
    title: string
    content: string
    is_published: boolean
    created_at: string
    updated_at: string
}

export async function getCMSPages() {
    const supabase = await createServerSupabase()

    const { data, error } = await supabase
        .from('cms_pages')
        .select('*')
        .order('title', { ascending: true })

    if (error) {
        console.error('Error fetching CMS pages:', error)
        throw new Error('Failed to fetch CMS pages')
    }

    return data as CMSPage[]
}

export async function getCMSPage(slug: string) {
    try {
        console.log('[getCMSPage] Fetching CMS page:', slug)
        // Use public client for static generation (no cookies required)
        const supabase = createPublicServerSupabase()

        const { data, error } = await supabase
            .from('cms_pages')
            .select('*')
            .eq('slug', slug)
            .single()

        if (error) {
            console.error(`[getCMSPage] Error fetching CMS page ${slug}:`, error)
            return null
        }

        console.log('[getCMSPage] Successfully fetched:', slug, 'published:', data?.is_published)
        return data as CMSPage
    } catch (err) {
        console.error(`[getCMSPage] Exception fetching ${slug}:`, err)
        return null
    }
}

export async function updateCMSPage(slug: string, data: Partial<CMSPage>) {
    const supabase = await createServerSupabase()

    const { error } = await supabase
        .from('cms_pages')
        .update({
            ...data,
            updated_at: new Date().toISOString()
        })
        .eq('slug', slug)

    if (error) {
        console.error(`Error updating CMS page ${slug}:`, error)
        throw new Error('Failed to update CMS page')
    }

    revalidatePath('/admin/settings/cms')
    revalidatePath(`/admin/settings/cms/${slug}`)
    revalidatePath(`/(store)/${slug === 'about-us' ? 'about' : slug === 'shipping-policy' ? 'shipping' : slug}`, 'page')

    return { success: true }
}
