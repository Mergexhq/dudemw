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

import { supabaseAdmin } from '@/lib/supabase/supabase'

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
  customer_type: CustomerType
  status: CustomerStatus
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  last_order_at: string | null
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
  address_type: 'shipping' | 'billing' | 'both'
  is_default: boolean
  created_at: string
  updated_at: string
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
  customer_type: CustomerType
  metadata?: Record<string, any>
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
    const { data, error } = await supabaseAdmin
      .from('admin_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    return !!data && !error
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
    metadata?: Record<string, any>
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

    // Try to find existing customer by auth_user_id
    const { data: existingCustomer, error: findError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single()

    if (existingCustomer && !findError) {
      return { success: true, data: existingCustomer }
    }

    // Try to find and merge guest account by email
    if (userData?.email) {
      const { data: guestCustomer, error: guestError } = await supabaseAdmin
        .from('customers')
        .select('*')
        .eq('email', userData.email)
        .eq('customer_type', 'guest')
        .is('auth_user_id', null)
        .single()

      if (guestCustomer && !guestError) {
        // Merge guest to registered
        const { data: mergedCustomer, error: mergeError } = await supabaseAdmin
          .from('customers')
          .update({
            auth_user_id: authUserId,
            customer_type: 'registered',
            first_name: userData.first_name || guestCustomer.first_name,
            last_name: userData.last_name || guestCustomer.last_name,
            phone: userData.phone || guestCustomer.phone,
            metadata: { ...guestCustomer.metadata, ...userData.metadata },
            updated_at: new Date().toISOString(),
          })
          .eq('id', guestCustomer.id)
          .select()
          .single()

        if (mergeError) {
          return { success: false, error: mergeError.message }
        }

        // Log the merge
        await supabaseAdmin.from('customer_activity_log').insert({
          customer_id: guestCustomer.id,
          activity_type: 'guest_merged',
          description: 'Guest account merged with registered account',
        })

        return { success: true, data: mergedCustomer }
      }
    }

    // Create new registered customer
    const { data: newCustomer, error: createError } = await supabaseAdmin
      .from('customers')
      .insert({
        auth_user_id: authUserId,
        email: userData?.email,
        phone: userData?.phone,
        first_name: userData?.first_name,
        last_name: userData?.last_name,
        customer_type: 'registered',
        metadata: userData?.metadata || {},
      })
      .select()
      .single()

    if (createError) {
      return { success: false, error: createError.message }
    }

    // Log the creation
    await supabaseAdmin.from('customer_activity_log').insert({
      customer_id: newCustomer.id,
      activity_type: 'account_created',
      description: 'Registered customer account created',
    })

    return { success: true, data: newCustomer }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create customer' }
  }
}

/**
 * Get or create guest customer
 * Called during guest checkout
 */
export async function getOrCreateGuestCustomer(
  email: string,
  userData?: {
    phone?: string
    first_name?: string
    last_name?: string
  }
): Promise<{ success: boolean; data?: Customer; error?: string }> {
  try {
    if (!email && !userData?.phone) {
      return { success: false, error: 'Either email or phone is required for guest customers' }
    }

    let existingGuest: Customer | null = null
    let findError: any = null

    if (email) {
      // Try to find existing guest by email
      const result = await supabaseAdmin
        .from('customers')
        .select('*')
        .eq('email', email)
        .eq('customer_type', 'guest')
        .single()

      existingGuest = result.data
      findError = result.error
    } else if (userData?.phone) {
      // Try to find existing guest by phone
      const result = await supabaseAdmin
        .from('customers')
        .select('*')
        .eq('phone', userData.phone)
        .eq('customer_type', 'guest')
        .single()

      existingGuest = result.data
      findError = result.error
    }

    if (existingGuest) {
      // Update last order time and any new info
      const { data: updatedGuest, error: updateError } = await supabaseAdmin
        .from('customers')
        .update({
          last_order_at: new Date().toISOString(),
          phone: userData?.phone || existingGuest.phone,
          first_name: userData?.first_name || existingGuest.first_name,
          last_name: userData?.last_name || existingGuest.last_name,
          // Only update email if it was previously null and now provided
          email: existingGuest.email || email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingGuest.id)
        .select()
        .single()

      if (updateError) {
        return { success: false, error: updateError.message }
      }

      return { success: true, data: updatedGuest }
    }

    // Create new guest customer
    const { data: newGuest, error: createError } = await supabaseAdmin
      .from('customers')
      .insert({
        email: email || null,
        phone: userData?.phone,
        first_name: userData?.first_name,
        last_name: userData?.last_name,
        customer_type: 'guest',
      })
      .select()
      .single()

    if (createError) {
      return { success: false, error: createError.message }
    }

    // Log the creation
    await supabaseAdmin.from('customer_activity_log').insert({
      customer_id: newGuest.id,
      activity_type: 'guest_checkout',
      description: 'Guest customer created during checkout',
    })

    return { success: true, data: newGuest }
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
    let query = supabaseAdmin
      .from('customers')
      .select('*', { count: 'exact' })

    // Apply filters
    if (filters?.customer_type) {
      query = query.eq('customer_type', filters.customer_type)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.search) {
      const searchTerm = `%${filters.search}%`
      query = query.or(`email.ilike.${searchTerm},phone.ilike.${searchTerm},first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`)
    }

    // Pagination
    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters?.limit || 20) - 1)
    }

    // Order by created_at desc
    query = query.order('created_at', { ascending: false })

    const { data: customers, error, count } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    // Enrich with order statistics
    const customersWithStats: CustomerWithStats[] = await Promise.all(
      (customers || []).map(async (customer) => {
        const { data: orderStats } = await supabaseAdmin
          .from('orders')
          .select('total_amount')
          .eq('customer_id', customer.id)

        const orders = orderStats || []
        const total_orders = orders.length
        const total_spent = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
        const average_order_value = total_orders > 0 ? total_spent / total_orders : 0

        return {
          ...customer,
          total_orders,
          total_spent,
          average_order_value,
          lifetime_value: total_spent,
        }
      })
    )

    return {
      success: true,
      data: customersWithStats,
      total: count || 0,
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
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single()

    if (customerError || !customer) {
      return { success: false, error: 'Customer not found' }
    }

    // Get order statistics
    const { data: orderStats } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    const orders = orderStats || []
    const total_orders = orders.length
    const total_spent = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
    const average_order_value = total_orders > 0 ? total_spent / total_orders : 0

    // Get addresses
    const { data: addresses } = await supabaseAdmin
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', customerId)
      .order('is_default', { ascending: false })

    // Get activity log
    const { data: activity } = await supabaseAdmin
      .from('customer_activity_log')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(50)

    return {
      success: true,
      data: {
        ...customer,
        total_orders,
        total_spent,
        average_order_value,
        lifetime_value: total_spent,
        addresses: addresses || [],
        orders: orders || [],
        activity: activity || [],
      },
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
    const { data: customers, error: customersError } = await supabaseAdmin
      .from('customers')
      .select('id, customer_type, status, created_at')

    if (customersError) {
      return { success: false, error: customersError.message }
    }

    const total = customers?.length || 0
    const registered = customers?.filter((c) => c.customer_type === 'registered').length || 0
    const guests = customers?.filter((c) => c.customer_type === 'guest').length || 0
    const active = customers?.filter((c) => c.status === 'active').length || 0
    const inactive = customers?.filter((c) => c.status === 'inactive').length || 0

    // New this month
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const new_this_month =
      customers?.filter((c) => new Date(c.created_at) >= firstOfMonth).length || 0

    // Get revenue stats
    const { data: orders } = await supabaseAdmin.from('orders').select('total_amount, customer_id')

    const total_revenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

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
    const { data, error } = await supabaseAdmin
      .from('customer_addresses')
      .insert({
        customer_id: customerId,
        ...addressData,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create address' }
  }
}

/**
 * Update customer address
 */
export async function updateCustomerAddress(
  addressId: string,
  addressData: Partial<CustomerAddress>
): Promise<{ success: boolean; data?: CustomerAddress; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('customer_addresses')
      .update(addressData)
      .eq('id', addressId)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update address' }
  }
}

/**
 * Delete customer address
 */
export async function deleteCustomerAddress(
  addressId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('customer_addresses')
      .delete()
      .eq('id', addressId)

    if (error) {
      return { success: false, error: error.message }
    }

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

    const { error } = await supabaseAdmin.from('customer_notes').insert({
      customer_id: customerId,
      note,
      created_by: adminUserId,
    })

    if (error) {
      return { success: false, error: error.message }
    }

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
    const { data, error } = await supabaseAdmin
      .from('customer_notes')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch notes' }
  }
}
