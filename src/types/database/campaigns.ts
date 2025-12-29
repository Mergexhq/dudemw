export interface Campaign {
    id: string
    name: string
    description: string | null
    status: 'active' | 'inactive' | 'draft'
    priority: number
    start_at: string
    end_at: string | null
    apply_type: 'auto' | 'coupon'
    stackable: boolean
    created_at: string
    updated_at: string
}

export interface CampaignRule {
    id: string
    campaign_id: string
    rule_type: 'min_items' | 'min_cart_value' | 'category' | 'collection' | 'product'
    operator: '>=' | '=' | '>' | '<' | '<='
    value: Record<string, any>
    created_at: string
}

export interface CampaignAction {
    id: string
    campaign_id: string
    discount_type: 'flat' | 'percentage'
    discount_value: number
    max_discount: number | null
    applies_to: 'cart' | 'items'
    created_at: string
}

export interface OrderDiscount {
    id: string
    order_id: string
    campaign_id: string | null
    discount_type: 'campaign' | 'coupon'
    discount_amount: number
    applied_at: string
}

// Database table types for Supabase
export interface CampaignsTable {
    Row: {
        id: string
        name: string
        description: string | null
        status: 'active' | 'inactive' | 'draft'
        priority: number
        start_at: string
        end_at: string | null
        apply_type: 'auto' | 'coupon'
        stackable: boolean
        created_at: string
        updated_at: string
    }
    Insert: {
        id?: string
        name: string
        description?: string | null
        status?: 'active' | 'inactive' | 'draft'
        priority?: number
        start_at: string
        end_at?: string | null
        apply_type?: 'auto' | 'coupon'
        stackable?: boolean
        created_at?: string
        updated_at?: string
    }
    Update: {
        id?: string
        name?: string
        description?: string | null
        status?: 'active' | 'inactive' | 'draft'
        priority?: number
        start_at?: string
        end_at?: string | null
        apply_type?: 'auto' | 'coupon'
        stackable?: boolean
        created_at?: string
        updated_at?: string
    }
    Relationships: []
}

export interface CampaignRulesTable {
    Row: {
        id: string
        campaign_id: string
        rule_type: 'min_items' | 'min_cart_value' | 'category' | 'collection' | 'product'
        operator: '>=' | '=' | '>' | '<' | '<='
        value: Record<string, any>
        created_at: string
    }
    Insert: {
        id?: string
        campaign_id: string
        rule_type: 'min_items' | 'min_cart_value' | 'category' | 'collection' | 'product'
        operator: '>=' | '=' | '>' | '<' | '<='
        value: Record<string, any>
        created_at?: string
    }
    Update: {
        id?: string
        campaign_id?: string
        rule_type?: 'min_items' | 'min_cart_value' | 'category' | 'collection' | 'product'
        operator?: '>=' | '=' | '>' | '<' | '<='
        value?: Record<string, any>
        created_at?: string
    }
    Relationships: [
        {
            foreignKeyName: "campaign_rules_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
        }
    ]
}

export interface CampaignActionsTable {
    Row: {
        id: string
        campaign_id: string
        discount_type: 'flat' | 'percentage'
        discount_value: number
        max_discount: number | null
        applies_to: 'cart' | 'items'
        created_at: string
    }
    Insert: {
        id?: string
        campaign_id: string
        discount_type: 'flat' | 'percentage'
        discount_value: number
        max_discount?: number | null
        applies_to?: 'cart' | 'items'
        created_at?: string
    }
    Update: {
        id?: string
        campaign_id?: string
        discount_type?: 'flat' | 'percentage'
        discount_value?: number
        max_discount?: number | null
        applies_to?: 'cart' | 'items'
        created_at?: string
    }
    Relationships: [
        {
            foreignKeyName: "campaign_actions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
        }
    ]
}

export interface OrderDiscountsTable {
    Row: {
        id: string
        order_id: string
        campaign_id: string | null
        discount_type: 'campaign' | 'coupon'
        discount_amount: number
        applied_at: string
    }
    Insert: {
        id?: string
        order_id: string
        campaign_id?: string | null
        discount_type: 'campaign' | 'coupon'
        discount_amount: number
        applied_at?: string
    }
    Update: {
        id?: string
        order_id?: string
        campaign_id?: string | null
        discount_type?: 'campaign' | 'coupon'
        discount_amount?: number
        applied_at?: string
    }
    Relationships: [
        {
            foreignKeyName: "order_discounts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
        },
        {
            foreignKeyName: "order_discounts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
        }
    ]
}

export interface CampaignWithDetails extends Campaign {
    rules: CampaignRule[]
    actions: CampaignAction[]
}

export interface AppliedCampaign {
    id: string
    name: string
    discount: number
    discountType: 'flat' | 'percentage'
}

export interface CartItem {
    id: string
    product_id: string
    quantity: number
    price: number
    category_id?: string
    collection_id?: string
}

export interface CartData {
    items: CartItem[]
    subtotal: number
}
