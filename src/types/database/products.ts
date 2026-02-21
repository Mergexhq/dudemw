import { Json } from './common'

export interface ProductsTable {
    Row: {
        id: string
        title: string
        subtitle: string | null
        description: string | null
        slug: string | null
        url_handle: string | null
        price: number | null
        compare_price: number | null
        in_stock: boolean | null
        global_stock: number | null
        track_inventory: boolean | null
        allow_backorders: boolean | null
        low_stock_threshold: number | null
        category_id: string | null
        brand: string | null
        images: Json | null
        sizes: Json | null
        colors: Json | null
        highlights: Json | null
        is_bestseller: boolean | null
        is_new_drop: boolean | null
        is_featured: boolean | null
        status: string | null
        taxable: boolean | null
        meta_title: string | null
        meta_description: string | null
        product_family_id: string | null
        default_variant_id: string | null
        free_shipping: boolean
        created_at: string | null
        updated_at: string | null
    }
    Insert: {
        id?: string
        title: string
        subtitle?: string | null
        description?: string | null
        slug?: string | null
        url_handle?: string | null
        price?: number | null
        compare_price?: number | null
        in_stock?: boolean | null
        global_stock?: number | null
        track_inventory?: boolean | null
        allow_backorders?: boolean | null
        low_stock_threshold?: number | null
        category_id?: string | null
        brand?: string | null
        images?: Json | null
        sizes?: Json | null
        colors?: Json | null
        highlights?: Json | null
        is_bestseller?: boolean | null
        is_new_drop?: boolean | null
        is_featured?: boolean | null
        status?: string | null
        taxable?: boolean | null
        meta_title?: string | null
        meta_description?: string | null
        product_family_id?: string | null
        default_variant_id?: string | null
        free_shipping?: boolean
        created_at?: string | null
        updated_at?: string | null
    }
    Update: {
        id?: string
        title?: string
        subtitle?: string | null
        description?: string | null
        slug?: string | null
        url_handle?: string | null
        price?: number | null
        compare_price?: number | null
        in_stock?: boolean | null
        global_stock?: number | null
        track_inventory?: boolean | null
        allow_backorders?: boolean | null
        low_stock_threshold?: number | null
        category_id?: string | null
        brand?: string | null
        images?: Json | null
        sizes?: Json | null
        colors?: Json | null
        highlights?: Json | null
        is_bestseller?: boolean | null
        is_new_drop?: boolean | null
        is_featured?: boolean | null
        status?: string | null
        taxable?: boolean | null
        meta_title?: string | null
        meta_description?: string | null
        product_family_id?: string | null
        default_variant_id?: string | null
        free_shipping?: boolean
        created_at?: string | null
        updated_at?: string | null
    }
    Relationships: []
}

export interface ProductVariantsTable {
    Row: {
        id: string
        product_id: string | null
        name: string | null
        title: string | null
        sku: string
        price: number
        discount_price: number | null
        stock: number | null
        active: boolean | null
        position: number | null
        display_order: number | null
        options: Json | null
        image_url: string | null
        created_at: string | null
        updated_at: string | null
    }
    Insert: {
        id?: string
        product_id?: string | null
        name?: string | null
        title?: string | null
        sku: string
        price: number
        discount_price?: number | null
        stock?: number | null
        active?: boolean | null
        position?: number | null
        display_order?: number | null
        options?: Json | null
        image_url?: string | null
        created_at?: string | null
        updated_at?: string | null
    }
    Update: {
        id?: string
        product_id?: string | null
        name?: string | null
        title?: string | null
        sku?: string
        price?: number
        discount_price?: number | null
        stock?: number | null
        active?: boolean | null
        position?: number | null
        display_order?: number | null
        options?: Json | null
        image_url?: string | null
        created_at?: string | null
        updated_at?: string | null
    }
    Relationships: [
        {
            foreignKeyName: 'product_variants_product_id_fkey'
            columns: ['product_id']
            referencedRelation: 'products'
            referencedColumns: ['id']
        }
    ]
}

export interface ProductImagesTable {
    Row: {
        id: string
        product_id: string | null
        image_url: string
        alt_text: string | null
        is_primary: boolean | null
        sort_order: number | null
        width: number | null
        height: number | null
        created_at: string | null
    }
    Insert: {
        id?: string
        product_id?: string | null
        image_url: string
        alt_text?: string | null
        is_primary?: boolean | null
        sort_order?: number | null
        width?: number | null
        height?: number | null
        created_at?: string | null
    }
    Update: {
        id?: string
        product_id?: string | null
        image_url?: string
        alt_text?: string | null
        is_primary?: boolean | null
        sort_order?: number | null
        width?: number | null
        height?: number | null
        created_at?: string | null
    }
    Relationships: [
        {
            foreignKeyName: 'product_images_product_id_fkey'
            columns: ['product_id']
            referencedRelation: 'products'
            referencedColumns: ['id']
        }
    ]
}

export interface ProductOptionsTable {
    Row: {
        id: string
        product_id: string
        name: string
        position: number | null
        created_at: string | null
        updated_at: string | null
    }
    Insert: {
        id?: string
        product_id: string
        name: string
        position?: number | null
        created_at?: string | null
        updated_at?: string | null
    }
    Update: {
        id?: string
        product_id?: string
        name?: string
        position?: number | null
        created_at?: string | null
        updated_at?: string | null
    }
    Relationships: [
        {
            foreignKeyName: 'product_options_product_id_fkey'
            columns: ['product_id']
            referencedRelation: 'products'
            referencedColumns: ['id']
        }
    ]
}

export interface ProductOptionValuesTable {
    Row: {
        id: string
        option_id: string
        name: string
        hex_color: string | null
        position: number | null
        created_at: string | null
    }
    Insert: {
        id?: string
        option_id: string
        name: string
        hex_color?: string | null
        position?: number | null
        created_at?: string | null
    }
    Update: {
        id?: string
        option_id?: string
        name?: string
        hex_color?: string | null
        position?: number | null
        created_at?: string | null
    }
    Relationships: [
        {
            foreignKeyName: 'product_option_values_option_id_fkey'
            columns: ['option_id']
            referencedRelation: 'product_options'
            referencedColumns: ['id']
        }
    ]
}

export interface VariantOptionValuesTable {
    Row: {
        id: string
        variant_id: string
        option_value_id: string
        created_at: string | null
    }
    Insert: {
        id?: string
        variant_id: string
        option_value_id: string
        created_at?: string | null
    }
    Update: {
        id?: string
        variant_id?: string
        option_value_id?: string
        created_at?: string | null
    }
    Relationships: [
        {
            foreignKeyName: 'variant_option_values_variant_id_fkey'
            columns: ['variant_id']
            referencedRelation: 'product_variants'
            referencedColumns: ['id']
        },
        {
            foreignKeyName: 'variant_option_values_option_value_id_fkey'
            columns: ['option_value_id']
            referencedRelation: 'product_option_values'
            referencedColumns: ['id']
        }
    ]
}

export interface ProductCategoriesTable {
    Row: {
        id: string
        product_id: string
        category_id: string
        created_at: string | null
    }
    Insert: {
        id?: string
        product_id: string
        category_id: string
        created_at?: string | null
    }
    Update: {
        id?: string
        product_id?: string
        category_id?: string
        created_at?: string | null
    }
    Relationships: [
        {
            foreignKeyName: 'product_categories_product_id_fkey'
            columns: ['product_id']
            referencedRelation: 'products'
            referencedColumns: ['id']
        },
        {
            foreignKeyName: 'product_categories_category_id_fkey'
            columns: ['category_id']
            referencedRelation: 'categories'
            referencedColumns: ['id']
        }
    ]
}

export interface ProductCollectionsTable {
    Row: {
        id: string
        product_id: string
        collection_id: string
        created_at: string | null
    }
    Insert: {
        id?: string
        product_id: string
        collection_id: string
        created_at?: string | null
    }
    Update: {
        id?: string
        product_id?: string
        collection_id?: string
        created_at?: string | null
    }
    Relationships: [
        {
            foreignKeyName: 'product_collections_product_id_fkey'
            columns: ['product_id']
            referencedRelation: 'products'
            referencedColumns: ['id']
        },
        {
            foreignKeyName: 'product_collections_collection_id_fkey'
            columns: ['collection_id']
            referencedRelation: 'collections'
            referencedColumns: ['id']
        }
    ]
}

export interface ProductTagsTable {
    Row: {
        id: string
        product_id: string | null
        name: string
        slug: string | null
        created_at: string | null
    }
    Insert: {
        id?: string
        product_id?: string | null
        name: string
        slug?: string | null
        created_at?: string | null
    }
    Update: {
        id?: string
        product_id?: string | null
        name?: string
        slug?: string | null
        created_at?: string | null
    }
    Relationships: []
}

export interface ProductTagAssignmentsTable {
    Row: {
        id: string
        product_id: string
        tag_id: string
        created_at: string | null
    }
    Insert: {
        id?: string
        product_id: string
        tag_id: string
        created_at?: string | null
    }
    Update: {
        id?: string
        product_id?: string
        tag_id?: string
        created_at?: string | null
    }
    Relationships: [
        {
            foreignKeyName: 'product_tag_assignments_product_id_fkey'
            columns: ['product_id']
            referencedRelation: 'products'
            referencedColumns: ['id']
        },
        {
            foreignKeyName: 'product_tag_assignments_tag_id_fkey'
            columns: ['tag_id']
            referencedRelation: 'product_tags'
            referencedColumns: ['id']
        }
    ]
}

export interface ProductAnalyticsTable {
    Row: {
        id: string
        product_id: string
        view_count: number | null
        add_to_cart_count: number | null
        purchase_count: number | null
        total_revenue: number | null
        last_viewed_at: string | null
        created_at: string | null
        updated_at: string | null
    }
    Insert: {
        id?: string
        product_id: string
        view_count?: number | null
        add_to_cart_count?: number | null
        purchase_count?: number | null
        total_revenue?: number | null
        last_viewed_at?: string | null
        created_at?: string | null
        updated_at?: string | null
    }
    Update: {
        id?: string
        product_id?: string
        view_count?: number | null
        add_to_cart_count?: number | null
        purchase_count?: number | null
        total_revenue?: number | null
        last_viewed_at?: string | null
        created_at?: string | null
        updated_at?: string | null
    }
    Relationships: [
        {
            foreignKeyName: 'product_analytics_product_id_fkey'
            columns: ['product_id']
            referencedRelation: 'products'
            referencedColumns: ['id']
        }
    ]
}

export interface InventoryItemsTable {
    Row: {
        id: string
        variant_id: string | null
        sku: string
        barcode: string | null
        quantity: number
        available_quantity: number
        reserved_quantity: number | null
        cost: number | null
        track_quantity: boolean
        allow_backorders: boolean
        low_stock_threshold: number | null
        created_at: string | null
        updated_at: string | null
    }
    Insert: {
        id?: string
        variant_id?: string | null
        sku: string
        barcode?: string | null
        quantity?: number
        available_quantity?: number
        reserved_quantity?: number | null
        cost?: number | null
        track_quantity?: boolean
        allow_backorders?: boolean
        low_stock_threshold?: number | null
        created_at?: string | null
        updated_at?: string | null
    }
    Update: {
        id?: string
        variant_id?: string | null
        sku?: string
        barcode?: string | null
        quantity?: number
        available_quantity?: number
        reserved_quantity?: number | null
        cost?: number | null
        track_quantity?: boolean
        allow_backorders?: boolean
        low_stock_threshold?: number | null
        created_at?: string | null
        updated_at?: string | null
    }
    Relationships: [
        {
            foreignKeyName: 'inventory_items_variant_id_fkey'
            columns: ['variant_id']
            referencedRelation: 'product_variants'
            referencedColumns: ['id']
        }
    ]
}

export interface ReviewsTable {
    Row: {
        id: string
        product_id: string
        user_id: string | null
        user_name: string | null
        rating: number
        comment: string | null
        verified_purchase: boolean | null
        created_at: string | null
        updated_at: string | null
    }
    Insert: {
        id?: string
        product_id: string
        user_id?: string | null
        user_name?: string | null
        rating: number
        comment?: string | null
        verified_purchase?: boolean | null
        created_at?: string | null
        updated_at?: string | null
    }
    Update: {
        id?: string
        product_id?: string
        user_id?: string | null
        user_name?: string | null
        rating?: number
        comment?: string | null
        verified_purchase?: boolean | null
        created_at?: string | null
        updated_at?: string | null
    }
    Relationships: [
        {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
        },
    ]
}
