"use server"

import { prisma } from '@/lib/db'
import { OrderService } from '@/lib/services/orders'
import { OrderStatusService } from '@/lib/services/order-status'
import { OrderExportService } from '@/lib/services/order-export'
import type { OrderFilters } from '@/lib/types/orders'

import { serializePrisma } from '@/lib/utils/prisma-utils'

/** Convert Prisma Decimal/Date objects to plain values for client transport */
const serialize = (data: any) => serializePrisma(data)

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
    const order = await prisma.orders.findFirst({
      where: { order_number: orderNumber } as any,
      select: { id: true, guest_email: true, customer_email_snapshot: true, customer_phone_snapshot: true } as any,
    }) as any

    if (!order) return { success: false, error: 'Order not found' }

    const normalizedInput = emailOrPhone.toLowerCase().trim()
    const emailMatch = (order.guest_email?.toLowerCase() === normalizedInput) ||
      (order.customer_email_snapshot?.toLowerCase() === normalizedInput)
    const phoneMatch = order.customer_phone_snapshot === normalizedInput

    if (!emailMatch && !phoneMatch) return { success: false, error: 'Order details do not match' }

    return OrderService.getOrder(order.id)
  } catch (error) {
    console.error('getGuestOrder error:', error)
    return { success: false, error: 'Failed to track order' }
  }
}

export async function exportOrders(filters?: OrderFilters, fields?: string[]) {
  return OrderExportService.exportOrders(filters, fields)
}

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
    size?: string
    color?: string
  }[]
}

export async function createOrder(
  input: CreateOrderInput & { couponCode?: string; campaignId?: string; campaignDiscount?: number }
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    const { validateCoupon } = await import('@/app/actions/coupons')

    let finalTotal = input.totalAmount
    let discountAmount = 0
    let validatedCoupon: { code: string; discountType: string; discountValue: number; discountAmount: number } | null = null

    if (input.campaignDiscount && input.campaignDiscount > 0) {
      discountAmount += input.campaignDiscount
    }

    if (input.couponCode) {
      const cartTotal = input.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const validation = await validateCoupon(input.couponCode, cartTotal, input.userId || undefined)
      if (validation.isValid && validation.coupon) {
        validatedCoupon = validation.coupon
        discountAmount += validation.coupon.discountAmount
        const calculatedTotal = input.subtotalAmount + input.shippingAmount + input.taxAmount - discountAmount
        finalTotal = Math.max(0, calculatedTotal)
      } else {
        return { success: false, error: validation.error || 'Invalid promo code' }
      }
    } else if (input.campaignDiscount && input.campaignDiscount > 0) {
      const calculatedTotal = input.subtotalAmount + input.shippingAmount + input.taxAmount - discountAmount
      finalTotal = Math.max(0, calculatedTotal)
    }

    const order = await prisma.orders.create({
      data: {
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
        total_amount: finalTotal,
        shipping_address: input.shippingAddress as any,
        shipping_method: input.shippingMethod,
        tax_details: input.taxDetails,
        coupon_code: validatedCoupon?.code || null,
      } as any,
    }) as any

    // Increment coupon usage atomically
    if (validatedCoupon) {
      await prisma.coupons.updateMany({
        where: { code: validatedCoupon.code } as any,
        data: { usage_count: { increment: 1 } } as any,
      }).catch(() => { })
    }

    // Resolve variant IDs and build order items
    const resolvedItems: { order_id: string; variant_id: string; quantity: number; price: number }[] = []
    for (const item of input.items) {
      const directVariant = await prisma.product_variants.findUnique({
        where: { id: item.variantId },
        select: { id: true },
      })

      let resolvedVariantId = item.variantId

      if (!directVariant) {
        console.warn(`variantId "${item.variantId}" not found — resolving via product_id`)
        const variants = await prisma.product_variants.findMany({
          where: { product_id: item.variantId, active: true } as any,
          include: {
            variant_option_values: { include: { product_option_values: { select: { name: true } } } },
          } as any,
        }) as any[]

        if (!variants || variants.length === 0) {
          await prisma.orders.delete({ where: { id: order.id } })
          return { success: false, error: 'Product not found or has no active variants. Please refresh your cart.' }
        }

        const findByNameExact = (sizeName: string) => variants.find((v: any) => v.name === sizeName)
        const findByOption = (optionName: string) => variants.find((v: any) =>
          v.variant_option_values?.some((vo: any) =>
            vo.product_option_values?.name?.toLowerCase() === optionName?.toLowerCase()
          )
        )
        const findByNamePartial = (sizeName: string) => variants.find((v: any) =>
          v.name?.toLowerCase().includes(sizeName.toLowerCase())
        )

        const matched = (item.size ? findByNameExact(item.size) : null)
          || (item.size ? findByOption(item.size) : null)
          || (item.size ? findByNamePartial(item.size) : null)
          || (item.color ? findByOption(item.color) : null)
          || variants[0]

        resolvedVariantId = matched.id
        console.log(`Resolved variant: product_id "${item.variantId}" → variant_id "${resolvedVariantId}"`)
      }

      resolvedItems.push({ order_id: order.id, variant_id: resolvedVariantId, quantity: item.quantity, price: item.price })
    }

    await prisma.order_items.createMany({ data: resolvedItems as any }).catch(async (itemsError: any) => {
      console.error('Order items creation error:', itemsError)
      await prisma.orders.delete({ where: { id: order.id } })
      throw new Error(`Failed to save order items: ${itemsError.message}`)
    })

    // Save campaign discount
    if (input.campaignId && input.campaignDiscount && input.campaignDiscount > 0) {
      await prisma.order_discounts.create({
        data: {
          order_id: order.id,
          campaign_id: input.campaignId,
          discount_type: 'campaign',
          discount_amount: input.campaignDiscount,
        } as any,
      }).catch((e: any) => console.error('Campaign discount tracking error:', e))
    }

    // Reduce stock atomically
    for (const resolvedItem of resolvedItems) {
      try {
        await prisma.product_variants.update({
          where: { id: resolvedItem.variant_id },
          data: { stock: { decrement: resolvedItem.quantity } } as any,
        })
        await prisma.inventory_items.updateMany({
          where: { variant_id: resolvedItem.variant_id } as any,
          data: {
            quantity: { decrement: resolvedItem.quantity },
            available_quantity: { decrement: resolvedItem.quantity },
            updated_at: new Date(),
          } as any,
        }).catch(() => { })
      } catch (stockError) {
        console.error(`[Stock Reduction] Exception for variant ${resolvedItem.variant_id}:`, stockError)
      }
    }

    return { success: true, orderId: order.id }
  } catch (error: any) {
    console.error('createOrder error:', error)
    return { success: false, error: error.message || 'Unknown error' }
  }
}

export async function updateOrderStatusDirect(orderId: string, status: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.orders.update({
      where: { id: orderId },
      data: { order_status: status } as any,
    })
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getOrdersForUser(userId: string): Promise<{ success: boolean; orders?: any[]; error?: string }> {
  try {
    const orders = await prisma.orders.findMany({
      where: { user_id: userId } as any,
      select: {
        id: true,
        created_at: true,
        order_status: true,
        payment_status: true,
        total_amount: true,
        order_items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            product_variants: {
              select: {
                id: true,
                name: true,
                products: {
                  select: {
                    title: true,
                    product_images: { select: { image_url: true } },
                  },
                },
              },
            },
          },
        },
      } as any,
      orderBy: { created_at: 'desc' },
    })
    return { success: true, orders: serialize(orders) }
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
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        order_items: {
          include: {
            product_variants: {
              include: {
                product: {
                  select: {
                    title: true,
                    product_images: { select: { image_url: true } },
                  },
                },
              },
            },
          },
        },
      } as any,
    }) as any

    if (!order) return { success: false, error: 'Order not found' }

    let isAuthorized = false
    if (guestIdParam && order.guest_id === guestIdParam) isAuthorized = true
    if (!isAuthorized && userIdParam && (userIdParam === order.user_id || userIdParam === order.customer_id)) {
      isAuthorized = true
    }

    if (!isAuthorized) {
      try {
        const { auth } = await import('@clerk/nextjs/server')
        const { userId } = await auth()
        if (userId && (userId === order.user_id || userId === order.customer_id)) isAuthorized = true
      } catch { /* ignore */ }
    }

    if (!isAuthorized) return { success: false, error: 'Unauthorized to view this order' }

    return { success: true, order: serialize(order) }
  } catch (error: any) {
    console.error('getOrderForConfirmation exception:', error)
    return { success: false, error: error.message }
  }
}

export async function getOrderForTrackingAction(orderId: string, phone: string) {
  try {
    const cleanOrderId = orderId.replace('#', '').trim();
    const cleanPhone = phone.trim().replace(/^0+/, '');

    let order: any = null;

    if (cleanOrderId.length <= 8) {
      const allOrders = await prisma.orders.findMany({
        select: {
          id: true,
          customer_phone_snapshot: true
        } as any
      });

      const matchedOrder = allOrders.find((o: any) => {
        const idStr = o.id.replace(/-/g, '').toLowerCase();
        const shortId = cleanOrderId.toLowerCase();
        const phoneDb = o.customer_phone_snapshot?.replace(/^0+/, '');

        return idStr.endsWith(shortId) && phoneDb === cleanPhone;
      });

      if (matchedOrder) {
        order = await prisma.orders.findUnique({
          where: { id: matchedOrder.id as unknown as string }
        });
      }
    } else {
      order = await prisma.orders.findFirst({
        where: {
          id: cleanOrderId,
          customer_phone_snapshot: phone,
        } as any,
      }) as any;

      if (!order) {
        const ordersWithId = await prisma.orders.findMany({
          where: { id: cleanOrderId } as any
        });
        order = ordersWithId.find((o: any) => {
          const phoneDb = o.customer_phone_snapshot?.replace(/^0+/, '');
          return phoneDb === cleanPhone;
        });
      }
    }

    if (!order) return { success: false, data: null };

    return { success: true, data: serialize(order) };
  } catch (error: any) {
    console.error('getOrderForTrackingAction error:', error);
    return { success: false, data: null, error: error.message };
  }
}