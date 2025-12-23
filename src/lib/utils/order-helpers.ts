import { OrderWithDetails } from '@/lib/types/orders'

// Get display name for customer
export function getCustomerName(order: OrderWithDetails): string {
  // Use customer_name_snapshot from checkout, fall back to email-based name or 'Guest Customer'
  if (order.customer_name_snapshot) {
    return order.customer_name_snapshot
  }
  if (order.customer_email_snapshot) {
    return order.customer_email_snapshot.split('@')[0]
  }
  return order.guest_email || 'Guest Customer'
}

// Get order number display
export function getOrderNumber(order: OrderWithDetails): string {
  return `#${order.id.slice(-8).toUpperCase()}`
}

// Get total items count
export function getItemsCount(order: OrderWithDetails): number {
  return order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0
}

// Get product title from order item
export function getProductTitle(item: any): string {
  return item.product_variants?.products?.title || 'Unknown Product'
}

// Get variant name from order item
export function getVariantName(item: any): string {
  return item.product_variants?.name || 'Default Variant'
}

// Format address for display
// Supports both JSONB format from checkout (address, postalCode) and legacy format (address_line1, pincode)
export function formatAddress(address: any): string {
  if (!address) return 'No address'
  
  // Handle JSONB address format (from orders.shipping_address)
  if (address.firstName || address.address) {
    const parts = []
    if (address.address) parts.push(address.address)
    if (address.city) parts.push(address.city)
    if (address.state) parts.push(address.state)
    if (address.postalCode) parts.push(address.postalCode)
    return parts.length > 0 ? parts.join(', ') : 'No address'
  }
  
  // Handle joined address table format (from addresses table)
  if (address.address_line1) {
    return `${address.address_line1}, ${address.city}, ${address.state} ${address.pincode}`
  }
  
  return 'No address'
}

// Get status color class
export function getStatusColor(status: string | null): string {
  switch (status) {
    case 'pending':
      return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
    case 'processing':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800'
    case 'shipped':
      return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
    case 'delivered':
    case 'completed':
      return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
    case 'cancelled':
      return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
  }
}

// Get payment status color class
export function getPaymentStatusColor(status: string | null): string {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800'
    case 'failed':
      return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
  }
}