'use server'

import { prisma } from '@/lib/db'

export interface CouponValidationResult {
    isValid: boolean
    error?: string
    coupon?: {
        code: string
        discountType: 'percentage' | 'fixed'
        discountValue: number
        discountAmount: number
    }
}

export async function validateCoupon(
    code: string,
    cartTotal: number,
    userId?: string
): Promise<CouponValidationResult> {
    try {
        if (!code) return { isValid: false, error: 'Promo code is required' }

        const coupon = await prisma.coupons.findFirst({
            where: { code: code.toUpperCase() } as any,
        }) as any

        if (!coupon) return { isValid: false, error: 'Invalid promo code' }
        if (!coupon.is_active) return { isValid: false, error: 'This promo code is inactive' }

        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
            return { isValid: false, error: 'This promo code has expired' }
        }

        if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
            return { isValid: false, error: 'This promo code has reached its usage limit' }
        }

        let discountAmount = 0
        if (coupon.discount_type === 'percentage') {
            discountAmount = (cartTotal * coupon.discount_value) / 100
        } else {
            discountAmount = coupon.discount_value
        }
        discountAmount = Math.min(discountAmount, cartTotal)

        return {
            isValid: true,
            coupon: {
                code: coupon.code,
                discountType: coupon.discount_type,
                discountValue: coupon.discount_value,
                discountAmount,
            },
        }
    } catch (error) {
        console.error('Coupon validation error:', error)
        return { isValid: false, error: 'Failed to validate promo code' }
    }
}

export async function deleteCoupon(couponId: string): Promise<{ success: boolean; error?: string }> {
    try {
        if (!couponId) return { success: false, error: 'Coupon ID is required' }
        await prisma.coupons.delete({ where: { id: couponId } as any })
        return { success: true }
    } catch (error: any) {
        console.error('Delete coupon error:', error)
        return { success: false, error: 'Failed to delete coupon' }
    }
}

export async function createCoupon(data: any): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.coupons.create({ data: data as any })
        return { success: true }
    } catch (error: any) {
        console.error('Create coupon error:', error)
        if (error.code === 'P2002') return { success: false, error: 'A coupon with this code already exists' }
        return { success: false, error: 'Failed to create coupon' }
    }
}

export async function updateCoupon(id: string, data: any): Promise<{ success: boolean; error?: string }> {
    try {
        if (!id) return { success: false, error: 'Coupon ID is required' }
        await prisma.coupons.update({ where: { id } as any, data: data as any })
        return { success: true }
    } catch (error: any) {
        console.error('Update coupon error:', error)
        if (error.code === 'P2002') return { success: false, error: 'A coupon with this code already exists' }
        return { success: false, error: 'Failed to update coupon' }
    }
}

export async function getAdminCouponsAction(filters: any, search: string) {
    try {
        let whereClause: any = {}

        if (search) {
            whereClause.code = { contains: search, mode: 'insensitive' }
        }

        if (filters?.is_active) {
            whereClause.is_active = filters.is_active === 'true'
        }

        if (filters?.discount_type) {
            whereClause.discount_type = filters.discount_type
        }

        if (filters?.expires_at) {
            const dateRange = filters.expires_at as { from?: string; to?: string }
            if (dateRange.from) {
                whereClause.expires_at = { ...whereClause.expires_at, gte: new Date(dateRange.from) }
            }
            if (dateRange.to) {
                whereClause.expires_at = { ...whereClause.expires_at, lte: new Date(dateRange.to) }
            }
        }

        const data = await prisma.coupons.findMany({
            where: whereClause,
            orderBy: { created_at: 'desc' },
        })

        return { success: true, data }
    } catch (error) {
        console.error('Error fetching admin coupons:', error)
        return { success: false, error: 'Failed to fetch admin coupons' }
    }
}

export async function toggleCouponStatusAction(id: string, currentStatus: boolean) {
    try {
        await prisma.coupons.update({
            where: { id } as any,
            data: { is_active: !currentStatus } as any
        })
        return { success: true }
    } catch (error) {
        console.error('Error toggling coupon status:', error)
        return { success: false, error: 'Failed to update coupon status' }
    }
}

export async function getAdminCouponAction(id: string) {
    try {
        const data = await prisma.coupons.findUnique({
            where: { id } as any
        })
        if (!data) return { success: false, error: 'Coupon not found' }
        return { success: true, data }
    } catch (error) {
        console.error('Error fetching admin coupon:', error)
        return { success: false, error: 'Failed to fetch coupon' }
    }
}
