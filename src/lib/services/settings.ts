import { supabaseAdmin } from '@/lib/supabase/supabase'
import {
  StoreSettings,
  PaymentSettings,
  ShippingZone,
  ShippingRate,
  TaxSettings,
  SystemSettings,
  UpdateStoreSettingsInput,
  UpdatePaymentSettingsInput,
  UpdateTaxSettingsInput,
  UpdateSystemSettingsInput,
} from '@/lib/types/settings'

export class SettingsService {
  // ==================== STORE SETTINGS ====================

  /**
   * Get store settings
   */
  static async getStoreSettings() {
    try {
      const { data, error } = await supabaseAdmin
        .from('store_settings')
        .select('*')
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching store settings:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      // If no settings exist, create default
      if (!data) {
        return await this.createDefaultStoreSettings()
      }

      return { success: true, data: data as StoreSettings }
    } catch (error: any) {
      console.error('Error fetching store settings:', {
        message: error?.message || 'Unknown error'
      })
      return { success: false, error: 'Failed to fetch store settings' }
    }
  }

  /**
   * Create default store settings
   */
  private static async createDefaultStoreSettings() {
    try {
      const defaultSettings = {
        store_name: 'Dude Men\'s Wears',
        legal_name: 'Dude Men\'s Wears Pvt Ltd',
        description: 'Premium men\'s clothing and accessories',
        invoice_prefix: 'DMW',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        country: 'India',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabaseAdmin
        .from('store_settings')
        .insert(defaultSettings)
        .select()
        .single()

      if (error) {
        console.error('Error creating default store settings:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          full_error: error
        })
        throw error
      }

      return { success: true, data: data as StoreSettings }
    } catch (error: any) {
      console.error('Error creating default store settings:', {
        message: error?.message || 'Unknown error',
        details: error?.details || 'No details',
        hint: error?.hint || 'No hint',
        code: error?.code || 'No code',
        stack: error?.stack,
        full_error: error
      })
      return { success: false, error: `Failed to create default settings: ${error?.message || 'Unknown error'}` }
    }
  }

  /**
   * Update store settings
   */
  static async updateStoreSettings(id: string, input: UpdateStoreSettingsInput) {
    try {
      const { data, error } = await supabaseAdmin
        .from('store_settings')
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating store settings:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          id
        })
        throw error
      }

      return { success: true, data: data as StoreSettings }
    } catch (error: any) {
      console.error('Error updating store settings:', {
        message: error?.message || 'Unknown error',
        id
      })
      return { success: false, error: 'Failed to update store settings' }
    }
  }

  // ==================== PAYMENT SETTINGS ====================

  /**
   * Get payment settings
   */
  static async getPaymentSettings() {
    try {
      const { data, error } = await supabaseAdmin
        .from('payment_settings')
        .select('*')
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching payment settings:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      // If no settings exist, create default
      if (!data) {
        return await this.createDefaultPaymentSettings()
      }

      return { success: true, data: data as PaymentSettings }
    } catch (error: any) {
      console.error('Error fetching payment settings:', {
        message: error?.message || 'Unknown error'
      })
      return { success: false, error: 'Failed to fetch payment settings' }
    }
  }

  /**
   * Create default payment settings
   */
  private static async createDefaultPaymentSettings() {
    try {
      const defaultSettings = {
        razorpay_enabled: false,
        razorpay_test_mode: true,
        cod_enabled: true,
        payment_methods: ['cod', 'razorpay'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabaseAdmin
        .from('payment_settings')
        .insert(defaultSettings)
        .select()
        .single()

      if (error) {
        console.error('Error creating default payment settings:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      return { success: true, data: data as PaymentSettings }
    } catch (error: any) {
      console.error('Error creating default payment settings:', {
        message: error?.message || 'Unknown error',
        stack: error?.stack
      })
      return { success: false, error: 'Failed to create default payment settings' }
    }
  }

  /**
   * Update payment settings
   */
  static async updatePaymentSettings(id: string, input: UpdatePaymentSettingsInput) {
    try {
      const { data, error } = await supabaseAdmin
        .from('payment_settings')
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating payment settings:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          id
        })
        throw error
      }

      return { success: true, data: data as PaymentSettings }
    } catch (error: any) {
      console.error('Error updating payment settings:', {
        message: error?.message || 'Unknown error',
        id
      })
      return { success: false, error: 'Failed to update payment settings' }
    }
  }

  // ==================== SHIPPING SETTINGS ====================

  /**
   * Get all shipping zones
   */
  static async getShippingZones() {
    try {
      const { data, error } = await supabaseAdmin
        .from('shipping_zones')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching shipping zones:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      return { success: true, data: data as ShippingZone[] }
    } catch (error: any) {
      console.error('Error fetching shipping zones:', {
        message: error?.message || 'Unknown error'
      })
      return { success: false, error: 'Failed to fetch shipping zones' }
    }
  }

  /**
   * Create shipping zone
   */
  static async createShippingZone(input: Omit<ShippingZone, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('shipping_zones')
        .insert({
          ...input,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating shipping zone:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      return { success: true, data: data as ShippingZone }
    } catch (error: any) {
      console.error('Error creating shipping zone:', {
        message: error?.message || 'Unknown error'
      })
      return { success: false, error: 'Failed to create shipping zone' }
    }
  }

  /**
   * Update shipping zone
   */
  static async updateShippingZone(id: string, input: Partial<Omit<ShippingZone, 'id' | 'created_at' | 'updated_at'>>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('shipping_zones')
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating shipping zone:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          id
        })
        throw error
      }

      return { success: true, data: data as ShippingZone }
    } catch (error: any) {
      console.error('Error updating shipping zone:', {
        message: error?.message || 'Unknown error',
        id
      })
      return { success: false, error: 'Failed to update shipping zone' }
    }
  }

  /**
   * Delete shipping zone
   */
  static async deleteShippingZone(id: string) {
    try {
      const { error } = await supabaseAdmin.from('shipping_zones').delete().eq('id', id)

      if (error) {
        console.error('Error deleting shipping zone:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          id
        })
        throw error
      }

      return { success: true }
    } catch (error: any) {
      console.error('Error deleting shipping zone:', {
        message: error?.message || 'Unknown error',
        id
      })
      return { success: false, error: 'Failed to delete shipping zone' }
    }
  }

  /**
   * Get shipping rates for a zone
   */
  static async getShippingRates(zoneId?: string) {
    try {
      let query = supabaseAdmin.from('shipping_rates').select('*')

      if (zoneId) {
        query = query.eq('zone_id', zoneId)
      }

      const { data, error } = await query.order('name', { ascending: true })

      if (error) {
        console.error('Error fetching shipping rates:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          zoneId
        })
        throw error
      }

      return { success: true, data: data as ShippingRate[] }
    } catch (error: any) {
      console.error('Error fetching shipping rates:', {
        message: error?.message || 'Unknown error',
        zoneId
      })
      return { success: false, error: 'Failed to fetch shipping rates' }
    }
  }

  /**
   * Create shipping rate
   */
  static async createShippingRate(input: Omit<ShippingRate, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('shipping_rates')
        .insert({
          ...input,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating shipping rate:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      return { success: true, data: data as ShippingRate }
    } catch (error: any) {
      console.error('Error creating shipping rate:', {
        message: error?.message || 'Unknown error'
      })
      return { success: false, error: 'Failed to create shipping rate' }
    }
  }

  /**
   * Update shipping rate
   */
  static async updateShippingRate(id: string, input: Partial<Omit<ShippingRate, 'id' | 'created_at' | 'updated_at'>>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('shipping_rates')
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating shipping rate:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          id
        })
        throw error
      }

      return { success: true, data: data as ShippingRate }
    } catch (error: any) {
      console.error('Error updating shipping rate:', {
        message: error?.message || 'Unknown error',
        id
      })
      return { success: false, error: 'Failed to update shipping rate' }
    }
  }

  /**
   * Delete shipping rate
   */
  static async deleteShippingRate(id: string) {
    try {
      const { error } = await supabaseAdmin.from('shipping_rates').delete().eq('id', id)

      if (error) {
        console.error('Error deleting shipping rate:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          id
        })
        throw error
      }

      return { success: true }
    } catch (error: any) {
      console.error('Error deleting shipping rate:', {
        message: error?.message || 'Unknown error',
        id
      })
      return { success: false, error: 'Failed to delete shipping rate' }
    }
  }

  // ==================== TAX SETTINGS ====================

  /**
   * Get tax settings
   */
  static async getTaxSettings() {
    try {
      const { data, error } = await supabaseAdmin
        .from('tax_settings')
        .select('*')
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching tax settings:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      // If no settings exist, create default
      if (!data) {
        return await this.createDefaultTaxSettings()
      }

      return { success: true, data: data as TaxSettings }
    } catch (error: any) {
      console.error('Error fetching tax settings:', {
        message: error?.message || 'Unknown error'
      })
      return { success: false, error: 'Failed to fetch tax settings' }
    }
  }

  /**
   * Create default tax settings
   */
  private static async createDefaultTaxSettings() {
    try {
      const defaultSettings = {
        tax_name: 'GST',
        tax_rate: 18,
        is_inclusive: true,
        apply_to_shipping: false,
        tax_id_required: false,
        region_specific_rates: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabaseAdmin
        .from('tax_settings')
        .insert(defaultSettings)
        .select()
        .single()

      if (error) {
        console.error('Error creating default tax settings:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      return { success: true, data: data as TaxSettings }
    } catch (error: any) {
      console.error('Error creating default tax settings:', {
        message: error?.message || 'Unknown error',
        stack: error?.stack
      })
      return { success: false, error: 'Failed to create default tax settings' }
    }
  }

  /**
   * Update tax settings
   */
  static async updateTaxSettings(id: string, input: UpdateTaxSettingsInput) {
    try {
      const { data, error } = await supabaseAdmin
        .from('tax_settings')
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating tax settings:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          id
        })
        throw error
      }

      return { success: true, data: data as TaxSettings }
    } catch (error: any) {
      console.error('Error updating tax settings:', {
        message: error?.message || 'Unknown error',
        id
      })
      return { success: false, error: 'Failed to update tax settings' }
    }
  }

  // ==================== SYSTEM SETTINGS ====================

  /**
   * Get system settings
   */
  static async getSystemSettings() {
    try {
      const { data, error } = await supabaseAdmin
        .from('system_settings')
        .select('*')
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching system settings:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      // If no settings exist, create default
      if (!data) {
        return await this.createDefaultSystemSettings()
      }

      return { success: true, data: data as SystemSettings }
    } catch (error: any) {
      console.error('Error fetching system settings:', {
        message: error?.message || 'Unknown error'
      })
      return { success: false, error: 'Failed to fetch system settings' }
    }
  }

  /**
   * Create default system settings
   */
  private static async createDefaultSystemSettings() {
    try {
      const defaultSettings = {
        email_notifications_enabled: true,
        order_number_format: 'DMW-{YYYY}{MM}{DD}-{XXXX}',
        low_stock_threshold: 5,
        analytics_enabled: true,
        maintenance_mode: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabaseAdmin
        .from('system_settings')
        .insert(defaultSettings)
        .select()
        .single()

      if (error) {
        console.error('Error creating default system settings:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      return { success: true, data: data as SystemSettings }
    } catch (error: any) {
      console.error('Error creating default system settings:', {
        message: error?.message || 'Unknown error',
        stack: error?.stack
      })
      return { success: false, error: 'Failed to create default system settings' }
    }
  }

  /**
   * Update system settings
   */
  static async updateSystemSettings(id: string, input: UpdateSystemSettingsInput) {
    try {
      const { data, error } = await supabaseAdmin
        .from('system_settings')
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating system settings:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          id
        })
        throw error
      }

      return { success: true, data: data as SystemSettings }
    } catch (error: any) {
      console.error('Error updating system settings:', {
        message: error?.message || 'Unknown error',
        id
      })
      return { success: false, error: 'Failed to update system settings' }
    }
  }
}
