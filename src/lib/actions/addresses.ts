'use server'

import { prisma } from '@/lib/db'
import { serializePrisma } from '@/lib/utils/prisma-utils'

/**
 * Helper to resolve a Clerk user ID (or legacy Supabase UUID) to our internal customer UUID.
 *
 * Resolution order:
 * 1. Clerk ID (user_xxx)  → look up customers.auth_user_id
 * 2. UUID                  → try as direct customer.id first, then as a legacy auth_user_id
 *                           (needed for pre-migration Supabase users whose auth UUID was stored
 *                           as auth_user_id before the Clerk migration)
 */
async function resolveCustomerId(userId: string): Promise<string | null> {
    if (!userId) return null;

    // Clerk IDs start with 'user_'
    if (userId.startsWith('user_')) {
        const customer = await prisma.customers.findFirst({
            where: { auth_user_id: userId },
            select: { id: true },
        });
        return customer?.id || null;
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId);
    if (!isUuid) return null;

    // Try as a direct customer primary key first (most common case)
    const byId = await prisma.customers.findUnique({
        where: { id: userId },
        select: { id: true },
    });
    if (byId) return byId.id;

    // Legacy: the UUID might be an old Supabase auth_user_id stored on the customer row
    const byAuthId = await prisma.customers.findFirst({
        where: { auth_user_id: userId },
        select: { id: true },
    });
    return byAuthId?.id || null;
}


export async function getAddressesAction(userId: string) {
    try {
        const customerId = await resolveCustomerId(userId);
        if (!customerId) {
            return { success: false, error: 'Customer not found' };
        }

        const data = await prisma.addresses.findMany({
            where: { user_id: customerId },
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
        const customerId = await resolveCustomerId(userId);
        if (!customerId) {
            return { success: false, error: 'Customer not found' };
        }

        const data = await prisma.addresses.create({
            data: {
                user_id: customerId,
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
        const customerId = await resolveCustomerId(userId);
        if (!customerId) {
            return { success: false, error: 'Customer not found' };
        }

        const data = await prisma.addresses.update({
            where: { id: addressId, user_id: customerId },
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
        const customerId = await resolveCustomerId(userId);
        if (!customerId) {
            return { success: false, error: 'Customer not found' };
        }

        // Unset all defaults for this user
        await prisma.addresses.updateMany({
            where: { user_id: customerId },
            data: { is_default: false }
        })
        // Set the new default
        await prisma.addresses.update({
            where: { id: addressId, user_id: customerId },
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
        const customerId = await resolveCustomerId(userId);
        if (!customerId) {
            return { success: false, error: 'Customer not found' };
        }

        await prisma.addresses.delete({
            where: { id: addressId, user_id: customerId }
        })
        return { success: true }
    } catch (error: any) {
        console.error('Error deleting address:', error)
        return { success: false, error: error?.message || 'Failed to delete address' }
    }
}
