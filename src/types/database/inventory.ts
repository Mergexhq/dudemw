export interface InventoryTable {
    Row: {
        id: string
        product_id: string
        variant_id: string | null
        quantity: number
        reserved_quantity: number
        track_quantity: boolean
        allow_backorder: boolean
        low_stock_threshold: number
        created_at: string | null
        updated_at: string | null
    }
    Insert: {
        id?: string
        product_id: string
        variant_id?: string | null
        quantity?: number
        reserved_quantity?: number
        track_quantity?: boolean
        allow_backorder?: boolean
        low_stock_threshold?: number
        created_at?: string | null
        updated_at?: string | null
    }
    Update: {
        id?: string
        product_id?: string
        variant_id?: string | null
        quantity?: number
        reserved_quantity?: number
        track_quantity?: boolean
        allow_backorder?: boolean
        low_stock_threshold?: number
        created_at?: string | null
        updated_at?: string | null
    }
    Relationships: [
        {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
        },
        {
            foreignKeyName: "inventory_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
        }
    ]
}

export interface LowStockNotificationsTable {
    Row: {
        id: string
        product_id: string
        variant_id: string | null
        product_name: string
        variant_name: string | null
        current_stock: number
        threshold: number
        notified_at: string | null
        resolved_at: string | null
        created_at: string
        updated_at: string
    }
    Insert: {
        id?: string
        product_id: string
        variant_id?: string | null
        product_name: string
        variant_name?: string | null
        current_stock: number
        threshold: number
        notified_at?: string | null
        resolved_at?: string | null
        created_at?: string
        updated_at?: string
    }
    Update: {
        id?: string
        product_id?: string
        variant_id?: string | null
        product_name?: string
        variant_name?: string | null
        current_stock?: number
        threshold?: number
        notified_at?: string | null
        resolved_at?: string | null
        created_at?: string
        updated_at?: string
    }
    Relationships: [
        {
            foreignKeyName: "low_stock_notifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
        },
        {
            foreignKeyName: "low_stock_notifications_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
        }
    ]
}
