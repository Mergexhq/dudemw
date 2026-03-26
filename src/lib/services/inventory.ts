import prisma from '@/lib/db'
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

// Helper to get product name from a variant (using the correct Prisma relation name)
function getProductName(variant: any): string {
  return variant?.product?.title || 'Unknown Product'
}

export class InventoryService {
  /**
   * Get inventory items with filtering.
   * Sources from product_variants to ensure ALL variants appear, even those
   * without a corresponding inventory_items record (uses variant.stock as fallback).
   */
  static async getInventoryItems(filters?: InventoryFilters, page: number = 1, limit: number = 50) {
    try {
      // Query product_variants as the primary source so no variant is invisible
      const variants = await prisma.product_variants.findMany({
        include: {
          product: { select: { id: true, title: true } },
          inventory_items: true,
        },
      })

      let inventoryItems: InventoryItem[] = variants.map((variant) => {
        const ii = variant.inventory_items
        // If no inventory_items row exists, fall back to variant.stock
        const quantity = ii ? (ii.quantity ?? variant.stock ?? 0) : (variant.stock ?? 0)
        const availableQty = ii ? (ii.available_quantity ?? quantity) : quantity
        return {
          id: ii?.id ?? `pv-${variant.id}`,
          variant_id: variant.id,
          sku: variant.sku || ii?.sku || null,
          quantity,
          available_quantity: availableQty,
          reserved_quantity: ii?.reserved_quantity ?? 0,
          low_stock_threshold: ii?.low_stock_threshold ?? 5,
          allow_backorders: ii?.allow_backorders ?? false,
          track_quantity: ii?.track_quantity ?? true,
          product_name: variant.product?.title || 'Unknown Product',
          variant_name: variant.name || null,
          product_id: variant.product?.id || '',
        }
      })

      // Apply stock status filter
      if (filters?.stockStatus && filters.stockStatus !== 'all') {
        inventoryItems = inventoryItems.filter(item => {
          const quantity = item.quantity || 0
          const threshold = item.low_stock_threshold || 5
          if (filters.stockStatus === 'out_of_stock') return quantity <= 0
          if (filters.stockStatus === 'low_stock') return quantity > 0 && quantity <= threshold
          if (filters.stockStatus === 'in_stock') return quantity > threshold
          return true
        })
      }

      // Apply product ID filter
      if (filters?.productId) {
        inventoryItems = inventoryItems.filter(item => item.product_id === filters.productId)
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

      const total = inventoryItems.length
      const from = (page - 1) * limit
      const paginatedItems = inventoryItems.slice(from, from + limit)

      return {
        success: true,
        data: paginatedItems,
        total,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      }
    } catch (error: any) {
      console.error('Error fetching inventory items:', error?.message)
      return { success: false, error: `Failed to fetch inventory items: ${error?.message || 'Unknown error'}` }
    }
  }

  /**
   * Adjust inventory stock
   */
  static async adjustStock(adjustment: InventoryAdjustment, _userId?: string) {
    try {
      const inventoryItem = await prisma.inventory_items.findUnique({
        where: { variant_id: adjustment.variant_id },
      })

      if (!inventoryItem) throw new Error('Inventory item not found')

      let newQuantity = inventoryItem.quantity || 0

      switch (adjustment.adjust_type) {
        case 'add':
          newQuantity = (newQuantity || 0) + adjustment.quantity;
          break
        case 'subtract':
          newQuantity = Math.max(0, (newQuantity || 0) - adjustment.quantity);
          break
        case 'set':
          newQuantity = Math.max(0, adjustment.quantity);
          break
      }

      if (newQuantity < 0 && !inventoryItem.allow_backorders) {
        return { success: false, error: 'Cannot have negative stock. Enable backorders first.' }
      }

      // Sync both tables
      await prisma.$transaction([
        prisma.inventory_items.update({
          where: { variant_id: adjustment.variant_id },
          data: {
            quantity: newQuantity,
            available_quantity: newQuantity - (inventoryItem.reserved_quantity || 0),
            updated_at: new Date(),
          },
        }),
        prisma.product_variants.update({
          where: { id: adjustment.variant_id },
          data: {
            stock: newQuantity,
            updated_at: new Date(),
          },
        }),
      ])

      await this.logInventoryChange({
        variant_id: adjustment.variant_id,
        change_amount:
          adjustment.adjust_type === 'set'
            ? newQuantity - (inventoryItem.quantity || 0)
            : adjustment.adjust_type === 'add'
              ? adjustment.quantity
              : -adjustment.quantity,
        reason: adjustment.reason,
        previous_quantity: inventoryItem.quantity || 0,
        new_quantity: newQuantity,
      })

      return { success: true, data: { previous: inventoryItem.quantity, new: newQuantity } }
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
        data?: { previous: number | null; new: number }
        error?: string
      }
      const results: AdjustmentResult[] = []
      for (const adjustment of bulkAdjustment.adjustments) {
        const result = await this.adjustStock(adjustment)
        results.push({ variant_id: adjustment.variant_id, ...result })
      }
      const successCount = results.filter(r => r.success).length
      return {
        success: true,
        data: { total: results.length, succeeded: successCount, failed: results.length - successCount, results },
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
      await prisma.inventory_logs.create({
        data: {
          variant_id: log.variant_id!,
          change_amount: log.change_amount!,
          reason: log.reason!,
          created_at: new Date(),
        },
      })
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
      const data = await prisma.inventory_logs.findMany({
        where: { variant_id: variantId },
        orderBy: { created_at: 'desc' },
        take: limit,
      })
      return { success: true, data: data as unknown as InventoryLog[] }
    } catch (error) {
      console.error('Error fetching inventory history:', error)
      return { success: false, error: 'Failed to fetch inventory history' }
    }
  }

  /**
   * Get inventory statistics
   * Uses product_variants as primary source so all variants are counted.
   */
  static async getInventoryStats(): Promise<{ success: boolean; data?: InventoryStats; error?: string }> {
    try {
      const variants = await prisma.product_variants.findMany({
        select: {
          stock: true,
          price: true,
          inventory_items: {
            select: { quantity: true, low_stock_threshold: true, cost: true },
          },
        },
      })

      const stats: InventoryStats = { totalItems: variants.length, inStock: 0, lowStock: 0, outOfStock: 0, totalValue: 0 }

      variants.forEach((variant) => {
        const ii = variant.inventory_items
        const quantity = ii ? (ii.quantity ?? variant.stock ?? 0) : (variant.stock ?? 0)
        const threshold = ii?.low_stock_threshold ?? 5
        if (quantity <= 0) stats.outOfStock++
        else if (quantity <= threshold) stats.lowStock++
        else stats.inStock++
        const price = parseFloat(String(variant.price || ii?.cost || 0))
        stats.totalValue += quantity * price
      })

      return { success: true, data: stats }
    } catch (error: any) {
      console.error('Error fetching inventory stats:', error?.message)
      return { success: false, error: `Failed to fetch inventory statistics: ${error?.message}` }
    }
  }

  /**
   * Get low stock alerts
   */
  static async getLowStockAlerts(): Promise<{ success: boolean; data?: LowStockAlert[]; error?: string }> {
    try {
      const items = await prisma.inventory_items.findMany({
        where: { quantity: { gt: 0 } },
        include: {
          product_variants: {
            include: {
              product: { select: { title: true } },
            },
          },
        },
        orderBy: { quantity: 'asc' },
      })

      const lowStockItems = items.filter((item) => {
        const quantity = item.quantity || 0
        const threshold = item.low_stock_threshold || 5
        return quantity <= threshold && quantity > 0
      })

      const alerts: LowStockAlert[] = lowStockItems.map((item) => ({
        id: item.id,
        variant_id: item.variant_id,
        product_name: getProductName(item.product_variants),
        variant_name: item.product_variants?.name,
        current_stock: item.quantity || 0,
        threshold: item.low_stock_threshold || 0,
        sku: item.product_variants?.sku || item.sku,
      }))

      return { success: true, data: alerts }
    } catch (error: any) {
      console.error('Error fetching low stock alerts:', error?.message)
      return { success: false, error: `Failed to fetch low stock alerts: ${error?.message}` }
    }
  }

  /**
   * Set reorder point for a variant
   */
  static async setLowStockThreshold(variantId: string, threshold: number) {
    try {
      await prisma.inventory_items.update({
        where: { variant_id: variantId },
        data: { low_stock_threshold: threshold, updated_at: new Date() },
      })
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
      const inventoryItem = await prisma.inventory_items.findUnique({
        where: { variant_id: variantId },
        include: {
          product_variants: {
            include: {
              product: { select: { title: true } },
            },
          },
        },
      })

      if (!inventoryItem) throw new Error('Inventory item not found')

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const orderItems = await prisma.order_items.findMany({
        where: { variant_id: variantId, created_at: { gte: thirtyDaysAgo } },
        select: { quantity: true },
      })

      const totalSold = orderItems.reduce((sum, item) => sum + item.quantity, 0)
      const averageDailySales = totalSold / 30
      const currentStock = inventoryItem.quantity || 0
      const daysUntilStockout = averageDailySales > 0 ? Math.floor(currentStock / averageDailySales) : 999
      const reorderAtStock = currentStock * 0.2
      const daysUntilReorder = averageDailySales > 0 ? Math.floor((currentStock - reorderAtStock) / averageDailySales) : 999
      const reorderDate = new Date()
      reorderDate.setDate(reorderDate.getDate() + daysUntilReorder)

      const forecast: StockForecast = {
        variant_id: variantId,
        product_name: getProductName(inventoryItem.product_variants),
        current_stock: currentStock,
        average_daily_sales: Math.round(averageDailySales * 100) / 100,
        days_until_stockout: daysUntilStockout,
        suggested_reorder_date: reorderDate.toISOString(),
        suggested_reorder_quantity: Math.ceil(averageDailySales * 30),
      }

      return { success: true, data: forecast }
    } catch (error) {
      console.error('Error calculating stock forecast:', error)
      return { success: false, error: 'Failed to calculate stock forecast' }
    }
  }
}
