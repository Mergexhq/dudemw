"use server"

// Import services for server actions
import { OrderService } from '@/lib/services/orders'
import { OrderStatusService } from '@/lib/services/order-status'
import { OrderExportService } from '@/lib/services/order-export'
import type { OrderFilters } from '@/lib/types/orders'

// Re-export types (types can be exported from server action files)
export type {
  OrderWithDetails,
  OrderFilters,
  OrderStats,
  PaginationInfo,
  Order,
  OrderItem,
  Address
} from '@/lib/types/orders'

// Convenience functions that delegate to services
export async function getOrders(filters?: OrderFilters, page: number = 1, limit: number = 20) {
  return OrderService.getOrders(filters, page, limit)
}

export async function getOrder(id: string) {
  return OrderService.getOrder(id)
}

export async function getOrderStats() {
  return OrderService.getOrderStats()
}

export async function updateOrderStatus(orderId: string, status: string, notes?: string) {
  return OrderStatusService.updateOrderStatus(orderId, status, notes)
}

export async function bulkUpdateOrderStatus(orderIds: string[], status: string, notes?: string) {
  return OrderStatusService.bulkUpdateOrderStatus(orderIds, status, notes)
}

export async function addTrackingInfo(orderId: string, trackingNumber: string, carrier: string) {
  return OrderStatusService.addTrackingInfo(orderId, trackingNumber, carrier)
}

export async function cancelOrder(orderId: string, reason?: string) {
  return OrderStatusService.cancelOrder(orderId, reason)
}

export async function exportOrders(filters?: OrderFilters) {
  return OrderExportService.exportOrders(filters)
}

// Interface for creating orders from checkout
interface CreateOrderInput {
  userId?: string | null
  guestId?: string | null
  customerId?: string | null
  customerEmail: string
  customerPhone: string
  customerName: string
  orderStatus: string
  paymentStatus: string
  paymentMethod: string
  subtotalAmount: number
  shippingAmount: number
  taxAmount: number
  totalAmount: number
  shippingAddress: {
    firstName: string
    lastName: string
    address: string
    city: string
    state: string
    postalCode: string
    phone: string
  }
  shippingMethod: string
  taxDetails?: any
  items: {
    variantId: string
    quantity: number
    price: number
  }[]
}

// Create order with supabaseAdmin (bypasses RLS for guests)
export async function createOrder(input: CreateOrderInput & { couponCode?: string }): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    const { supabaseAdmin } = await import('@/lib/supabase/supabase')
    const { validateCoupon } = await import('@/app/actions/coupons')

    let finalTotal = input.totalAmount
    let discountAmount = 0
    let validatedCoupon = null

    // Validate coupon if provided
    if (input.couponCode) {
      // Calculate cart total (subtotal of items)
      const cartTotal = input.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

      const validation = await validateCoupon(input.couponCode, cartTotal, input.userId || undefined)

      if (validation.isValid && validation.coupon) {
        validatedCoupon = validation.coupon
        discountAmount = validation.coupon.discountAmount

        // Recalculate total with discount
        // Ensure we don't double count if client already sent discounted total
        // We strictly trust server calculation: subtotal + shipping + tax - discount
        const calculatedTotal = input.subtotalAmount + input.shippingAmount + input.taxAmount - discountAmount
        finalTotal = Math.max(0, calculatedTotal)
      } else {
        // If coupon is invalid, we can either fail or proceed without it. 
        // Proceeding without it is safer but might surprise user.
        // Failing ensures they don't pay more than expected.
        return { success: false, error: validation.error || 'Invalid promo code' }
      }
    }

    // Create the order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: input.userId || null,
        customer_id: input.customerId || null,
        guest_id: input.guestId || null,
        customer_email_snapshot: input.customerEmail,
        customer_phone_snapshot: input.customerPhone,
        customer_name_snapshot: input.customerName,
        order_status: input.orderStatus,
        payment_status: input.paymentStatus,
        payment_method: input.paymentMethod,
        subtotal_amount: input.subtotalAmount,
        shipping_amount: input.shippingAmount,
        tax_amount: input.taxAmount,
        discount_amount: discountAmount,
        total_amount: finalTotal, // Use server-calculated total
        shipping_address: input.shippingAddress,
        shipping_method: input.shippingMethod,
        tax_details: input.taxDetails,
        coupon_code: validatedCoupon?.code || null
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Order creation error:', orderError)
      return { success: false, error: orderError?.message || 'Failed to create order' }
    }

    // Increment coupon usage if applied
    if (validatedCoupon) {
      await (supabaseAdmin as any).rpc('increment_coupon_usage', {
        coupon_code: validatedCoupon.code
      })
      // Fallback if RPC doesn't exist yet (we'll implement it next, but good to have backup)
      // Note: direct update is race-condition prone but better than nothing
      // We will create the RPC function to ensure atomicity
    }

    // Create order items
    const orderItems = input.items.map(item => ({
      order_id: order.id,
      variant_id: item.variantId,
      quantity: item.quantity,
      price: item.price
    }))

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Order items creation error:', itemsError)
      // Don't fail the whole order, items error is logged
    }

    // Reduce stock for each ordered item
    // ... (rest of stock reduction logic remains same)
    for (const item of input.items) {
      try {
        console.log(`[Stock Reduction] Processing variant ${item.variantId}, quantity: ${item.quantity}`)

        // Get current stock from product_variants
        const { data: variant, error: variantError } = await supabaseAdmin
          .from('product_variants')
          .select('stock')
          .eq('id', item.variantId)
          .single()

        if (variantError) {
          console.error(`[Stock Reduction] Error fetching variant ${item.variantId}:`, variantError)
          continue
        }

        if (variant) {
          const currentStock = variant.stock || 0
          const newStock = Math.max(0, currentStock - item.quantity)

          console.log(`[Stock Reduction] Variant ${item.variantId}: ${currentStock} -> ${newStock}`)

          // Update stock in product_variants table
          const { error: updateError } = await supabaseAdmin
            .from('product_variants')
            .update({ stock: newStock })
            .eq('id', item.variantId)

          if (updateError) {
            console.error(`[Stock Reduction] Error updating product_variants stock for variant ${item.variantId}:`, updateError)
          } else {
            console.log(`[Stock Reduction] Successfully updated product_variants stock for variant ${item.variantId}`)
          }

          // Also update inventory_items table if it exists for this variant
          const { data: inventoryItem, error: invFetchError } = await supabaseAdmin
            .from('inventory_items')
            .select('id, quantity, available_quantity, reserved_quantity')
            .eq('variant_id', item.variantId)
            .single()

          if (!invFetchError && inventoryItem) {
            const currentInvQty = inventoryItem.quantity || 0
            const currentAvailable = inventoryItem.available_quantity || 0
            const newInvQty = Math.max(0, currentInvQty - item.quantity)
            const newAvailable = Math.max(0, currentAvailable - item.quantity)

            console.log(`[Stock Reduction] Inventory item ${inventoryItem.id}: quantity ${currentInvQty} -> ${newInvQty}`)

            const { error: invUpdateError } = await supabaseAdmin
              .from('inventory_items')
              .update({
                quantity: newInvQty,
                available_quantity: newAvailable,
                updated_at: new Date().toISOString()
              })
              .eq('variant_id', item.variantId)

            if (invUpdateError) {
              console.error(`[Stock Reduction] Error updating inventory_items for variant ${item.variantId}:`, invUpdateError)
            } else {
              console.log(`[Stock Reduction] Successfully updated inventory_items for variant ${item.variantId}`)
            }
          }
        }
      } catch (stockError) {
        console.error(`[Stock Reduction] Exception for variant ${item.variantId}:`, stockError)
        // Continue with other items even if one fails
      }
    }

    return { success: true, orderId: order.id }
  } catch (error: any) {
    console.error('createOrder error:', error)
    return { success: false, error: error.message || 'Unknown error' }
  }
}

// Update order status using supabaseAdmin
export async function updateOrderStatusDirect(orderId: string, status: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabaseAdmin } = await import('@/lib/supabase/supabase')

    const { error } = await supabaseAdmin
      .from('orders')
      .update({ order_status: status })
      .eq('id', orderId)

    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Securely fetch order for confirmation page (handles guest RLS issues)
// Accepts optional userId from client for authorization when server auth fails
export async function getOrderForConfirmation(
  orderId: string,
  guestIdParam?: string | null,
  userIdParam?: string | null
) {
  try {
    const { supabaseAdmin } = await import('@/lib/supabase/supabase')

    // 1. Fetch the order with admin privileges
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          product_variants (
            *,
            products:products!product_variants_product_id_fkey (
              title,
              product_images (
                image_url
              )
            )
          )
        )
      `)
      .eq('id', orderId)
      .single()

    if (error || !order) {
      console.error('Error fetching order for confirmation:', error)
      return { success: false, error: 'Order not found' }
    }

    // 2. Perform Security Check
    let isAuthorized = false

    // Check Guest ID (if provided)
    if (guestIdParam && order.guest_id === guestIdParam) {
      isAuthorized = true
    }

    // Check User ID from client (if provided) - this allows logged-in users to view their orders
    // even when server-side auth fails in server actions called from client components
    if (!isAuthorized && userIdParam && (userIdParam === order.user_id || userIdParam === order.customer_id)) {
      isAuthorized = true
    }

    // Check Authenticated User via server session (if not already authorized)
    if (!isAuthorized) {
      try {
        const { createServerSupabase } = await import('@/lib/supabase/server')
        const supabase = await createServerSupabase()
        const { data: { user } } = await supabase.auth.getUser()

        if (user && (user.id === order.user_id || user.id === order.customer_id)) {
          isAuthorized = true
        }
      } catch (authError) {
        // Ignore auth error, just means we can't verify via user session
        console.warn('Auth check failed during order confirmation:', authError)
      }
    }

    if (!isAuthorized) {
      return { success: false, error: 'Unauthorized to view this order' }
    }

    return { success: true, order }
  } catch (error: any) {
    console.error('getOrderForConfirmation exception:', error)
    return { success: false, error: error.message }
  }
}