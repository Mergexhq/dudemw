import { Json } from './common'

export interface CustomersTable {
    Row: {
        id: string
        auth_user_id: string | null
        email: string | null
        phone: string | null
        first_name: string | null
        last_name: string | null
        customer_type: "guest" | "registered"
        status: "active" | "inactive" | "blocked" | "merged"
        metadata: any
        last_order_at: string | null
        created_at: string
        updated_at: string
    }
    Insert: {
        id?: string
        auth_user_id?: string | null
        email?: string | null
        phone?: string | null
        first_name?: string | null
        last_name?: string | null
        customer_type?: "guest" | "registered"
        status?: "active" | "inactive" | "blocked" | "merged"
        metadata?: any
        last_order_at?: string | null
        created_at?: string
        updated_at?: string
    }
    Update: {
        id?: string
        auth_user_id?: string | null
        email?: string | null
        phone?: string | null
        first_name?: string | null
        last_name?: string | null
        customer_type?: "guest" | "registered"
        status?: "active" | "inactive" | "blocked" | "merged"
        metadata?: any
        last_order_at?: string | null
        created_at?: string | null
        updated_at?: string | null
    }
    Relationships: []
}

export interface ProfilesTable {
    Row: {
        id: string
        full_name: string | null
        phone: string | null
        avatar_url: string | null
        created_at: string | null
        updated_at: string | null
    }
    Insert: {
        id: string
        full_name?: string | null
        phone?: string | null
        avatar_url?: string | null
        created_at?: string | null
        updated_at?: string | null
    }
    Update: {
        id?: string
        full_name?: string | null
        phone?: string | null
        avatar_url?: string | null
        created_at?: string | null
        updated_at?: string | null
    }
    Relationships: []
}

export interface AdminProfilesTable {
    Row: {
        id: string
        user_id: string
        role: string
        full_name: string | null
        avatar_url: string | null
        is_active: boolean | null
        approved_by: string | null
        approved_at: string | null
        created_at: string | null
        updated_at: string | null
    }
    Insert: {
        id?: string
        user_id: string
        role: string
        full_name?: string | null
        avatar_url?: string | null
        is_active?: boolean | null
        approved_by?: string | null
        approved_at?: string | null
        created_at?: string | null
        updated_at?: string | null
    }
    Update: {
        id?: string
        user_id?: string
        role?: string
        full_name?: string | null
        avatar_url?: string | null
        is_active?: boolean | null
        approved_by?: string | null
        approved_at?: string | null
        created_at?: string | null
        updated_at?: string | null
    }
    Relationships: []
}

export interface AuditLogsTable {
    Row: {
        id: string
        admin_id: string | null
        action: string
        entity_type: string
        entity_id: string | null
        details: Json | null
        created_at: string | null
    }
    Insert: {
        id?: string
        admin_id?: string | null
        action: string
        entity_type: string
        entity_id?: string | null
        details?: Json | null
        created_at?: string | null
    }
    Update: {
        id?: string
        admin_id?: string | null
        action?: string
        entity_type?: string
        entity_id?: string | null
        details?: Json | null
        created_at?: string | null
    }
    Relationships: []
}

export interface CustomerActivityLogTable {
    Row: {
        id: string
        customer_id: string
        activity_type: string
        description: string | null
        metadata: Json | null
        created_at: string | null
    }
    Insert: {
        id?: string
        customer_id: string
        activity_type: string
        description?: string | null
        metadata?: Json | null
        created_at?: string | null
    }
    Update: {
        id?: string
        customer_id?: string
        activity_type?: string
        description?: string | null
        metadata?: Json | null
        created_at?: string | null
    }
    Relationships: [
        {
            foreignKeyName: "customer_activity_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
        }
    ]
}

export interface CustomerAddressesTable {
    Row: {
        id: string
        customer_id: string
        name: string
        phone: string
        email: string | null
        address_line1: string
        address_line2: string | null
        country: string
        address_type: "shipping" | "billing" | "both"
        city: string
        state: string
        pincode: string
        is_default: boolean
        created_at: string
        updated_at: string
    }
    Insert: {
        id?: string
        customer_id: string
        name: string
        phone: string
        email?: string | null
        address_line1: string
        address_line2?: string | null
        country: string
        address_type: "shipping" | "billing" | "both"
        city: string
        state: string
        pincode: string
        is_default?: boolean | null
        created_at?: string | null
        updated_at?: string | null
    }
    Update: {
        id?: string
        customer_id?: string
        name?: string
        phone?: string
        email?: string | null
        address_line1?: string
        address_line2?: string | null
        country?: string
        address_type?: "shipping" | "billing" | "both"
        city?: string
        state?: string
        pincode?: string
        is_default?: boolean | null
        created_at?: string | null
        updated_at?: string | null
    }
    Relationships: [
        {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
        }
    ]
}

export interface CustomerNotesTable {
    Row: {
        id: string
        customer_id: string
        note: string
        created_by: string
        created_at: string | null
    }
    Insert: {
        id?: string
        customer_id: string
        note: string
        created_by: string
        created_at?: string | null
    }
    Update: {
        id?: string
        customer_id?: string
        note?: string
        created_by?: string
        created_at?: string | null
    }
    Relationships: [
        {
            foreignKeyName: "customer_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
        }
    ]
}
