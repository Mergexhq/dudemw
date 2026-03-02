'use server'

import { prisma } from '@/lib/db'

export async function getHomepageSectionsAction() {
    try {
        const sections = await prisma.homepage_sections.findMany({
            where: { is_active: true },
            orderBy: { sort_order: 'asc' } as any
        })
        return { success: true, data: sections }
    } catch (error: any) {
        console.error('Error fetching homepage sections:', error)
        return { success: false, error: error?.message || 'Failed to fetch homepage sections' }
    }
}
