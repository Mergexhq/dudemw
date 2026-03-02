'use server'

import { prisma } from '@/lib/db'
import { serializePrisma } from '@/lib/utils/prisma-utils'

export async function getAddressesAction(userId: string) {
    try {
        const data = await prisma.addresses.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' }
        })
        return { success: true, data: serializePrisma(data) }
    } catch (error: any) {
        console.error('Error fetching addresses:', error)
        return { success: false, error: error?.message || 'Failed to fetch addresses' }
    }
}

export async function addAddressAction(userId: string, addressData: {
    name: string
    phone: string
    address_line1: string
    address_line2?: string | null
    city: string
    state: string
    pincode: string
    is_default?: boolean
}) {
    try {
        const data = await prisma.addresses.create({
            data: {
                user_id: userId,
                name: addressData.name,
                phone: addressData.phone,
                address_line1: addressData.address_line1,
                address_line2: addressData.address_line2 || null,
                city: addressData.city,
                state: addressData.state,
                pincode: addressData.pincode,
                is_default: addressData.is_default || false,
            }
        })
        return { success: true, data: serializePrisma(data) }
    } catch (error: any) {
        console.error('Error adding address:', error)
        return { success: false, error: error?.message || 'Failed to add address' }
    }
}

export async function updateAddressAction(addressId: string, userId: string, addressData: {
    name: string
    phone: string
    address_line1: string
    address_line2?: string | null
    city: string
    state: string
    pincode: string
}) {
    try {
        const data = await prisma.addresses.update({
            where: { id: addressId, user_id: userId },
            data: {
                name: addressData.name,
                phone: addressData.phone,
                address_line1: addressData.address_line1,
                address_line2: addressData.address_line2 || null,
                city: addressData.city,
                state: addressData.state,
                pincode: addressData.pincode,
                updated_at: new Date(),
            }
        })
        return { success: true, data: serializePrisma(data) }
    } catch (error: any) {
        console.error('Error updating address:', error)
        return { success: false, error: error?.message || 'Failed to update address' }
    }
}

export async function setDefaultAddressAction(addressId: string, userId: string) {
    try {
        // Unset all defaults for this user
        await prisma.addresses.updateMany({
            where: { user_id: userId },
            data: { is_default: false }
        })
        // Set the new default
        await prisma.addresses.update({
            where: { id: addressId, user_id: userId },
            data: { is_default: true }
        })
        return { success: true }
    } catch (error: any) {
        console.error('Error setting default address:', error)
        return { success: false, error: error?.message || 'Failed to set default address' }
    }
}

export async function deleteAddressAction(addressId: string, userId: string) {
    try {
        await prisma.addresses.delete({
            where: { id: addressId, user_id: userId }
        })
        return { success: true }
    } catch (error: any) {
        console.error('Error deleting address:', error)
        return { success: false, error: error?.message || 'Failed to delete address' }
    }
}
