/**
 * Client-side Settings Service
 * Uses API routes for all database operations
 * This replaces direct Supabase calls from client components
 */

import {
  StoreSettings,
  PaymentSettings,
  TaxSettings,
  StoreLocation,
  CreateStoreLocationInput,
  UpdateStoreLocationInput,
  ShippingRule,
  CreateShippingRuleInput,
  UpdateShippingRuleInput,
  SystemPreferences,
  UpdateSystemPreferencesInput,
} from '@/lib/types/settings'

export class SettingsClientService {
  // ==================== STORE SETTINGS ====================

  static async getStoreSettings() {
    try {
      const response = await fetch('/api/settings/store-settings')
      const result = await response.json()
      return result
    } catch (error: any) {
      console.error('Error fetching store settings:', error)
      return { success: false, error: 'Failed to fetch store settings' }
    }
  }

  static async updateStoreSettings(id: string, input: Partial<StoreSettings>) {
    try {
      const response = await fetch('/api/settings/store-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...input }),
      })
      const result = await response.json()
      return result
    } catch (error: any) {
      console.error('Error updating store settings:', error)
      return { success: false, error: 'Failed to update store settings' }
    }
  }

  // ==================== PAYMENT SETTINGS ====================

  static async getPaymentSettings() {
    try {
      const response = await fetch('/api/settings/payment-settings')
      const result = await response.json()
      return result
    } catch (error: any) {
      console.error('Error fetching payment settings:', error)
      return { success: false, error: 'Failed to fetch payment settings' }
    }
  }

  static async updatePaymentSettings(id: string, input: Partial<PaymentSettings>) {
    try {
      const response = await fetch('/api/settings/payment-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...input }),
      })
      const result = await response.json()
      return result
    } catch (error: any) {
      console.error('Error updating payment settings:', error)
      return { success: false, error: 'Failed to update payment settings' }
    }
  }

  // ==================== TAX SETTINGS ====================

  static async getTaxSettings() {
    try {
      const response = await fetch('/api/settings/tax-settings')
      const result = await response.json()
      return result
    } catch (error: any) {
      console.error('Error fetching tax settings:', error)
      return { success: false, error: 'Failed to fetch tax settings' }
    }
  }

  static async updateTaxSettings(id: string, input: Partial<TaxSettings>) {
    try {
      const response = await fetch('/api/settings/tax-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...input }),
      })
      const result = await response.json()
      return result
    } catch (error: any) {
      console.error('Error updating tax settings:', error)
      return { success: false, error: 'Failed to update tax settings' }
    }
  }

  // ==================== STORE LOCATIONS ====================

  static async getStoreLocations() {
    try {
      const response = await fetch('/api/settings/locations')
      const result = await response.json()
      return result
    } catch (error: any) {
      console.error('Error fetching store locations:', error)
      return { success: false, error: 'Failed to fetch store locations' }
    }
  }

  static async createStoreLocation(input: CreateStoreLocationInput) {
    try {
      const response = await fetch('/api/settings/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const result = await response.json()
      return result
    } catch (error: any) {
      console.error('Error creating store location:', error)
      return { success: false, error: 'Failed to create store location' }
    }
  }

  static async updateStoreLocation(id: string, input: UpdateStoreLocationInput) {
    try {
      const response = await fetch('/api/settings/locations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...input }),
      })
      const result = await response.json()
      return result
    } catch (error: any) {
      console.error('Error updating store location:', error)
      return { success: false, error: 'Failed to update store location' }
    }
  }

  static async deleteStoreLocation(id: string) {
    try {
      const response = await fetch(`/api/settings/locations?id=${id}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      return result
    } catch (error: any) {
      console.error('Error deleting store location:', error)
      return { success: false, error: 'Failed to delete store location' }
    }
  }

  // ==================== SHIPPING RULES ====================

  static async getShippingRules() {
    try {
      const response = await fetch('/api/settings/shipping-rules')
      const result = await response.json()
      return result
    } catch (error: any) {
      console.error('Error fetching shipping rules:', error)
      return { success: false, error: 'Failed to fetch shipping rules' }
    }
  }

  static async createShippingRule(input: CreateShippingRuleInput) {
    try {
      const response = await fetch('/api/settings/shipping-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const result = await response.json()
      return result
    } catch (error: any) {
      console.error('Error creating shipping rule:', error)
      return { success: false, error: 'Failed to create shipping rule' }
    }
  }

  static async updateShippingRule(id: string, input: UpdateShippingRuleInput) {
    try {
      const response = await fetch('/api/settings/shipping-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...input }),
      })
      const result = await response.json()
      return result
    } catch (error: any) {
      console.error('Error updating shipping rule:', error)
      return { success: false, error: 'Failed to update shipping rule' }
    }
  }

  static async deleteShippingRule(id: string) {
    try {
      const response = await fetch(`/api/settings/shipping-rules?id=${id}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      return result
    } catch (error: any) {
      console.error('Error deleting shipping rule:', error)
      return { success: false, error: 'Failed to delete shipping rule' }
    }
  }

  // ==================== SYSTEM PREFERENCES ====================

  static async getSystemPreferences() {
    try {
      const response = await fetch('/api/settings/system-preferences')
      const result = await response.json()
      return result
    } catch (error: any) {
      console.error('Error fetching system preferences:', error)
      return { success: false, error: 'Failed to fetch system preferences' }
    }
  }

  static async updateSystemPreferences(id: string, input: UpdateSystemPreferencesInput) {
    try {
      const response = await fetch('/api/settings/system-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...input }),
      })
      const result = await response.json()
      return result
    } catch (error: any) {
      console.error('Error updating system preferences:', error)
      return { success: false, error: 'Failed to update system preferences' }
    }
  }
}
