export type StoreSettings = {
  id: string
  store_name: string
  legal_name: string | null
  description: string | null
  logo_url: string | null
  support_email: string | null
  support_phone: string | null
  gst_number: string | null
  invoice_prefix: string
  currency: string
  timezone: string
  address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string
  created_at: string
  updated_at: string
}

export type PaymentSettings = {
  id: string
  razorpay_enabled: boolean
  razorpay_key_id: string | null
  razorpay_key_secret: string | null
  razorpay_test_mode: boolean
  cod_enabled: boolean
  cod_max_amount: number | null
  payment_methods: string[]
  created_at: string
  updated_at: string
}

export type ShippingZone = {
  id: string
  name: string
  countries: string[]
  states: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ShippingRate = {
  id: string
  zone_id: string
  name: string
  rate_type: 'flat' | 'weight_based' | 'price_based'
  base_rate: number
  min_weight: number | null
  max_weight: number | null
  min_price: number | null
  max_price: number | null
  free_shipping_threshold: number | null
  estimated_days_min: number | null
  estimated_days_max: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type TaxSettings = {
  id: string
  tax_name: string
  tax_rate: number
  is_inclusive: boolean
  apply_to_shipping: boolean
  tax_id_required: boolean
  region_specific_rates: Record<string, number>
  created_at: string
  updated_at: string
}

export type SystemSettings = {
  id: string
  email_notifications_enabled: boolean
  order_number_format: string
  low_stock_threshold: number
  analytics_enabled: boolean
  maintenance_mode: boolean
  created_at: string
  updated_at: string
}

// NEW TYPES

export type StoreLocation = {
  id: string
  name: string
  location_type: 'warehouse' | 'store' | 'distribution'
  address: string
  city: string
  state: string
  pincode: string
  is_primary: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ShippingRule = {
  id: string
  zone: 'tamil_nadu' | 'south_india' | 'north_india' | 'east_india' | 'west_india' | 'all_india'
  min_quantity: number
  max_quantity: number | null // null = unlimited
  rate: number
  is_enabled: boolean
  created_at: string
  updated_at: string
}

export type SystemPreferences = {
  id: string
  // Order Behavior
  auto_cancel_enabled: boolean
  auto_cancel_minutes: number
  guest_checkout_enabled: boolean
  // Inventory Rules
  low_stock_threshold: number
  allow_backorders: boolean
  // Email Notifications
  order_placed_email: boolean
  order_shipped_email: boolean
  low_stock_alert: boolean
  // Free Shipping
  free_shipping_enabled: boolean
  free_shipping_threshold: number | null
  created_at: string
  updated_at: string
}

export type UpdateStoreSettingsInput = Partial<Omit<StoreSettings, 'id' | 'created_at' | 'updated_at'>>
export type UpdatePaymentSettingsInput = Partial<Omit<PaymentSettings, 'id' | 'created_at' | 'updated_at'>>
export type UpdateTaxSettingsInput = Partial<Omit<TaxSettings, 'id' | 'created_at' | 'updated_at'>>
export type UpdateSystemSettingsInput = Partial<Omit<SystemSettings, 'id' | 'created_at' | 'updated_at'>>

// NEW INPUT TYPES
export type CreateStoreLocationInput = Omit<StoreLocation, 'id' | 'created_at' | 'updated_at'>
export type UpdateStoreLocationInput = Partial<Omit<StoreLocation, 'id' | 'created_at' | 'updated_at'>>

export type CreateShippingRuleInput = Omit<ShippingRule, 'id' | 'created_at' | 'updated_at'>
export type UpdateShippingRuleInput = Partial<Omit<ShippingRule, 'id' | 'created_at' | 'updated_at'>>

export type UpdateSystemPreferencesInput = Partial<Omit<SystemPreferences, 'id' | 'created_at' | 'updated_at'>>
