export interface WhyDudeSectionsTable {
    Row: {
        id: string
        title: string
        description: string
        icon_name: string
        sort_order: number
        is_active: boolean
        created_at: string
        updated_at: string
    }
    Insert: {
        id?: string
        title: string
        description: string
        icon_name: string
        sort_order?: number
        is_active?: boolean
        created_at?: string
        updated_at?: string
    }
    Update: {
        id?: string
        title?: string
        description?: string
        icon_name?: string
        sort_order?: number
        is_active?: boolean
        created_at?: string
        updated_at?: string
    }
    Relationships: []
}

export interface WhyDudeFeature {
    id: string
    title: string
    description: string
    icon_name: string
    sort_order: number
    is_active: boolean
    created_at: string
    updated_at: string
}