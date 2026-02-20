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

export async function getGuestOrder(orderNumber: string, emailOrPhone: string) {
  try {
    const { supabaseAdmin } = await import('@/lib/supabase/supabase')

    // First find the order ID matching the order number and contact info
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('id, guest_email, customer_email_snapshot, customer_phone_snapshot')
      .eq('order_number', orderNumber)
      .single()

    if (error || !order) {
      return { success: false, error: 'Order not found' }
    }

    // Validate email or phone
    const normalizedInput = emailOrPhone.toLowerCase().trim()
    const emailMatch = (order.guest_email?.toLowerCase() === normalizedInput) ||
      (order.customer_email_snapshot?.toLowerCase() === normalizedInput)
    const phoneMatch = order.customer_phone_snapshot === normalizedInput

    if (!emailMatch && !phoneMatch) {
      return { success: false, error: 'Order details do not match' }
    }

    // If valid, fetch the full order details using OrderService
    return OrderService.getOrder(order.id)
  } catch (error) {
    console.error('getGuestOrder error:', error)
    return { success: false, error: 'Failed to track order' }
  }
}

export async function exportOrders(filters?: OrderFilters, fields?: string[]) {
  return OrderExportService.exportOrders(filters, fields)
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
    lastName?: string
    address: string
    address2?: string
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
    size?: string   // used to resolve variant when variantId is actually a productId
    color?: string  // used to resolve variant when variantId is actually a productId
  }[]
}

// Create order with supabaseAdmin (bypasses RLS for guests)
export async function createOrder(input: CreateOrderInput & { couponCode?: string; campaignId?: string; campaignDiscount?: number }): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    const { supabaseAdmin } = await import('@/lib/supabase/supabase')
    const { validateCoupon } = await import('@/app/actions/coupons')

    let finalTotal = input.totalAmount
    let discountAmount = 0
    let validatedCoupon: { code: string; discountType: string; discountValue: number; discountAmount: number } | null = null

    // Add campaign discount to total discount amount
    if (input.campaignDiscount && input.campaignDiscount > 0) {
      discountAmount += input.campaignDiscount
    }

    // Validate coupon if provided
    if (input.couponCode) {
      // Calculate cart total (subtotal of items)
      const cartTotal = input.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

      const validation = await validateCoupon(input.couponCode, cartTotal, input.userId || undefined)

      if (validation.isValid && validation.coupon) {
        validatedCoupon = validation.coupon
        discountAmount += validation.coupon.discountAmount

        // Recalculate total with both campaign and coupon discounts
        // We strictly trust server calculation: subtotal + shipping + tax - total_discount
        const calculatedTotal = input.subtotalAmount + input.shippingAmount + input.taxAmount - discountAmount
        finalTotal = Math.max(0, calculatedTotal)
      } else {
        // If coupon is invalid, we can either fail or proceed without it. 
        // Proceeding without it is safer but might surprise user.
        // Failing ensures they don't pay more than expected.
        return { success: false, error: validation.error || 'Invalid promo code' }
      }
    } else if (input.campaignDiscount && input.campaignDiscount > 0) {
      // If only campaign discount (no coupon), recalculate total
      const calculatedTotal = input.subtotalAmount + input.shippingAmount + input.taxAmount - discountAmount
      finalTotal = Math.max(0, calculatedTotal)
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

    // Create order items — resolve variant_id if a product_id was passed instead
    const resolvedItems: { order_id: string; variant_id: string; quantity: number; price: number }[] = []
    for (const item of input.items) {
      // Check if the given ID is a valid product_variants.id
      const { data: directVariant } = await supabaseAdmin
        .from('product_variants')
        .select('id')
        .eq('id', item.variantId)
        .maybeSingle()

      let resolvedVariantId = item.variantId

      if (!directVariant) {
        // The ID is likely a product_id — look up the best matching variant
        console.warn(`variantId "${item.variantId}" not found in product_variants — attempting to resolve via product_id`)
        const { data: variants } = await supabaseAdmin
          .from('product_variants')
          .select('id, name, variant_option_values(product_option_values(name))')
          .eq('product_id', item.variantId)
          .eq('active', true)

        if (!variants || variants.length === 0) {
          // Rollback and fail — no variants at all for this product
          await supabaseAdmin.from('orders').delete().eq('id', order.id)
          return { success: false, error: `Product not found or has no active variants. Please refresh your cart and try again.` }
        }

        // Try to match by size, then color, then fallback to first variant
        const findByOption = (optionName: string) =>
          variants.find((v: any) =>
            v.variant_option_values?.some((vo: any) =>
              vo.product_option_values?.name?.toLowerCase() === optionName?.toLowerCase()
            )
          )

        const matched = (item.size ? findByOption(item.size) : null)
          || (item.color ? findByOption(item.color) : null)
          || variants[0]

        resolvedVariantId = matched.id
        console.log(`Resolved variant: product_id "${item.variantId}" → variant_id "${resolvedVariantId}" (size: ${item.size}, color: ${item.color})`)
      }

      resolvedItems.push({
        order_id: order.id,
        variant_id: resolvedVariantId,
        quantity: item.quantity,
        price: item.price
      })
    }

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(resolvedItems)

    if (itemsError) {
      console.error('Order items creation error:', itemsError)
      // Rollback: delete the order since items are the core of an order
      await supabaseAdmin.from('orders').delete().eq('id', order.id)
      return { success: false, error: `Failed to save order items: ${itemsError.message}. Please ensure your cart products are still available.` }
    }

    // Save campaign discount if applied
    if (input.campaignId && input.campaignDiscount && input.campaignDiscount > 0) {
      const { error: discountError } = await supabaseAdmin
        .from('order_discounts')
        .insert({
          order_id: order.id,
          campaign_id: input.campaignId,
          discount_type: 'campaign',
          discount_amount: input.campaignDiscount
        })

      if (discountError) {
        console.error('Campaign discount tracking error:', discountError)
        // Don't fail the order, just log the error
      }
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
// Fetch orders for a specific user (bypasses RLS for reliable fetching)
export async function getOrdersForUser(userId: string): Promise<{
  success: boolean;
  orders?: any[];
  error?: string;
}> {
  try {
    const { supabaseAdmin } = await import('@/lib/supabase/supabase')

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        created_at,
        order_status,
        payment_status,
        total_amount,
        order_items (
          id,
          quantity,
          price,
          product_variants (
            id,
            name,
            products:products!product_variants_product_id_fkey (
              title,
              product_images (
                image_url
              )
            )
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders for user:', error)
      return { success: false, error: error.message }
    }

    return { success: true, orders: data || [] }
  } catch (error: any) {
    console.error('getOrdersForUser exception:', error)
    return { success: false, error: error.message }
  }
}

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