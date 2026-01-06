import { supabaseAdmin } from '@/lib/supabase/supabase'
import { createClient } from '@/lib/supabase/client'
import {
  InventoryItem,
  InventoryLog,
  InventoryAdjustment,
  BulkInventoryAdjustment,
  InventoryFilters,
  InventoryStats,
  LowStockAlert,
  StockForecast,
} from '@/lib/types/inventory'

// Helper to get appropriate client - use client-side supabase for browser, admin for server
const getSupabaseClient = () => {
  if (typeof window !== 'undefined') {
    return createClient()
  }
  return supabaseAdmin
}

export class InventoryService {
  /**
   * Get inventory items with filtering
   */
  static async getInventoryItems(filters?: InventoryFilters, page: number = 1, limit: number = 50) {
    try {
      const supabase = getSupabaseClient()
      // Fetch all inventory items with proper joins
      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          id,
          variant_id,
          sku,
          quantity,
          available_quantity,
          reserved_quantity,
          low_stock_threshold,
          allow_backorders,
          track_quantity,
          cost,
          product_variants!inner (
            id,
            name,
            sku,
            price,
            product_id,
            products!product_variants_product_id_fkey!inner (
              id,
              title
            )
          )
        `)
        .order('quantity', { ascending: true })

      if (error) throw error

      // Transform data
      let inventoryItems: InventoryItem[] = (data || []).map((item: any) => ({
        id: item.id,
        variant_id: item.variant_id,
        sku: item.product_variants?.sku || item.sku || null,
        quantity: item.quantity || 0,
        available_quantity: item.available_quantity || 0,
        reserved_quantity: item.reserved_quantity || 0,
        low_stock_threshold: item.low_stock_threshold || 5,
        allow_backorders: item.allow_backorders || false,
        track_quantity: item.track_quantity || true,
        product_name: item.product_variants?.products?.title || 'Unknown Product',
        variant_name: item.product_variants?.name || null,
        product_id: item.product_variants?.product_id || '',
      }))

      // Apply stock status filter in JavaScript
      if (filters?.stockStatus && filters.stockStatus !== 'all') {
        inventoryItems = inventoryItems.filter(item => {
          const quantity = item.quantity || 0
          const threshold = item.low_stock_threshold || 5

          if (filters.stockStatus === 'out_of_stock') {
            return quantity <= 0
          } else if (filters.stockStatus === 'low_stock') {
            return quantity > 0 && quantity <= threshold
          } else if (filters.stockStatus === 'in_stock') {
            return quantity > threshold
          }
          return true
        })
      }

      // Apply search filter
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase()
        inventoryItems = inventoryItems.filter(
          item =>
            item.product_name.toLowerCase().includes(searchLower) ||
            item.variant_name?.toLowerCase().includes(searchLower) ||
            item.sku?.toLowerCase().includes(searchLower)
        )
      }

      // Apply pagination
      const total = inventoryItems.length
      const from = (page - 1) * limit
      const to = from + limit
      const paginatedItems = inventoryItems.slice(from, to)

      return {
        success: true,
        data: paginatedItems,
        total,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.error_description || JSON.stringify(error) || 'Unknown error'
      console.error('Error fetching inventory items:', errorMessage, error)
      return { success: false, error: `Failed to fetch inventory items: ${errorMessage}` }
    }
  }

  /**
   * Adjust inventory stock
   */
  static async adjustStock(adjustment: InventoryAdjustment, userId?: string) {
    try {
      // Get current inventory item
      const { data: inventoryItem, error: fetchError } = await supabaseAdmin
        .from('inventory_items')
        .select('*')
        .eq('variant_id', adjustment.variant_id)
        .single()

      if (fetchError) throw fetchError

      let newQuantity = inventoryItem.quantity || 0

      // Calculate new quantity based on adjustment type
      switch (adjustment.adjust_type) {
        case 'add':
          newQuantity += adjustment.quantity
          break
        case 'subtract':
          newQuantity -= adjustment.quantity
          break
        case 'set':
          newQuantity = adjustment.quantity
          break
      }

      // Prevent negative stock (unless backorders are allowed)
      if (newQuantity < 0 && !inventoryItem.allow_backorders) {
        return {
          success: false,
          error: 'Cannot have negative stock. Enable backorders first.',
        }
      }

      // Update inventory
      const { error: updateError } = await supabaseAdmin
        .from('inventory_items')
        .update({
          quantity: newQuantity,
          available_quantity: newQuantity - (inventoryItem.reserved_quantity || 0),
          updated_at: new Date().toISOString(),
        })
        .eq('variant_id', adjustment.variant_id)

      if (updateError) throw updateError

      // Log the adjustment
      await this.logInventoryChange({
        variant_id: adjustment.variant_id,
        change_amount: adjustment.adjust_type === 'set'
          ? newQuantity - inventoryItem.quantity
          : adjustment.adjust_type === 'add'
            ? adjustment.quantity
            : -adjustment.quantity,
        reason: adjustment.reason,
        previous_quantity: inventoryItem.quantity,
        new_quantity: newQuantity,
      })

      return {
        success: true,
        data: { previous: inventoryItem.quantity, new: newQuantity },
      }
    } catch (error) {
      console.error('Error adjusting stock:', error)
      return { success: false, error: 'Failed to adjust stock' }
    }
  }

  /**
   * Bulk adjust inventory
   */
  static async bulkAdjustStock(bulkAdjustment: BulkInventoryAdjustment) {
    try {
      interface AdjustmentResult {
        variant_id: string
        success: boolean
        data?: { previous: number; new: number }
        error?: string
      }

      const results: AdjustmentResult[] = []

      for (const adjustment of bulkAdjustment.adjustments) {
        const result = await this.adjustStock(adjustment)
        results.push({
          variant_id: adjustment.variant_id,
          ...result,
        })
      }

      const successCount = results.filter(r => r.success).length
      const failureCount = results.length - successCount

      return {
        success: true,
        data: {
          total: results.length,
          succeeded: successCount,
          failed: failureCount,
          results,
        },
      }
    } catch (error) {
      console.error('Error bulk adjusting stock:', error)
      return { success: false, error: 'Failed to bulk adjust stock' }
    }
  }

  /**
   * Log inventory change
   */
  private static async logInventoryChange(log: Partial<InventoryLog>) {
    try {
      // Using type assertion for unregistered table
      const { error } = await (supabaseAdmin as any).from('inventory_logs').insert({
        variant_id: log.variant_id!,
        change_amount: log.change_amount!,
        reason: log.reason!,
        created_at: new Date().toISOString(),
      })

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error logging inventory change:', error)
      return { success: false }
    }
  }

  /**
   * Get inventory history for a variant
   */
  static async getInventoryHistory(variantId: string, limit: number = 50) {
    try {
      // Using type assertion for unregistered table
      const { data, error } = await (supabaseAdmin as any)
        .from('inventory_logs')
        .select('*')
        .eq('variant_id', variantId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return { success: true, data: data as InventoryLog[] }
    } catch (error) {
      console.error('Error fetching inventory history:', error)
      return { success: false, error: 'Failed to fetch inventory history' }
    }
  }

  /**
   * Get inventory statistics
   */
  static async getInventoryStats(): Promise<{ success: boolean; data?: InventoryStats; error?: string }> {
    try {
      const { data: items, error } = await supabaseAdmin
        .from('inventory_items')
        .select(`
          quantity,
          low_stock_threshold,
          cost,
          product_variants!inner (
            price
          )
        `)

      if (error) throw error

      const stats: InventoryStats = {
        totalItems: items?.length || 0,
        inStock: 0,
        lowStock: 0,
        outOfStock: 0,
        totalValue: 0,
      }

      items?.forEach((item: any) => {
        const quantity = item.quantity || 0
        const threshold = item.low_stock_threshold || 5

        if (quantity === 0) {
          stats.outOfStock++
        } else if (quantity <= threshold) {
          stats.lowStock++
        } else {
          stats.inStock++
        }

        // Calculate total value (quantity * price)
        const price = parseFloat(item.product_variants?.price || item.cost || 0)
        stats.totalValue += quantity * price
      })

      return { success: true, data: stats }
    } catch (error: any) {
      const errorMessage = error?.message || error?.error_description || JSON.stringify(error) || 'Unknown error'
      console.error('Error fetching inventory stats:', errorMessage, error)
      return { success: false, error: `Failed to fetch inventory statistics: ${errorMessage}` }
    }
  }

  /**
   * Get low stock alerts
   */
  static async getLowStockAlerts(): Promise<{ success: boolean; data?: LowStockAlert[]; error?: string }> {
    try {
      // First, fetch all inventory items
      const { data: items, error } = await supabaseAdmin
        .from('inventory_items')
        .select(`
          id,
          variant_id,
          quantity,
          low_stock_threshold,
          sku,
          product_variants!inner (
            name,
            sku,
            products!product_variants_product_id_fkey!inner (
              title
            )
          )
        `)
        .gt('quantity', 0)
        .order('quantity', { ascending: true })

      if (error) throw error

      // Filter items where quantity <= low_stock_threshold in JavaScript
      // This avoids the SQL comparison issue with column references
      const lowStockItems = (items || []).filter((item: any) => {
        const quantity = item.quantity || 0
        const threshold = item.low_stock_threshold || 5
        return quantity <= threshold && quantity > 0
      })

      const alerts: LowStockAlert[] = lowStockItems.map((item: any) => ({
        id: item.id,
        variant_id: item.variant_id,
        product_name: item.product_variants?.products?.title || 'Unknown',
        variant_name: item.product_variants?.name,
        current_stock: item.quantity || 0,
        threshold: item.low_stock_threshold || 0,
        sku: item.product_variants?.sku || item.sku,
      }))

      return { success: true, data: alerts }
    } catch (error: any) {
      const errorMessage = error?.message || error?.error_description || JSON.stringify(error) || 'Unknown error'
      console.error('Error fetching low stock alerts:', errorMessage, error)
      return { success: false, error: `Failed to fetch low stock alerts: ${errorMessage}` }
    }
  }

  /**
   * Set reorder point for a variant
   */
  static async setLowStockThreshold(variantId: string, threshold: number) {
    try {
      const { error } = await supabaseAdmin
        .from('inventory_items')
        .update({
          low_stock_threshold: threshold,
          updated_at: new Date().toISOString(),
        })
        .eq('variant_id', variantId)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error setting low stock threshold:', error)
      return { success: false, error: 'Failed to set low stock threshold' }
    }
  }

  /**
   * Calculate stock forecast
   */
  static async getStockForecast(variantId: string): Promise<{ success: boolean; data?: StockForecast; error?: string }> {
    try {
      // Get inventory item
      const { data: inventoryItem, error: invError } = await supabaseAdmin
        .from('inventory_items')
        .select(`
          quantity,
          variant_id,
          product_variants (
            name,
            products!product_variants_product_id_fkey (
              title
            )
          )
        `)
        .eq('variant_id', variantId)
        .single()

      if (invError) throw invError

      // Get sales data from last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: orderItems, error: orderError } = await supabaseAdmin
        .from('order_items')
        .select('quantity, created_at')
        .eq('variant_id', variantId)
        .gte('created_at', thirtyDaysAgo.toISOString())

      if (orderError) throw orderError

      // Calculate average daily sales
      const totalSold = orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0
      const averageDailySales = totalSold / 30

      // Calculate days until stockout
      const currentStock = inventoryItem.quantity || 0
      const daysUntilStockout = averageDailySales > 0
        ? Math.floor(currentStock / averageDailySales)
        : 999

      // Suggest reorder date (when stock reaches 20%)
      const reorderAtStock = currentStock * 0.2
      const daysUntilReorder = averageDailySales > 0
        ? Math.floor((currentStock - reorderAtStock) / averageDailySales)
        : 999

      const reorderDate = new Date()
      reorderDate.setDate(reorderDate.getDate() + daysUntilReorder)

      // Suggest reorder quantity (30 days of sales)
      const suggestedReorderQuantity = Math.ceil(averageDailySales * 30)

      const forecast: StockForecast = {
        variant_id: variantId,
        product_name: inventoryItem.product_variants?.products?.title || 'Unknown',
        current_stock: currentStock,
        average_daily_sales: Math.round(averageDailySales * 100) / 100,
        days_until_stockout: daysUntilStockout,
        suggested_reorder_date: reorderDate.toISOString(),
        suggested_reorder_quantity: suggestedReorderQuantity,
      }

      return { success: true, data: forecast }
    } catch (error) {
      console.error('Error calculating stock forecast:', error)
      return { success: false, error: 'Failed to calculate stock forecast' }
    }
  }
}
