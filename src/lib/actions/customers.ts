'use server'

/**
 * LEGACY Customer Actions - DEPRECATED
 * These previously used auth.users directly which violates domain separation
 * Use customer-domain.ts actions instead
 */

import { prisma } from '@/lib/db'
import { serializePrisma } from '@/lib/utils/prisma-utils'
import {
  Customer,
  CustomerWithStats,
  CustomerFilters,
  CustomerStats,
  PaginationInfo,
  CustomerDetails,
  CustomerOrder,
  CustomerExportData,
} from '@/lib/types/customers'

// Import new domain actions
import {
  getCustomersForAdmin,
  getCustomerByIdForAdmin,
  getCustomerStatsForAdmin,
} from './customer-domain'

/**
 * Server action to get customers with filtering and pagination
 * NOW USING NEW CUSTOMER DOMAIN
 */
export async function getCustomersAction(
  filters?: CustomerFilters,
  page: number = 1,
  limit: number = 20
) {
  try {
    // Use new customer domain
    const result = await getCustomersForAdmin({
      customer_type: filters?.customerType === 'all' || !filters?.customerType
        ? undefined
        : filters.customerType as 'guest' | 'registered',
      status: filters?.status === 'all' || !filters?.status
        ? undefined
        : filters.status as 'active' | 'inactive',
      search: filters?.search,
      limit,
      offset: (page - 1) * limit,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    // Transform data to match expected format with proper field mapping
    const transformedData: CustomerWithStats[] = (result.data || []).map(customer => ({
      id: customer.id,
      email: customer.email || '',
      phone: customer.phone,
      first_name: customer.first_name,
      last_name: customer.last_name,
      customer_type: customer.customer_type as any,
      created_at: new Date(customer.created_at).toISOString(),
      last_sign_in_at: customer.last_order_at ? new Date(customer.last_order_at).toISOString() : null,
      metadata: customer.metadata || {},
      totalOrders: customer.total_orders,
      totalSpent: customer.total_spent,
      averageOrderValue: customer.average_order_value,
      lastOrderDate: customer.last_order_at ? new Date(customer.last_order_at).toISOString() : null,
      lifetimeValue: customer.lifetime_value,
      status: customer.status === 'active' ? 'active' : 'inactive',
    }))

    return {
      success: true,
      data: serializePrisma(transformedData),
      total: result.total,
      pagination: {
        page,
        limit,
        total: result.total || 0,
        totalPages: Math.ceil((result.total || 0) / limit),
      } as PaginationInfo,
    }
  } catch (error: any) {
    const errorMessage =
      error?.message || error?.error_description || JSON.stringify(error) || 'Unknown error'
    console.error('Error fetching customers:', errorMessage, error)
    return { success: false, error: `Failed to fetch customers: ${errorMessage}` }
  }
}

/**
 * LEGACY METHOD - Keeping for backward compatibility
 * This was the old way using auth.users
 */
export async function getCustomersActionLegacy(
  filters?: CustomerFilters,
  page: number = 1,
  limit: number = 20
) {
  try {
    // Fetch users from users/customers table instead of auth.users
    const authUsers = await prisma.customers.findMany({
      skip: Math.max(0, (page - 1) * limit),
      take: limit,
    })

    const userIds = authUsers.map((user) => user.id)

    // Get order statistics for these users
    const orders = await prisma.orders.findMany({
      where: {
        customer_id: { in: userIds }
      },
      select: {
        customer_id: true,
        total_amount: true,
        created_at: true,
        order_status: true
      }
    })

    // Calculate stats for each customer
    const customersWithStats: CustomerWithStats[] = authUsers.map((user) => {
      const customerOrders = orders.filter((o) => o.customer_id === user.id)
      const totalOrders = customerOrders.length
      const totalSpent = customerOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0
      const lastOrder = customerOrders.sort(
        (a, b) =>
          new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
      )[0]

      // Determine status
      let status: 'active' | 'inactive' = 'inactive'
      if (totalOrders > 0) {
        const daysSinceLastOrder = lastOrder
          ? Math.floor(
            (Date.now() - new Date(lastOrder.created_at || '').getTime()) /
            (1000 * 60 * 60 * 24)
          )
          : 999
        status = daysSinceLastOrder < 90 ? 'active' : 'inactive'
      }

      return {
        id: user.id,
        email: user.email || '',
        created_at: new Date(user.created_at || '').toISOString(),
        last_sign_in_at: user.last_order_at ? new Date(user.last_order_at).toISOString() : null,
        metadata: user.metadata || {},
        totalOrders,
        totalSpent,
        averageOrderValue,
        lastOrderDate: lastOrder?.created_at ? new Date(lastOrder.created_at).toISOString() : null,
        lifetimeValue: totalSpent,
        status,
      } as unknown as CustomerWithStats
    })

    // Apply filters
    let filteredCustomers = customersWithStats

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase()
      filteredCustomers = filteredCustomers.filter(
        (c) =>
          c.email.toLowerCase().includes(searchLower) ||
          (c.metadata as any)?.full_name?.toLowerCase().includes(searchLower)
      )
    }

    if (filters?.status && filters.status !== 'all') {
      filteredCustomers = filteredCustomers.filter((c) => c.status === filters.status)
    }

    if (filters?.dateFrom) {
      filteredCustomers = filteredCustomers.filter(
        (c) => new Date(c.created_at) >= new Date(filters.dateFrom!)
      )
    }

    if (filters?.dateTo) {
      filteredCustomers = filteredCustomers.filter(
        (c) => new Date(c.created_at) <= new Date(filters.dateTo!)
      )
    }

    if (filters?.minOrders) {
      filteredCustomers = filteredCustomers.filter((c) => c.totalOrders >= filters.minOrders!)
    }

    if (filters?.minSpent) {
      filteredCustomers = filteredCustomers.filter((c) => c.totalSpent >= filters.minSpent!)
    }

    const total = filteredCustomers.length

    return {
      success: true,
      data: serializePrisma(filteredCustomers),
      total,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      } as PaginationInfo,
    }
  } catch (error: any) {
    const errorMessage =
      error?.message || error?.error_description || JSON.stringify(error) || 'Unknown error'
    console.error('Error fetching customers:', errorMessage, error)
    return { success: false, error: `Failed to fetch customers: ${errorMessage}` }
  }
}

/**
 * Server action to get single customer with full details
 * NOW USING NEW CUSTOMER DOMAIN
 */
export async function getCustomerAction(
  id: string
): Promise<{ success: boolean; data?: CustomerDetails; error?: string }> {
  try {
    // Use new customer domain
    const result = await getCustomerByIdForAdmin(id)

    if (!result.success || !result.data) {
      return { success: false, error: result.error || 'Customer not found' }
    }

    // Transform to match legacy format
    const customer = result.data
    return serializePrisma({
      success: true,
      data: {
        id: customer.id,
        email: customer.email || '',
        first_name: customer.first_name,
        last_name: customer.last_name,
        phone: customer.phone,
        customer_type: customer.customer_type,
        created_at: customer.created_at,
        last_sign_in_at: customer.last_order_at, // Use last_order_at as proxy
        metadata: {
          ...(customer.metadata as object),
          full_name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || undefined,
          phone: customer.phone,
        },
        totalOrders: customer.total_orders,
        totalSpent: customer.total_spent,
        averageOrderValue: customer.average_order_value,
        lastOrderDate: customer.last_order_at,
        lifetimeValue: customer.lifetime_value,
        status: customer.status === 'active' ? 'active' : 'inactive',
        orders: customer.orders as CustomerOrder[],
        addresses: customer.addresses.map(addr => ({
          id: addr.id,
          user_id: customer.auth_user_id,
          name: addr.name,
          phone: addr.phone,
          address_line1: addr.address_line1,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode,
          created_at: addr.created_at,
        })),
      } as unknown as CustomerDetails,
    })
  } catch (error: any) {
    const errorMessage =
      error?.message || error?.error_description || JSON.stringify(error) || 'Unknown error'
    console.error('Error fetching customer:', errorMessage, error)
    return { success: false, error: `Failed to fetch customer details: ${errorMessage}` }
  }
}

/**
 * LEGACY METHOD - Original implementation using auth.users
 */
export async function getCustomerActionLegacy(
  id: string
): Promise<{ success: boolean; data?: CustomerDetails; error?: string }> {
  try {
    // Get user from customers table
    const authUser = await prisma.customers.findUnique({
      where: { id: id }
    })

    if (!authUser) throw new Error('User not found')

    // Get customer orders
    const orders = await prisma.orders.findMany({
      where: { customer_id: id },
      select: {
        id: true,
        created_at: true,
        total_amount: true,
        order_status: true,
        payment_status: true,
        order_items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            product_variants: {
              select: {
                name: true,
                product: {
                  select: {
                    title: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    // Get customer addresses
    const addresses = await prisma.customer_addresses.findMany({
      where: { customer_id: id }
    })

    // Calculate stats
    const totalOrders = orders?.length || 0
    const totalSpent = orders?.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0
    const lastOrder = orders?.[0]

    // Determine status
    let status: 'active' | 'inactive' = 'inactive'
    if (totalOrders > 0) {
      const daysSinceLastOrder = lastOrder
        ? Math.floor(
          (Date.now() - new Date(lastOrder.created_at || '').getTime()) / (1000 * 60 * 60 * 24)
        )
        : 999
      status = daysSinceLastOrder < 90 ? 'active' : 'inactive'
    }

    // Map orders to proper schema structure
    const mappedOrders = orders.map((order) => ({
      ...order,
      order_items: order.order_items.map((item: any) => ({
        ...item,
        product_variants: {
          name: item.product_variants?.name,
          products: item.product_variants?.product
        }
      }))
    }))

    const customerDetails: CustomerDetails = {
      id: authUser.id,
      email: authUser.email || '',
      created_at: new Date(authUser.created_at || '').toISOString(),
      last_sign_in_at: authUser.last_order_at ? new Date(authUser.last_order_at).toISOString() : null,
      metadata: authUser.metadata as any,
      totalOrders,
      totalSpent,
      averageOrderValue,
      lastOrderDate: lastOrder?.created_at ? new Date(lastOrder.created_at).toISOString() : null,
      lifetimeValue: totalSpent,
      status,
      orders: (mappedOrders as unknown as CustomerOrder[]) || [],
      addresses: addresses as any || [],
    }

    return serializePrisma({ success: true, data: customerDetails })
  } catch (error: any) {
    const errorMessage =
      error?.message || error?.error_description || JSON.stringify(error) || 'Unknown error'
    console.error('Error fetching customer:', errorMessage, error)
    return { success: false, error: `Failed to fetch customer details: ${errorMessage}` }
  }
}

/**
 * Server action to get customer statistics for dashboard
 * NOW USING NEW CUSTOMER DOMAIN
 */
export async function getCustomerStatsAction(): Promise<{
  success: boolean
  data?: CustomerStats
  error?: string
}> {
  try {
    // Use new customer domain
    const result = await getCustomerStatsForAdmin()

    if (!result.success || !result.data) {
      return { success: false, error: result.error || 'Failed to fetch stats' }
    }

    // Transform to match legacy format
    return serializePrisma({
      success: true,
      data: {
        total: result.data.total,
        active: result.data.active,
        inactive: result.data.inactive,
        registered: result.data.registered,
        guests: result.data.guests,
        newThisMonth: result.data.new_this_month,
        totalRevenue: result.data.total_revenue,
      } as CustomerStats,
    })
  } catch (error: any) {
    const errorMessage =
      error?.message || error?.error_description || JSON.stringify(error) || 'Unknown error'
    console.error('Error fetching customer stats:', errorMessage, error)
    return { success: false, error: `Failed to fetch customer statistics: ${errorMessage}` }
  }
}

/**
 * LEGACY METHOD - Original implementation using auth.users
 */
export async function getCustomerStatsActionLegacy(): Promise<{
  success: boolean
  data?: CustomerStats
  error?: string
}> {
  try {
    // Get all users
    const authData = await prisma.customers.findMany({ select: { id: true, created_at: true } })

    const totalCustomers = authData.length

    // Get all orders
    const orders = await prisma.orders.findMany({
      select: { customer_id: true, total_amount: true, created_at: true }
    })

    // Calculate stats
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const newThisMonth = authData.filter((u) => new Date(u.created_at || '') >= firstOfMonth)
      .length

    const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0

    // Calculate customer stats
    let activeCount = 0
    let inactiveCount = 0

    authData.forEach((user) => {
      const customerOrders = orders?.filter((o) => o.customer_id === user.id) || []

      if (customerOrders.length > 0) {
        const lastOrder = customerOrders.sort(
          (a, b) =>
            new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
        )[0]
        const daysSinceLastOrder = Math.floor(
          (Date.now() - new Date(lastOrder.created_at || '').getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysSinceLastOrder < 90) {
          activeCount++
        } else {
          inactiveCount++
        }
      } else {
        inactiveCount++
      }
    })

    const stats: CustomerStats = {
      total: totalCustomers,
      active: activeCount,
      inactive: inactiveCount,
      registered: totalCustomers, // Legacy: assume all auth users are registered
      guests: 0, // Legacy: auth.users doesn't track guests
      newThisMonth,
      totalRevenue,
    }

    return { success: true, data: serializePrisma(stats) }
  } catch (error: any) {
    const errorMessage =
      error?.message || error?.error_description || JSON.stringify(error) || 'Unknown error'
    console.error('Error fetching customer stats:', errorMessage, error)
    return { success: false, error: `Failed to fetch customer statistics: ${errorMessage}` }
  }
}

/**
 * Server action to export customers to CSV format
 */
export async function exportCustomersAction(filters?: CustomerFilters): Promise<{
  success: boolean
  data?: CustomerExportData[]
  error?: string
}> {
  try {
    const result = await getCustomersAction(filters, 1, 10000) // Get all customers

    if (!result.success || !result.data) {
      return { success: false, error: 'Failed to fetch customers for export' }
    }

    const exportData: CustomerExportData[] = result.data.map((customer) => ({
      Email: customer.email,
      'Full Name': (customer.metadata as any)?.full_name || 'N/A',
      'Join Date': new Date(customer.created_at).toLocaleDateString(),
      'Last Sign In': customer.last_sign_in_at
        ? new Date(customer.last_sign_in_at).toLocaleDateString()
        : 'Never',
      'Total Orders': customer.totalOrders,
      'Total Spent': `₹${customer.totalSpent.toLocaleString()}`,
      'Average Order Value': `₹${customer.averageOrderValue.toFixed(2)}`,
      Status: customer.status.charAt(0).toUpperCase() + customer.status.slice(1),
    }))

    return serializePrisma({ success: true, data: exportData })
  } catch (error) {
    console.error('Error exporting customers:', error)
    return { success: false, error: 'Failed to export customers' }
  }
}

/**
 * Server action to get customer order history
 */
export async function getCustomerOrdersAction(customerId: string) {
  try {
    const orders = await prisma.orders.findMany({
      where: { customer_id: customerId }, // Changed from user_id to customer_id which is typically correct
      select: {
        id: true,
        created_at: true,
        total_amount: true,
        order_status: true,
        payment_status: true,
        order_items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            product_variants: {
              select: {
                name: true,
                sku: true,
                product: {
                  select: {
                    title: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    // Map orders to proper schema structure
    const mappedOrders = orders.map((order) => ({
      ...order,
      order_items: order.order_items.map((item: any) => ({
        ...item,
        product_variants: {
          name: item.product_variants?.name,
          sku: item.product_variants?.sku,
          products: item.product_variants?.product
        }
      }))
    }))

    return serializePrisma({ success: true, data: mappedOrders })
  } catch (error) {
    console.error('Error fetching customer orders:', error)
    return { success: false, error: 'Failed to fetch customer orders' }
  }
}
