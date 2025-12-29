"use server"

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'

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
        const { data, error } = await supabase
            .from('store_locations')
            .select('*')
            .eq('is_primary', true)
            .eq('is_active', true)
            .single()

        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message, data: null }
    }
}

export async function getAllStoreLocations() {
    try {
        const { data, error } = await supabase
            .from('store_locations')
            .select('*')
            .eq('is_active', true)
            .order('is_primary', { ascending: false })

        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message, data: [] }
    }
}

export async function updateStoreLocation(id: string, updates: Partial<StoreLocation>) {
    try {
        const { data, error } = await supabase
            .from('store_locations')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        revalidatePath('/')
        revalidatePath('/stores')
        revalidatePath('/admin/settings/general')

        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
