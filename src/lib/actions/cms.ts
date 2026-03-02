'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { serializePrisma } from '@/lib/utils/prisma-utils'

export type CMSPage = {
    id: string
    slug: string
    title: string
    content: string
    is_published: boolean
    created_at: string
    updated_at: string
}

export type FAQ = {
    id: string
    title: string
    question: string
    answer: string
    sort_order: number
    is_published: boolean
}

export async function getCMSPages() {
    const data = await prisma.cms_pages.findMany({ orderBy: { title: 'asc' } as any }) as any[]
    return serializePrisma(data) as CMSPage[]
}

export async function getCMSPage(slug: string) {
    try {
        const data = await prisma.cms_pages.findFirst({ where: { slug } as any }) as any
        return serializePrisma(data) as CMSPage | null
    } catch (err) {
        console.error(`[getCMSPage] Exception fetching ${slug}:`, err)
        return null
    }
}

export async function updateCMSPage(slug: string, data: Partial<CMSPage>) {
    await prisma.cms_pages.updateMany({
        where: { slug } as any,
        data: { ...data, updated_at: new Date() } as any,
    })

    revalidatePath('/admin/settings/cms')
    revalidatePath(`/admin/settings/cms/${slug}`)
    revalidatePath(`/(store)/${slug === 'about-us' ? 'about' : slug === 'shipping-policy' ? 'shipping' : slug}`, 'page')

    return { success: true }
}

export async function getFAQs() {
    try {
        const data = await prisma.faqs.findMany({
            where: { is_published: true } as any,
            orderBy: { sort_order: 'asc' } as any,
        }) as any[]
        return serializePrisma(data) as FAQ[]
    } catch (error) {
        console.error('Error fetching FAQs:', error)
        return []
    }
}
