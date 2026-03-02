import { prisma } from '@/lib/db'
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
  StoreLocation,
  CreateStoreLocationInput,
  UpdateStoreLocationInput,
  ShippingRule,
  CreateShippingRuleInput,
  UpdateShippingRuleInput,
  SystemPreferences,
  UpdateSystemPreferencesInput,
} from '@/lib/types/settings'

export class SettingsService {
  // ==================== STORE SETTINGS ====================

  static async getStoreSettings() {
    try {
      const data = await prisma.store_settings.findFirst()
      if (!data) return await this.createDefaultStoreSettings()
      return { success: true, data: data as unknown as StoreSettings }
    } catch (error: any) {
      console.error('Error fetching store settings:', error?.message)
      return { success: false, error: 'Failed to fetch store settings' }
    }
  }

  private static async createDefaultStoreSettings() {
    try {
      const data = await prisma.store_settings.create({
        data: {
          store_name: "Dude Men's Wears",
          legal_name: "Dude Men's Wears Pvt Ltd",
          description: "Premium men's clothing and accessories",
          invoice_prefix: 'DMW',
          currency: 'INR',
          timezone: 'Asia/Kolkata',
          country: 'India',
        } as any,
      })
      return { success: true, data: data as unknown as StoreSettings }
    } catch (error: any) {
      console.error('Error creating default store settings:', error?.message)
      return { success: false, error: `Failed to create default settings: ${error?.message}` }
    }
  }

  static async updateStoreSettings(id: string, input: UpdateStoreSettingsInput) {
    try {
      const data = await prisma.store_settings.update({
        where: { id },
        data: { ...input, updated_at: new Date() } as any,
      })
      return { success: true, data: data as unknown as StoreSettings }
    } catch (error: any) {
      console.error('Error updating store settings:', error?.message)
      return { success: false, error: 'Failed to update store settings' }
    }
  }

  // ==================== PAYMENT SETTINGS ====================

  static async getPaymentSettings() {
    try {
      const data = await prisma.payment_settings.findFirst()
      if (!data) return await this.createDefaultPaymentSettings()
      return { success: true, data: data as unknown as PaymentSettings }
    } catch (error: any) {
      console.error('Error fetching payment settings:', error?.message)
      return { success: false, error: 'Failed to fetch payment settings' }
    }
  }

  private static async createDefaultPaymentSettings() {
    try {
      const data = await prisma.payment_settings.create({
        data: {
          razorpay_enabled: false,
          razorpay_test_mode: true,
          cod_enabled: true,
          payment_methods: ['cod', 'razorpay'],
        } as any,
      })
      return { success: true, data: data as unknown as PaymentSettings }
    } catch (error: any) {
      console.error('Error creating default payment settings:', error?.message)
      return { success: false, error: 'Failed to create default payment settings' }
    }
  }

  static async updatePaymentSettings(id: string, input: UpdatePaymentSettingsInput) {
    try {
      const data = await prisma.payment_settings.update({
        where: { id },
        data: { ...input, updated_at: new Date() } as any,
      })
      return { success: true, data: data as unknown as PaymentSettings }
    } catch (error: any) {
      console.error('Error updating payment settings:', error?.message)
      return { success: false, error: 'Failed to update payment settings' }
    }
  }

  // ==================== SHIPPING ZONES ====================

  static async getShippingZones() {
    try {
      const data = await prisma.shipping_zones.findMany({ orderBy: { name: 'asc' } })
      return { success: true, data: data as unknown as ShippingZone[] }
    } catch (error: any) {
      console.error('Error fetching shipping zones:', error?.message)
      return { success: false, error: 'Failed to fetch shipping zones' }
    }
  }

  static async createShippingZone(input: Omit<ShippingZone, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const data = await prisma.shipping_zones.create({ data: { ...input } as any })
      return { success: true, data: data as unknown as ShippingZone }
    } catch (error: any) {
      console.error('Error creating shipping zone:', error?.message)
      return { success: false, error: 'Failed to create shipping zone' }
    }
  }

  static async updateShippingZone(
    id: string,
    input: Partial<Omit<ShippingZone, 'id' | 'created_at' | 'updated_at'>>
  ) {
    try {
      const data = await prisma.shipping_zones.update({
        where: { id },
        data: { ...input, updated_at: new Date() } as any,
      })
      return { success: true, data: data as unknown as ShippingZone }
    } catch (error: any) {
      console.error('Error updating shipping zone:', error?.message)
      return { success: false, error: 'Failed to update shipping zone' }
    }
  }

  static async deleteShippingZone(id: string) {
    try {
      await prisma.shipping_zones.delete({ where: { id } })
      return { success: true }
    } catch (error: any) {
      console.error('Error deleting shipping zone:', error?.message)
      return { success: false, error: 'Failed to delete shipping zone' }
    }
  }

  // ==================== SHIPPING RATES ====================

  static async getShippingRates(zoneId?: string) {
    try {
      const data = await prisma.shipping_rates.findMany({
        where: zoneId ? { zone_id: zoneId } : undefined,
        orderBy: { name: 'asc' } as any,
      })
      return { success: true, data: data as unknown as ShippingRate[] }
    } catch (error: any) {
      console.error('Error fetching shipping rates:', error?.message)
      return { success: false, error: 'Failed to fetch shipping rates' }
    }
  }

  static async createShippingRate(input: Omit<ShippingRate, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const data = await prisma.shipping_rates.create({ data: { ...input } as any })
      return { success: true, data: data as unknown as ShippingRate }
    } catch (error: any) {
      console.error('Error creating shipping rate:', error?.message)
      return { success: false, error: 'Failed to create shipping rate' }
    }
  }

  static async updateShippingRate(
    id: string,
    input: Partial<Omit<ShippingRate, 'id' | 'created_at' | 'updated_at'>>
  ) {
    try {
      const data = await prisma.shipping_rates.update({
        where: { id },
        data: { ...input, updated_at: new Date() } as any,
      })
      return { success: true, data: data as unknown as ShippingRate }
    } catch (error: any) {
      console.error('Error updating shipping rate:', error?.message)
      return { success: false, error: 'Failed to update shipping rate' }
    }
  }

  static async deleteShippingRate(id: string) {
    try {
      await prisma.shipping_rates.delete({ where: { id } })
      return { success: true }
    } catch (error: any) {
      console.error('Error deleting shipping rate:', error?.message)
      return { success: false, error: 'Failed to delete shipping rate' }
    }
  }

  // ==================== TAX SETTINGS ====================

  static async getTaxSettings() {
    try {
      const data = await prisma.tax_settings.findFirst()
      if (!data) return await this.createDefaultTaxSettings()
      return { success: true, data: data as unknown as TaxSettings }
    } catch (error: any) {
      console.error('Error fetching tax settings:', error?.message)
      return { success: false, error: 'Failed to fetch tax settings' }
    }
  }

  private static async createDefaultTaxSettings() {
    try {
      const data = await prisma.tax_settings.create({
        data: {
          tax_name: 'GST',
          tax_rate: 18,
          is_inclusive: true,
          apply_to_shipping: false,
          tax_id_required: false,
          region_specific_rates: {},
        } as any,
      })
      return { success: true, data: data as unknown as TaxSettings }
    } catch (error: any) {
      console.error('Error creating default tax settings:', error?.message)
      return { success: false, error: 'Failed to create default tax settings' }
    }
  }

  static async updateTaxSettings(id: string, input: UpdateTaxSettingsInput) {
    try {
      const data = await prisma.tax_settings.update({
        where: { id },
        data: { ...input, updated_at: new Date() } as any,
      })
      return { success: true, data: data as unknown as TaxSettings }
    } catch (error: any) {
      console.error('Error updating tax settings:', error?.message)
      return { success: false, error: 'Failed to update tax settings' }
    }
  }

  // ==================== SYSTEM SETTINGS ====================

  static async getSystemSettings() {
    try {
      const data = await prisma.system_settings.findFirst()
      if (!data) return await this.createDefaultSystemSettings()
      return { success: true, data: data as unknown as SystemSettings }
    } catch (error: any) {
      console.error('Error fetching system settings:', error?.message)
      return { success: false, error: 'Failed to fetch system settings' }
    }
  }

  private static async createDefaultSystemSettings() {
    try {
      const data = await prisma.system_settings.create({
        data: {
          email_notifications_enabled: true,
          order_number_format: 'DMW-{YYYY}{MM}{DD}-{XXXX}',
          low_stock_threshold: 5,
          analytics_enabled: true,
          maintenance_mode: false,
        } as any,
      })
      return { success: true, data: data as unknown as SystemSettings }
    } catch (error: any) {
      console.error('Error creating default system settings:', error?.message)
      return { success: false, error: 'Failed to create default system settings' }
    }
  }

  static async updateSystemSettings(id: string, input: UpdateSystemSettingsInput) {
    try {
      const data = await prisma.system_settings.update({
        where: { id },
        data: { ...input, updated_at: new Date() } as any,
      })
      return { success: true, data: data as unknown as SystemSettings }
    } catch (error: any) {
      console.error('Error updating system settings:', error?.message)
      return { success: false, error: 'Failed to update system settings' }
    }
  }

  // ==================== STORE LOCATIONS ====================

  static async getStoreLocations() {
    try {
      const data = await prisma.store_locations.findMany({
        orderBy: [{ is_primary: 'desc' }, { name: 'asc' }] as any,
      })
      return { success: true, data: data as unknown as StoreLocation[] }
    } catch (error: any) {
      console.error('Error fetching store locations:', error?.message)
      return { success: false, error: 'Failed to fetch store locations' }
    }
  }

  static async createStoreLocation(input: CreateStoreLocationInput) {
    try {
      const data = await prisma.store_locations.create({ data: { ...input } as any })
      return { success: true, data: data as unknown as StoreLocation }
    } catch (error: any) {
      console.error('Error creating store location:', error?.message)
      return { success: false, error: 'Failed to create store location' }
    }
  }

  static async updateStoreLocation(id: string, input: UpdateStoreLocationInput) {
    try {
      const data = await prisma.store_locations.update({
        where: { id },
        data: { ...input, updated_at: new Date() } as any,
      })
      return { success: true, data: data as unknown as StoreLocation }
    } catch (error: any) {
      console.error('Error updating store location:', error?.message)
      return { success: false, error: 'Failed to update store location' }
    }
  }

  static async deleteStoreLocation(id: string) {
    try {
      await prisma.store_locations.delete({ where: { id } })
      return { success: true }
    } catch (error: any) {
      console.error('Error deleting store location:', error?.message)
      return { success: false, error: 'Failed to delete store location' }
    }
  }

  // ==================== SHIPPING RULES ====================

  static async getShippingRules() {
    try {
      const data = await prisma.shipping_rules.findMany({
        orderBy: [{ zone: 'asc' }, { min_quantity: 'asc' }] as any,
      })
      return { success: true, data: data as unknown as ShippingRule[] }
    } catch (error: any) {
      console.error('Error fetching shipping rules:', error?.message)
      return { success: false, error: 'Failed to fetch shipping rules' }
    }
  }

  static async createShippingRule(input: CreateShippingRuleInput) {
    try {
      const data = await prisma.shipping_rules.create({ data: { ...input } as any })
      return { success: true, data: data as unknown as ShippingRule }
    } catch (error: any) {
      console.error('Error creating shipping rule:', error?.message)
      return { success: false, error: 'Failed to create shipping rule' }
    }
  }

  static async updateShippingRule(id: string, input: UpdateShippingRuleInput) {
    try {
      const data = await prisma.shipping_rules.update({
        where: { id },
        data: { ...input, updated_at: new Date() } as any,
      })
      return { success: true, data: data as unknown as ShippingRule }
    } catch (error: any) {
      console.error('Error updating shipping rule:', error?.message)
      return { success: false, error: 'Failed to update shipping rule' }
    }
  }

  static async deleteShippingRule(id: string) {
    try {
      await prisma.shipping_rules.delete({ where: { id } })
      return { success: true }
    } catch (error: any) {
      console.error('Error deleting shipping rule:', error?.message)
      return { success: false, error: 'Failed to delete shipping rule' }
    }
  }

  // ==================== SYSTEM PREFERENCES ====================

  static async getSystemPreferences() {
    try {
      const data = await prisma.system_preferences.findFirst()
      if (!data) return await this.createDefaultSystemPreferences()
      return { success: true, data: data as unknown as SystemPreferences }
    } catch (error: any) {
      console.error('Error fetching system preferences:', error?.message)
      return { success: false, error: 'Failed to fetch system preferences' }
    }
  }

  private static async createDefaultSystemPreferences() {
    try {
      const data = await prisma.system_preferences.create({
        data: {
          auto_cancel_enabled: true,
          auto_cancel_minutes: 30,
          guest_checkout_enabled: true,
          low_stock_threshold: 10,
          allow_backorders: false,
          order_placed_email: true,
          order_shipped_email: true,
          low_stock_alert: true,
          free_shipping_enabled: false,
          free_shipping_threshold: null,
        } as any,
      })
      return { success: true, data: data as unknown as SystemPreferences }
    } catch (error: any) {
      console.error('Error creating default system preferences:', error?.message)
      return { success: false, error: 'Failed to create default system preferences' }
    }
  }

  static async updateSystemPreferences(id: string, input: UpdateSystemPreferencesInput) {
    try {
      const data = await prisma.system_preferences.update({
        where: { id },
        data: { ...input, updated_at: new Date() } as any,
      })
      return { success: true, data: data as unknown as SystemPreferences }
    } catch (error: any) {
      console.error('Error updating system preferences:', error?.message)
      return { success: false, error: 'Failed to update system preferences' }
    }
  }
}
