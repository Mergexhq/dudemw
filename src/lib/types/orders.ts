import { Database } from '@/types/database'

// Base types from database
export type OrderInsert = Database['public']['Tables']['orders']['Insert']
export type OrderUpdate = Database['public']['Tables']['orders']['Update']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type Address = Database['public']['Tables']['addresses']['Row']

// Complete Order interface with all database columns
export interface Order {
  id: string
  user_id: string | null
  guest_id: string | null
  customer_id: string | null
  order_status: string | null
  payment_status: string | null
  razorpay_order_id: string | null
  created_at: string | null
  updated_at: string | null
  guest_email: string | null
  customer_email_snapshot: string | null
  customer_phone_snapshot: string | null
  customer_name_snapshot: string | null
  shipping_address_id: string | null
  shipping_tracking_number: string | null
  shipping_provider: string | null
  shipping_zone: string | null
  shipping_amount: number | null
  subtotal_amount: number | null
  tax_amount: number | null
  total_amount: number | null
  shipping_address: {
    firstName?: string
    lastName?: string
    address?: string
    city?: string
    state?: string
    postalCode?: string
    phone?: string
  } | null
  shipping_method: string | null
  payment_method: string | null
  tax_details: any | null
  shipped_at?: string | null
  delivered_at?: string | null
  payment_id?: string | null
}

// History type
export interface OrderStatusHistory {
  id: string
  order_id: string
  status: string
  note: string | null
  created_at: string
}

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
  order_status_history?: OrderStatusHistory[]
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