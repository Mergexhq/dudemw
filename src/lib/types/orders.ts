import { Database } from '@/types/database.types'

// Base types from database
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderInsert = Database['public']['Tables']['orders']['Insert']
export type OrderUpdate = Database['public']['Tables']['orders']['Update']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type Address = Database['public']['Tables']['addresses']['Row']

// Extended types for UI
export interface OrderWithDetails extends Order {
  order_items: (OrderItem & {
    product_variants?: {
      id: string
      name: string | null
      sku: string
      products: {
        id: string
        title: string
        slug: string
      } | null
    } | null
  })[]
  shipping_address?: Address | null
}

export interface OrderFilters {
  search: string
  status: string
  paymentStatus: string
  dateFrom: string
  dateTo: string
  customer: string
}

export interface OrderStats {
  total: number
  pending: number
  processing: number
  shipped: number
  delivered: number
  cancelled: number
  totalRevenue: number
  averageOrderValue: number
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

// Status mappings for the actual database fields
export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing', 
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed'
} as const

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded'
} as const