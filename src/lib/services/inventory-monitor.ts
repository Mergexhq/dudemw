/**
 * Inventory Monitor Service
 * Tracks inventory levels and manages low stock notifications
 */

import prisma from '@/lib/db'
import { EmailService } from './resend'

export interface LowStockProduct {
    productId: string
    variantId: string | null
    productName: string
    variantName: string | null
    currentStock: number
    threshold: number
}

export class InventoryMonitor {
    /**
     * Check if a product/variant is below the low stock threshold
     * and record it for notification
     */
    static async checkAndRecordLowStock(
        productId: string,
        variantId: string | null,
        productName: string,
        variantName: string | null,
        currentStock: number,
        threshold: number
    ): Promise<void> {
        try {
            // Check if stock is below threshold
            if (currentStock >= threshold) {
                // Stock is fine, mark as resolved if there was a notification
                await prisma.low_stock_notifications.updateMany({
                    where: {
                        product_id: productId,
                        variant_id: variantId || undefined,
                        resolved_at: null,
                    },
                    data: {
                        resolved_at: new Date(),
                    },
                })
                return
            }

            // Stock is low - check if we already have an active notification
            const existing = await prisma.low_stock_notifications.findFirst({
                where: {
                    product_id: productId,
                    variant_id: variantId || undefined,
                    resolved_at: null,
                },
                select: { id: true },
            })

            if (existing) {
                // Already have an active notification, just update the stock level
                await prisma.low_stock_notifications.update({
                    where: { id: existing.id },
                    data: {
                        current_stock: currentStock,
                        threshold: threshold,
                        updated_at: new Date(),
                    },
                })
            } else {
                // Create new low stock notification
                await prisma.low_stock_notifications.create({
                    data: {
                        product_id: productId,
                        variant_id: variantId,
                        product_name: productName,
                        variant_name: variantName,
                        current_stock: currentStock,
                        threshold: threshold,
                    },
                })
            }
        } catch (error) {
            console.error('[InventoryMonitor] Error recording low stock:', error)
        }
    }

    /**
     * Get all pending low stock notifications (not yet sent)
     */
    static async getPendingNotifications(): Promise<LowStockProduct[]> {
        try {
            const data = await prisma.low_stock_notifications.findMany({
                where: {
                    notified_at: null,
                    resolved_at: null,
                },
                orderBy: {
                    created_at: 'asc',
                },
            })

            return data.map((item) => ({
                productId: item.product_id,
                variantId: item.variant_id,
                productName: item.product_name,
                variantName: item.variant_name,
                currentStock: item.current_stock || 0,
                threshold: item.threshold || 0,
            }))
        } catch (error) {
            console.error('[InventoryMonitor] Error fetching pending notifications:', error)
            return []
        }
    }

    /**
     * Mark notifications as sent
     */
    static async markNotificationsAsSent(productIds: string[]): Promise<void> {
        try {
            await prisma.low_stock_notifications.updateMany({
                where: {
                    product_id: { in: productIds },
                    notified_at: null,
                },
                data: {
                    notified_at: new Date(),
                },
            })
        } catch (error) {
            console.error('[InventoryMonitor] Error marking notifications as sent:', error)
        }
    }

    /**
     * Send daily digest of low stock products
     */
    static async sendDailyDigest(): Promise<{ success: boolean; error?: string }> {
        try {
            // Check if low stock alerts are enabled
            const preferences = await prisma.system_preferences.findFirst({
                select: { low_stock_alert: true },
            })

            if (!preferences?.low_stock_alert) {
                console.log('[InventoryMonitor] Low stock alerts are disabled')
                return { success: true }
            }

            // Get pending notifications
            const pendingProducts = await this.getPendingNotifications()

            if (pendingProducts.length === 0) {
                console.log('[InventoryMonitor] No low stock products to notify')
                return { success: true }
            }

            // Get admin email from store settings
            const storeSettings = await prisma.store_settings.findFirst({
                select: { support_email: true },
            })

            const adminEmail = storeSettings?.support_email
            if (!adminEmail) {
                console.error('[InventoryMonitor] No admin email configured')
                return { success: false, error: 'No admin email configured' }
            }

            // Send digest email
            const result = await EmailService.sendLowStockDigest(
                adminEmail,
                pendingProducts
            )

            if (result.success) {
                // Mark all as notified
                const productIds = pendingProducts.map(p => p.productId)
                await this.markNotificationsAsSent(productIds)
            }

            return result
        } catch (error) {
            console.error('[InventoryMonitor] Error sending daily digest:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }
        }
    }
}
