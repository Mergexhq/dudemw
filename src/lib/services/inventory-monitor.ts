/**
 * Inventory Monitor Service
 * Tracks inventory levels and manages low stock notifications
 */

import { createClient } from '@/lib/supabase/client'
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
        const supabase = createClient()

        try {
            // Check if stock is below threshold
            if (currentStock >= threshold) {
                // Stock is fine, mark as resolved if there was a notification
                await (supabase
                    .from('low_stock_notifications') as any)
                    .update({ resolved_at: new Date().toISOString() })
                    .eq('product_id', productId)
                    .eq('variant_id', variantId)
                    .is('resolved_at', null)

                return
            }

            // Stock is low - check if we already have an active notification
            const { data: existing } = await (supabase
                .from('low_stock_notifications') as any)
                .select('id')
                .eq('product_id', productId)
                .eq('variant_id', variantId)
                .is('resolved_at', null)
                .single()

            if (existing) {
                // Already have an active notification, just update the stock level
                await (supabase
                    .from('low_stock_notifications') as any)
                    .update({
                        current_stock: currentStock,
                        threshold: threshold,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existing.id)
            } else {
                // Create new low stock notification
                await (supabase
                    .from('low_stock_notifications') as any)
                    .insert({
                        product_id: productId,
                        variant_id: variantId,
                        product_name: productName,
                        variant_name: variantName,
                        current_stock: currentStock,
                        threshold: threshold,
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
        const supabase = createClient()

        try {
            const { data, error } = await (supabase
                .from('low_stock_notifications') as any)
                .select('*')
                .is('notified_at', null)
                .is('resolved_at', null)
                .order('created_at', { ascending: true })

            if (error) throw error

            return (data || []).map((item: any) => ({
                productId: item.product_id,
                variantId: item.variant_id,
                productName: item.product_name,
                variantName: item.variant_name,
                currentStock: item.current_stock,
                threshold: item.threshold,
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
        const supabase = createClient()

        try {
            await (supabase
                .from('low_stock_notifications') as any)
                .update({ notified_at: new Date().toISOString() })
                .in('product_id', productIds)
                .is('notified_at', null)
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
            const supabase = createClient()
            const { data: preferences } = await supabase
                .from('system_preferences')
                .select('low_stock_alert')
                .single()

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
            const { data: storeSettings } = await supabase
                .from('store_settings')
                .select('support_email')
                .single()

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
