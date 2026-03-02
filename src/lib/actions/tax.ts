"use server"

import { prisma } from "@/lib/db"
import { serializePrisma } from "@/lib/utils/prisma-utils"

export async function getTaxCategories() {
    try {
        const cats = await prisma.categories.findMany({
            select: { id: true, name: true },
            orderBy: { name: 'asc' }
        })
        return { success: true, data: serializePrisma(cats) }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getCategoryTaxRules() {
    try {
        const rules = await prisma.category_tax_rules.findMany({
            select: {
                id: true,
                category_id: true,
                gst_rate: true,
                categories: { select: { name: true } }
            }
        })
        return {
            success: true,
            data: serializePrisma(rules.map((r: any) => ({
                id: r.id,
                category_id: r.category_id,
                category_name: r.categories?.name || 'Unknown',
                gst_rate: r.gst_rate
            })))
        }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function createCategoryTaxRule(data: { category_id: string; gst_rate: number }) {
    try {
        const rule = await prisma.category_tax_rules.create({
            data: {
                category_id: data.category_id,
                gst_rate: data.gst_rate
            },
            select: {
                id: true,
                category_id: true,
                gst_rate: true,
                categories: { select: { name: true } }
            }
        })

        return {
            success: true,
            data: serializePrisma({
                id: rule.id,
                category_id: rule.category_id,
                category_name: (rule as any).categories?.name || 'Unknown',
                gst_rate: rule.gst_rate
            })
        }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function updateCategoryTaxRule(id: string, gst_rate: number) {
    try {
        await prisma.category_tax_rules.update({
            where: { id },
            data: { gst_rate }
        })
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteCategoryTaxRule(id: string) {
    try {
        await prisma.category_tax_rules.delete({
            where: { id }
        })
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
