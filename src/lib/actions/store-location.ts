"use server"

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { serializePrisma } from '@/lib/utils/prisma-utils'

export interface StoreLocation {
    id: string
    name: string
    address_line1: string
    address_line2: string | null
    city: string
    state: string
    pincode: string
    country: string
    email: string | null
    phone: string | null
    latitude: number | null
    longitude: number | null
    is_primary: boolean
    is_active: boolean
}

export async function getPrimaryStoreLocation() {
    try {
        const data = await prisma.store_locations.findFirst({
            where: { is_primary: true, is_active: true }
        })
        return { success: true, data: serializePrisma(data) }
    } catch (error: any) {
        return { success: false, error: error.message, data: null }
    }
}

export async function getAllStoreLocations() {
    try {
        const data = await prisma.store_locations.findMany({
            where: { is_active: true },
            orderBy: { is_primary: 'desc' }
        })
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message, data: [] }
    }
}

export async function updateStoreLocation(id: string, updates: Partial<StoreLocation>) {
    try {
        const { id: _id, ...rest } = updates as any
        const data = await prisma.store_locations.update({
            where: { id },
            data: { ...rest, updated_at: new Date() }
        })

        revalidatePath('/')
        revalidatePath('/stores')
        revalidatePath('/admin/settings/general')

        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
