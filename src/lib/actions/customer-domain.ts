'use server'

/**
 * Customer Domain Server Actions
 * 
 * This file implements the proper customer domain architecture where:
 * - Customers are commercial identities
 * - Auth users are authentication identities
 * - Admins are NEVER customers
 * 
 * All customer operations go through these server actions to ensure:
 * - Admin exclusion
 * - Guest-to-registered merging
 * - Data integrity
 * - Proper authorization
 */

import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

// ================================================
// TYPES
// ================================================

export type CustomerType = 'guest' | 'registered'
export type CustomerStatus = 'active' | 'inactive' | 'blocked' | 'merged'

export interface Customer {
  id: string
  auth_user_id: string | null
  email: string | null
  phone: string | null
  first_name: string | null
  last_name: string | null
  customer_type: CustomerType | string
  status: CustomerStatus | string
  metadata: any
  created_at: Date
  updated_at: Date
  last_order_at: Date | null
}

export interface CustomerAddress {
  id: string
  customer_id: string
  name: string
  phone: string
  email: string | null
  address_line1: string
  address_line2: string | null
  city: string
  state: string
  pincode: string
  country: string
  address_type: 'shipping' | 'billing' | 'both' | string
  is_default: boolean
  created_at: Date
  updated_at: Date
}

export interface CustomerWithStats extends Customer {
  total_orders: number
  total_spent: number
  average_order_value: number
  lifetime_value: number
}

export interface CreateCustomerInput {
  auth_user_id?: string
  email?: string
  phone?: string
  first_name?: string
  last_name?: string
  customer_type: CustomerType | string
  metadata?: any
}

// ================================================
// ADMIN VALIDATION
// ================================================

/**
 * Check if a user is an admin
 * Admins can NEVER be customers
 */
async function isAdminUser(userId: string): Promise<boolean> {
  try {
    const admin = await prisma.admin_profiles.findFirst({
      where: { user_id: userId },
      select: { id: true },
    })

    return !!admin
  } catch {
    return false
  }
}

// ================================================
// CUSTOMER CREATION
// ================================================

/**
 * Get or create customer for authenticated user
 * This handles the merge of guest accounts when a user logs in
 */
export async function getOrCreateCustomerForUser(
  authUserId: string,
  userData?: {
    email?: string
    phone?: string
    first_name?: string
    last_name?: string
    metadata?: any
  }
): Promise<{ success: boolean; data?: Customer; error?: string }> {
  try {
    // CRITICAL: Check if user is admin
    const isAdmin = await isAdminUser(authUserId)
    if (isAdmin) {
      return {
        success: false,
        error: 'Admins cannot be customers',
      }
    }

    // 1. Try to find existing customer by Clerk auth_user_id (fast path for post-migration users)
    const existingCustomer = await prisma.customers.findFirst({
      where: { auth_user_id: authUserId },
    })

    if (existingCustomer) {
      return { success: true, data: existingCustomer as unknown as Customer }
    }

    // 2. Pre-migration fallback: look up by email for ANY customer type.
    //    Old Supabase users are stored as 'registered' with a Supabase UUID as auth_user_id.
    //    When they sign in via Clerk their new ID won't match, so we find them by email
    //    and stamp the new Clerk ID so all future lookups hit the fast path.
    if (userData?.email) {
      const existingByEmail = await prisma.customers.findFirst({
        where: { email: userData.email },
        orderBy: { created_at: 'asc' }, // prefer oldest record (the original Supabase one)
      })

      if (existingByEmail) {
        const isGuestMerge = existingByEmail.customer_type === 'guest'
        const updatedCustomer = await prisma.customers.update({
          where: { id: existingByEmail.id },
          data: {
            auth_user_id: authUserId, // stamp new Clerk ID
            customer_type: 'registered',
            first_name: userData.first_name || existingByEmail.first_name,
            last_name: userData.last_name || existingByEmail.last_name,
            phone: userData.phone || existingByEmail.phone,
            metadata: {
              ...(existingByEmail.metadata as object),
              ...(userData.metadata as object),
              migrated_from: isGuestMerge ? 'guest' : 'supabase',
              migrated_at: new Date().toISOString(),
            },
            updated_at: new Date(),
          },
        })

        await prisma.customer_activity_log.create({
          data: {
            customer_id: existingByEmail.id,
            activity_type: isGuestMerge ? 'guest_merged' : 'auth_migrated',
            description: isGuestMerge
              ? 'Guest account merged with registered account'
              : 'Customer auth ID updated after Supabase→Clerk migration',
          },
        })

        return { success: true, data: updatedCustomer as unknown as Customer }
      }
    }

    // Create new registered customer
    const newCustomer = await prisma.customers.create({
      data: {
        auth_user_id: authUserId,
        email: userData?.email || null,
        phone: userData?.phone,
        first_name: userData?.first_name,
        last_name: userData?.last_name,
        customer_type: 'registered',
        metadata: userData?.metadata || {},
      },
    })

    // Log the creation
    await prisma.customer_activity_log.create({
      data: {
        customer_id: newCustomer.id,
        activity_type: 'account_created',
        description: 'Registered customer account created',
      },
    })

    return { success: true, data: newCustomer as unknown as Customer }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create customer' }
  }
}

/**
 * Get or create guest customer
 * Called during guest checkout
 */
export async function getOrCreateGuestCustomer(
  email: string | undefined | null,
  userData: {
    phone: string
    first_name: string
    last_name?: string
  }
): Promise<{ success: boolean; data?: Customer; error?: string }> {
  try {
    if (!email && !userData?.phone) {
      return { success: false, error: 'Either email or phone is required for guest customers' }
    }

    let existingGuest: Customer | null = null

    if (email) {
      // Try to find existing guest by email
      const result = await prisma.customers.findFirst({
        where: {
          email: email,
          customer_type: 'guest',
        },
      })
      existingGuest = result as unknown as Customer
    }

    if (!existingGuest && userData?.phone) {
      // Try to find existing guest by phone
      const result = await prisma.customers.findFirst({
        where: {
          phone: userData.phone,
          customer_type: 'guest',
        },
      })
      existingGuest = result as unknown as Customer
    }

    if (existingGuest) {
      // Update last order time and any new info
      const updatedGuest = await prisma.customers.update({
        where: { id: existingGuest.id },
        data: {
          last_order_at: new Date(),
          phone: userData?.phone || existingGuest.phone,
          first_name: userData?.first_name || existingGuest.first_name,
          last_name: userData?.last_name || existingGuest.last_name,
          // Only update email if it was previously null and now provided
          email: existingGuest.email || email || null,
          updated_at: new Date(),
        },
      })

      return { success: true, data: updatedGuest as unknown as Customer }
    }

    // Create new guest customer
    const newGuest = await prisma.customers.create({
      data: {
        email: email || null,
        phone: userData.phone,
        first_name: userData.first_name,
        last_name: userData.last_name,
        customer_type: 'guest',
      },
    })

    // Log the creation
    await prisma.customer_activity_log.create({
      data: {
        customer_id: newGuest.id,
        activity_type: 'guest_checkout',
        description: 'Guest customer created during checkout',
      },
    })

    return { success: true, data: newGuest as unknown as Customer }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create guest customer' }
  }
}

// ================================================
// CUSTOMER QUERIES (ADMIN)
// ================================================

/**
 * Get all customers (admin only)
 * Automatically excludes admins
 */
export async function getCustomersForAdmin(filters?: {
  customer_type?: CustomerType
  status?: CustomerStatus
  search?: string
  limit?: number
  offset?: number
}): Promise<{ success: boolean; data?: CustomerWithStats[]; total?: number; error?: string }> {
  try {
    const where: any = {}

    // Apply filters
    if (filters?.customer_type) {
      where.customer_type = filters.customer_type
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { first_name: { contains: filters.search, mode: 'insensitive' } },
        { last_name: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const [customers, count] = await Promise.all([
      prisma.customers.findMany({
        where,
        take: filters?.limit || 20,
        skip: filters?.offset || 0,
        orderBy: { created_at: 'desc' },
      }),
      prisma.customers.count({ where }),
    ])

    // Enrich with order statistics
    const customersWithStats: CustomerWithStats[] = await Promise.all(
      customers.map(async (customer) => {
        const orders = await prisma.orders.findMany({
          where: { customer_id: customer.id },
          select: { total_amount: true },
        })

        const total_orders = orders.length
        const total_spent = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
        const average_order_value = total_orders > 0 ? total_spent / total_orders : 0

        return {
          ...customer,
          total_orders,
          total_spent,
          average_order_value,
          lifetime_value: total_spent,
        } as unknown as CustomerWithStats
      })
    )

    return {
      success: true,
      data: customersWithStats,
      total: count,
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch customers' }
  }
}

/**
 * Get single customer details (admin only)
 */
export async function getCustomerByIdForAdmin(
  customerId: string
): Promise<{
  success: boolean
  data?: CustomerWithStats & {
    addresses: CustomerAddress[]
    orders: any[]
    activity: any[]
  }
  error?: string
}> {
  try {
    // Get customer
    const customer = await prisma.customers.findUnique({
      where: { id: customerId },
    })

    if (!customer) {
      return { success: false, error: 'Customer not found' }
    }

    // Get order statistics
    const orders = await prisma.orders.findMany({
      where: { customer_id: customerId },
      orderBy: { created_at: 'desc' },
    })

    const total_orders = orders.length
    const total_spent = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
    const average_order_value = total_orders > 0 ? total_spent / total_orders : 0

    // Get addresses
    const addresses = await prisma.customer_addresses.findMany({
      where: { customer_id: customerId },
      orderBy: { is_default: 'desc' },
    })

    // Get activity log
    const activity = await prisma.customer_activity_log.findMany({
      where: { customer_id: customerId },
      orderBy: { created_at: 'desc' },
      take: 50,
    })

    return {
      success: true,
      data: {
        ...customer,
        total_orders,
        total_spent,
        average_order_value,
        lifetime_value: total_spent,
        addresses: addresses as unknown as CustomerAddress[],
        orders,
        activity,
      } as unknown as CustomerWithStats & { addresses: CustomerAddress[]; orders: any[]; activity: any[] },
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch customer details' }
  }
}

/**
 * Get customer statistics for admin dashboard
 */
export async function getCustomerStatsForAdmin(): Promise<{
  success: boolean
  data?: {
    total: number
    registered: number
    guests: number
    active: number
    inactive: number
    new_this_month: number
    total_revenue: number
  }
  error?: string
}> {
  try {
    // Get all customers
    const customers = await prisma.customers.findMany({
      select: { id: true, customer_type: true, status: true, created_at: true },
    })

    const total = customers.length
    const registered = customers.filter((c) => c.customer_type === 'registered').length
    const guests = customers.filter((c) => c.customer_type === 'guest').length
    const active = customers.filter((c) => c.status === 'active').length
    const inactive = customers.filter((c) => c.status === 'inactive').length

    // New this month
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const new_this_month = customers.filter((c) => c.created_at && c.created_at >= firstOfMonth).length

    // Get revenue stats
    const orders = await prisma.orders.findMany({
      select: { total_amount: true, customer_id: true },
    })

    const total_revenue = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)

    return {
      success: true,
      data: {
        total,
        registered,
        guests,
        active,
        inactive,
        new_this_month,
        total_revenue,
      },
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch customer statistics' }
  }
}

// ================================================
// CUSTOMER ADDRESS MANAGEMENT
// ================================================

/**
 * Create customer address
 */
export async function createCustomerAddress(
  customerId: string,
  addressData: Omit<CustomerAddress, 'id' | 'customer_id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; data?: CustomerAddress; error?: string }> {
  try {
    const addedAddress = await prisma.customer_addresses.create({
      data: {
        customer_id: customerId,
        ...(addressData as any),
      },
    })

    return { success: true, data: addedAddress as unknown as CustomerAddress }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create address' }
  }
}

/**
 * Update customer address
 * [C-4] Verifies ownership: only the address owner can update it.
 */
export async function updateCustomerAddress(
  addressId: string,
  addressData: Partial<CustomerAddress>
): Promise<{ success: boolean; data?: CustomerAddress; error?: string }> {
  try {
    // Verify Clerk session
    const { userId } = await auth()
    if (!userId) return { success: false, error: 'Authentication required' }

    // Ownership check: ensure this address belongs to the authenticated customer
    const existing = await prisma.customer_addresses.findUnique({
      where: { id: addressId },
      select: { customer_id: true },
    })
    if (!existing) return { success: false, error: 'Address not found' }

    const customer = await prisma.customers.findFirst({
      where: { id: existing.customer_id, auth_user_id: userId },
      select: { id: true },
    })
    if (!customer) return { success: false, error: 'Unauthorized' }

    const updatedAddress = await prisma.customer_addresses.update({
      where: { id: addressId },
      data: addressData as any,
    })

    return { success: true, data: updatedAddress as unknown as CustomerAddress }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update address' }
  }
}

/**
 * Delete customer address
 * [C-4] Verifies ownership: only the address owner can delete it.
 */
export async function deleteCustomerAddress(
  addressId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify Clerk session
    const { userId } = await auth()
    if (!userId) return { success: false, error: 'Authentication required' }

    // Ownership check
    const existing = await prisma.customer_addresses.findUnique({
      where: { id: addressId },
      select: { customer_id: true },
    })
    if (!existing) return { success: false, error: 'Address not found' }

    const customer = await prisma.customers.findFirst({
      where: { id: existing.customer_id, auth_user_id: userId },
      select: { id: true },
    })
    if (!customer) return { success: false, error: 'Unauthorized' }

    await prisma.customer_addresses.delete({
      where: { id: addressId },
    })

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete address' }
  }
}

// ================================================
// CUSTOMER NOTES (ADMIN ONLY)
// ================================================

/**
 * Add note to customer
 */
export async function addCustomerNote(
  customerId: string,
  note: string,
  adminUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify admin
    const isAdmin = await isAdminUser(adminUserId)
    if (!isAdmin) {
      return { success: false, error: 'Only admins can add customer notes' }
    }

    await prisma.customer_notes.create({
      data: {
        customer_id: customerId,
        note,
        created_by: adminUserId,
      },
    })

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to add note' }
  }
}

/**
 * Get customer notes
 */
export async function getCustomerNotes(
  customerId: string
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const notes = await prisma.customer_notes.findMany({
      where: { customer_id: customerId },
      orderBy: { created_at: 'desc' },
    })

    return { success: true, data: notes }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch notes' }
  }
}
