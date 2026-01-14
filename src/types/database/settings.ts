import type { Json } from './common'

export interface StoreSettingsTable {
    Row: {
        id: string
        store_name: string
        legal_name: string | null
        description: string | null
        logo_url: string | null
        support_email: string | null
        support_phone: string | null
        address: string | null
        city: string | null
        state: string | null
        postal_code: string | null
        country: string
        currency: string
        timezone: string
        gst_number: string | null
        invoice_prefix: string
        terms_url: string | null
        privacy_url: string | null
        created_at: string | null
        updated_at: string | null
    }
    Insert: {
        id?: string
        store_name?: string
        legal_name?: string | null
        description?: string | null
        logo_url?: string | null
        support_email?: string | null
        support_phone?: string | null
        address?: string | null
        city?: string | null
        state?: string | null
        postal_code?: string | null
        country?: string
        currency?: string
        timezone?: string
        gst_number?: string | null
        invoice_prefix?: string
        terms_url?: string | null
        privacy_url?: string | null
        created_at?: string | null
        updated_at?: string | null
    }
    Update: {
        id?: string
        store_name?: string
        legal_name?: string | null
        description?: string | null
        logo_url?: string | null
        support_email?: string | null
        support_phone?: string | null
        address?: string | null
        city?: string | null
        state?: string | null
        postal_code?: string | null
        country?: string
        currency?: string
        timezone?: string
        gst_number?: string | null
        invoice_prefix?: string
        terms_url?: string | null
        privacy_url?: string | null
        created_at?: string | null
        updated_at?: string | null
    }
    Relationships: []
}

export interface SystemPreferencesTable {
    Row: {
        id: string
        low_stock_threshold: number | null
        low_stock_alert: boolean | null
        allow_backorders: boolean | null
        free_shipping_enabled: boolean | null
        free_shipping_threshold: number | null
        guest_checkout_enabled: boolean | null
        auto_cancel_enabled: boolean | null
        auto_cancel_minutes: number | null
        order_placed_email: boolean | null
        order_shipped_email: boolean | null
        min_delivery_days: number | null
        max_delivery_days: number | null
        created_at: string | null
        updated_at: string | null
    }
    Insert: {
        id?: string
        low_stock_threshold?: number | null
        low_stock_alert?: boolean | null
        allow_backorders?: boolean | null
        free_shipping_enabled?: boolean | null
        free_shipping_threshold?: number | null
        guest_checkout_enabled?: boolean | null
        auto_cancel_enabled?: boolean | null
        auto_cancel_minutes?: number | null
        order_placed_email?: boolean | null
        order_shipped_email?: boolean | null
        min_delivery_days?: number | null
        max_delivery_days?: number | null
        created_at?: string | null
        updated_at?: string | null
    }
    Update: {
        id?: string
        low_stock_threshold?: number | null
        low_stock_alert?: boolean | null
        allow_backorders?: boolean | null
        free_shipping_enabled?: boolean | null
        free_shipping_threshold?: number | null
        guest_checkout_enabled?: boolean | null
        auto_cancel_enabled?: boolean | null
        auto_cancel_minutes?: number | null
        order_placed_email?: boolean | null
        order_shipped_email?: boolean | null
        min_delivery_days?: number | null
        max_delivery_days?: number | null
        created_at?: string | null
        updated_at?: string | null
    }
    Relationships: []
}

export interface PaymentSettingsTable {
    Row: {
        id: string
        razorpay_enabled: boolean | null
        razorpay_key_id: string | null
        razorpay_key_secret: string | null
        razorpay_test_mode: boolean | null
        cod_enabled: boolean | null
        cod_max_amount: number | null
        payment_methods: string[] | null
        created_at: string | null
        updated_at: string | null
    }
    Insert: {
        id?: string
        razorpay_enabled?: boolean | null
        razorpay_key_id?: string | null
        razorpay_key_secret?: string | null
        razorpay_test_mode?: boolean | null
        cod_enabled?: boolean | null
        cod_max_amount?: number | null
        payment_methods?: string[] | null
        created_at?: string | null
        updated_at?: string | null
    }
    Update: {
        id?: string
        razorpay_enabled?: boolean | null
        razorpay_key_id?: string | null
        razorpay_key_secret?: string | null
        razorpay_test_mode?: boolean | null
        cod_enabled?: boolean | null
        cod_max_amount?: number | null
        payment_methods?: string[] | null
        created_at?: string | null
        updated_at?: string | null
    }
    Relationships: []
}

export interface TaxSettingsTable {
    Row: {
        id: string
        tax_name: string
        tax_rate: number
        is_inclusive: boolean | null
        apply_to_shipping: boolean | null
        created_at: string | null
        updated_at: string | null
    }
    Insert: {
        id?: string
        tax_name: string
        tax_rate: number
        is_inclusive?: boolean | null
        apply_to_shipping?: boolean | null
        created_at?: string | null
        updated_at?: string | null
    }
    Update: {
        id?: string
        tax_name?: string
        tax_rate?: number
        is_inclusive?: boolean | null
        apply_to_shipping?: boolean | null
        created_at?: string | null
        updated_at?: string | null
    }
    Relationships: []
}

export interface SystemSettingsTable {
    Row: {
        id: string
        email_notifications_enabled: boolean | null
        order_number_format: string | null
        analytics_enabled: boolean | null
        maintenance_mode: boolean | null
        created_at: string | null
        updated_at: string | null
    }
    Insert: {
        id?: string
        email_notifications_enabled?: boolean | null
        order_number_format?: string | null
        analytics_enabled?: boolean | null
        maintenance_mode?: boolean | null
        created_at?: string | null
        updated_at?: string | null
    }
    Update: {
        id?: string
        email_notifications_enabled?: boolean | null
        order_number_format?: string | null
        analytics_enabled?: boolean | null
        maintenance_mode?: boolean | null
        created_at?: string | null
        updated_at?: string | null
    }
    Relationships: []
}

export interface InventorySettingsTable {
    Row: {
        id: string
        low_stock_threshold: number | null
        low_stock_alert: boolean | null
        allow_backorders: boolean | null
        free_shipping_enabled: boolean | null
        free_shipping_threshold: number | null
        created_at: string | null
        updated_at: string | null
    }
    Insert: {
        id?: string
        low_stock_threshold?: number | null
        low_stock_alert?: boolean | null
        allow_backorders?: boolean | null
        free_shipping_enabled?: boolean | null
        free_shipping_threshold?: number | null
        created_at?: string | null
        updated_at?: string | null
    }
    Update: {
        id?: string
        low_stock_threshold?: number | null
        low_stock_alert?: boolean | null
        allow_backorders?: boolean | null
        free_shipping_enabled?: boolean | null
        free_shipping_threshold?: number | null
        created_at?: string | null
        updated_at?: string | null
    }
    Relationships: []
}

export interface ShippingZonesTable {
    Row: {
        id: string
        name: string
        countries: string[] | null
        states: string[] | null
        is_active: boolean | null
        created_at: string | null
        updated_at: string | null
    }
    Insert: {
        id?: string
        name: string
        countries?: string[] | null
        states?: string[] | null
        is_active?: boolean | null
        created_at?: string | null
        updated_at?: string | null
    }
    Update: {
        id?: string
        name?: string
        countries?: string[] | null
        states?: string[] | null
        is_active?: boolean | null
        created_at?: string | null
        updated_at?: string | null
    }
    Relationships: []
}

export interface ShippingRatesTable {
    Row: {
        id: string
        zone_id: string
        name: string
        rate_type: string | null
        base_rate: number
        per_kg_rate: number | null
        min_weight: number | null
        max_weight: number | null
        min_delivery_days: number | null
        max_delivery_days: number | null
        is_enabled: boolean | null
        created_at: string | null
        updated_at: string | null
    }
    Insert: {
        id?: string
        zone_id: string
        name: string
        rate_type?: string | null
        base_rate: number
        per_kg_rate?: number | null
        min_weight?: number | null
        max_weight?: number | null
        min_delivery_days?: number | null
        max_delivery_days?: number | null
        is_enabled?: boolean | null
        created_at?: string | null
        updated_at?: string | null
    }
    Update: {
        id?: string
        zone_id?: string
        name?: string
        rate_type?: string | null
        base_rate?: number
        per_kg_rate?: number | null
        min_weight?: number | null
        max_weight?: number | null
        min_delivery_days?: number | null
        max_delivery_days?: number | null
        is_enabled?: boolean | null
        created_at?: string | null
        updated_at?: string | null
    }
    Relationships: [
        {
            foreignKeyName: "shipping_rates_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "shipping_zones"
            referencedColumns: ["id"]
        },
    ]
}

export interface ShippingRulesTable {
    Row: {
        id: string
        zone: string
        min_quantity: number | null
        max_quantity: number | null
        rate: number
        is_enabled: boolean | null
        created_at: string | null
        updated_at: string | null
    }
    Insert: {
        id?: string
        zone: string
        min_quantity?: number | null
        max_quantity?: number | null
        rate: number
        is_enabled?: boolean | null
        created_at?: string | null
        updated_at?: string | null
    }
    Update: {
        id?: string
        zone?: string
        min_quantity?: number | null
        max_quantity?: number | null
        rate?: number
        is_enabled?: boolean | null
        created_at?: string | null
        updated_at?: string | null
    }
    Relationships: []
}

export interface StoreLocationsTable {
    Row: {
        id: string
        name: string
        location_type: string | null
        address: string | null
        city: string | null
        state: string | null
        pincode: string | null
        is_primary: boolean | null
        is_active: boolean | null
        phone: string | null
        operating_hours: Json | null
        created_at: string | null
        updated_at: string | null
    }
    Insert: {
        id?: string
        name: string
        location_type?: string | null
        address?: string | null
        city?: string | null
        state?: string | null
        pincode?: string | null
        is_primary?: boolean | null
        is_active?: boolean | null
        phone?: string | null
        operating_hours?: Json | null
        created_at?: string | null
        updated_at?: string | null
    }
    Update: {
        id?: string
        name?: string
        location_type?: string | null
        address?: string | null
        city?: string | null
        state?: string | null
        pincode?: string | null
        is_primary?: boolean | null
        is_active?: boolean | null
        phone?: string | null
        operating_hours?: Json | null
        created_at?: string | null
        updated_at?: string | null
    }
    Relationships: []
}

export interface CategoryTaxRulesTable {
    Row: {
        id: string
        category_id: string
        gst_rate: number
        created_at: string | null
        updated_at: string | null
    }
    Insert: {
        id?: string
        category_id: string
        gst_rate: number
        created_at?: string | null
        updated_at?: string | null
    }
    Update: {
        id?: string
        category_id?: string
        gst_rate?: number
        created_at?: string | null
        updated_at?: string | null
    }
    Relationships: [
        {
            foreignKeyName: "category_tax_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
        }
    ]
}

