'use server'

import { prisma } from '@/lib/db'
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
        const data = await prisma.faqs.findMany({ orderBy: { sort_order: 'asc' } as any }) as any[]
        return { success: true, data: data as FAQ[] }
    } catch (error: any) {
        console.error('Error fetching FAQs:', error)
        return { success: false, error: error.message }
    }
}

export async function getPublishedFAQs() {
    try {
        const data = await prisma.faqs.findMany({
            where: { is_published: true } as any,
            orderBy: { sort_order: 'asc' } as any,
        }) as any[]
        return { success: true, data: data as FAQ[] }
    } catch (error: any) {
        console.error('Error fetching published FAQs:', error)
        return { success: false, error: error.message }
    }
}

export async function createFAQ(input: Omit<FAQ, 'id' | 'created_at' | 'updated_at'>) {
    try {
        const data = await prisma.faqs.create({ data: input as any }) as any
        revalidatePath('/admin/settings/cms')
        revalidatePath('/faq')
        return { success: true, data: data as FAQ }
    } catch (error: any) {
        console.error('Error creating FAQ:', error)
        return { success: false, error: error.message }
    }
}

export async function updateFAQ(id: string, input: Partial<Omit<FAQ, 'id' | 'created_at' | 'updated_at'>>) {
    try {
        const data = await prisma.faqs.update({ where: { id } as any, data: input as any }) as any
        revalidatePath('/admin/settings/cms')
        revalidatePath('/faq')
        return { success: true, data: data as FAQ }
    } catch (error: any) {
        console.error('Error updating FAQ:', error)
        return { success: false, error: error.message }
    }
}

export async function deleteFAQ(id: string) {
    try {
        await prisma.faqs.delete({ where: { id } as any })
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
        await prisma.$transaction(
            orderedIds.map((id, index) =>
                (prisma.faqs as any).update({ where: { id }, data: { sort_order: index + 1 } })
            )
        )
        revalidatePath('/admin/settings/cms')
        revalidatePath('/faq')
        return { success: true }
    } catch (error: any) {
        console.error('Error reordering FAQs:', error)
        return { success: false, error: error.message }
    }
}
