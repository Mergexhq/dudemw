import { supabaseAdmin } from '@/lib/supabase/supabase'
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

export class InventoryService {
  /**
   * Get inventory items with filtering
   */
  static async getInventoryItems(filters?: InventoryFilters, page: number = 1, limit: number = 50) {
    try {
      let query = supabaseAdmin
        .from('inventory_items')
        .select(`
          *,
          product_variants (
            id,
            name,
            sku,
            product_id,
            products (
              id,
              title
            )
          )
        `)

      // Apply filters
      if (filters?.search) {
        // We'll filter after fetching since we need to search in nested data
      }

      if (filters?.stockStatus && filters.stockStatus !== 'all') {
        if (filters.stockStatus === 'out_of_stock') {
          query = query.lte('quantity', 0)
        } else if (filters.stockStatus === 'low_stock') {
          query = query.gt('quantity', 0).filter('quantity', 'lte', 'low_stock_threshold')
        } else if (filters.stockStatus === 'in_stock') {
          query = query.gt('quantity', 'low_stock_threshold')
        }
      }

      const from = (page - 1) * limit
      const to = from + limit - 1

      const { data, error, count } = await query
        .order('quantity', { ascending: true })
        .range(from, to)

      if (error) throw error

      // Transform data
      const inventoryItems: InventoryItem[] = (data || []).map((item: any) => ({
        id: item.id,
        variant_id: item.variant_id,
        sku: item.product_variants?.sku || null,
        quantity: item.quantity,
        available_quantity: item.available_quantity,
        reserved_quantity: item.reserved_quantity,
        low_stock_threshold: item.low_stock_threshold,
        allow_backorders: item.allow_backorders,
        track_quantity: item.track_quantity,
        product_name: item.product_variants?.products?.title || 'Unknown Product',
        variant_name: item.product_variants?.name,
        product_id: item.product_variants?.product_id || '',
      }))

      // Apply search filter if needed
      let filteredItems = inventoryItems
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase()
        filteredItems = inventoryItems.filter(
          item =>
            item.product_name.toLowerCase().includes(searchLower) ||
            item.variant_name?.toLowerCase().includes(searchLower) ||
            item.sku?.toLowerCase().includes(searchLower)
        )
      }

      return {
        success: true,
        data: filteredItems,
        total: filteredItems.length,
        pagination: {
          page,
          limit,
          total: filteredItems.length,
          totalPages: Math.ceil(filteredItems.length / limit),
        },
      }
    } catch (error) {
      console.error('Error fetching inventory items:', error)
      return { success: false, error: 'Failed to fetch inventory items' }
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
      const results = []

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
      const { error } = await supabaseAdmin.from('inventory_logs').insert({
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
      const { data, error } = await supabaseAdmin
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
          product_variants (
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
        const price = item.product_variants?.price || item.cost || 0
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
      const { data, error } = await supabaseAdmin
        .from('inventory_items')
        .select(`
          id,
          variant_id,
          quantity,
          low_stock_threshold,
          sku,
          product_variants (
            name,
            sku,
            products (
              title
            )
          )
        `)
        .lte('quantity', 'low_stock_threshold')
        .gt('quantity', 0)
        .order('quantity', { ascending: true })

      if (error) throw error

      const alerts: LowStockAlert[] = (data || []).map((item: any) => ({
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
            products (
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
