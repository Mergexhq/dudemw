import { Json } from './common'

export interface CategoriesTable {
    Row: {
        id: string
        name: string
        slug: string
        description: string | null
        image: string | null
        image_url: string | null
        icon_url: string | null
        homepage_thumbnail_url: string | null
        homepage_video_url: string | null
        plp_square_thumbnail_url: string | null
        parent_id: string | null
        is_active: boolean | null
        status: string | null
        display_order: number | null
        meta_title: string | null
        meta_description: string | null
        selected_banner_id: string | null
        created_at: string | null
        updated_at: string | null
    }
    Insert: {
        id?: string
        name: string
        slug: string
        description?: string | null
        image?: string | null
        image_url?: string | null
        icon_url?: string | null
        homepage_thumbnail_url?: string | null
        homepage_video_url?: string | null
        plp_square_thumbnail_url?: string | null
        parent_id?: string | null
        is_active?: boolean | null
        status?: string | null
        display_order?: number | null
        meta_title?: string | null
        meta_description?: string | null
        selected_banner_id?: string | null
        created_at?: string | null
        updated_at?: string | null
    }
    Update: {
        id?: string
        name?: string
        slug?: string
        description?: string | null
        image?: string | null
        image_url?: string | null
        icon_url?: string | null
        homepage_thumbnail_url?: string | null
        homepage_video_url?: string | null
        plp_square_thumbnail_url?: string | null
        parent_id?: string | null
        is_active?: boolean | null
        status?: string | null
        display_order?: number | null
        meta_title?: string | null
        meta_description?: string | null
        selected_banner_id?: string | null
        created_at?: string | null
        updated_at?: string | null
    }
    Relationships: [
        {
            foreignKeyName: 'categories_parent_id_fkey'
            columns: ['parent_id']
            referencedRelation: 'categories'
            referencedColumns: ['id']
        }
    ]
}

export interface CollectionsTable {
    Row: {
        id: string
        title: string
        slug: string
        description: string | null
        type: string
        rule_json: Json | null
        is_active: boolean | null
        created_at: string | null
        updated_at: string | null
    }
    Insert: {
        id?: string
        title: string
        slug: string
        description?: string | null
        type: string
        rule_json?: Json | null
        is_active?: boolean | null
        created_at?: string | null
        updated_at?: string | null
    }
    Update: {
        id?: string
        title?: string
        slug?: string
        description?: string | null
        type?: string
        rule_json?: Json | null
        is_active?: boolean | null
        created_at?: string | null
        updated_at?: string | null
    }
    Relationships: []
}

export interface HomepageSectionsTable {
    Row: {
        id: string
        title: string
        content_type: string
        metadata: Json | null
        sort_order: number | null
        is_active: boolean | null
        created_at: string | null
        updated_at: string | null
    }
    Insert: {
        id?: string
        title: string
        content_type: string
        metadata?: Json | null
        sort_order?: number | null
        is_active?: boolean | null
        created_at?: string | null
        updated_at?: string | null
    }
    Update: {
        id?: string
        title?: string
        content_type?: string
        metadata?: Json | null
        sort_order?: number | null
        is_active?: boolean | null
        created_at?: string | null
        updated_at?: string | null
    }
    Relationships: []
}

export interface CmsPagesTable {
    Row: {
        id: string
        slug: string
        title: string
        content: string
        is_published: boolean | null
        created_at: string
        updated_at: string
    }
    Insert: {
        id?: string
        slug: string
        title: string
        content: string
        is_published?: boolean | null
        created_at?: string
        updated_at?: string
    }
    Update: {
        id?: string
        slug?: string
        title?: string
        content?: string
        is_published?: boolean | null
        created_at?: string
        updated_at?: string
    }
    Relationships: []
}

export interface BlogPostsTable {
    Row: {
        id: string
        title: string
        slug: string
        content: string
        excerpt: string | null
        author: string
        category: string | null
        tags: string[] | null
        featured_image: string | null
        is_published: boolean | null
        published_at: string | null
        created_at: string | null
        updated_at: string | null
    }
    Insert: {
        id?: string
        title: string
        slug: string
        content: string
        excerpt?: string | null
        author: string
        category?: string | null
        tags?: string[] | null
        featured_image?: string | null
        is_published?: boolean | null
        published_at?: string | null
        created_at?: string | null
        updated_at?: string | null
    }
    Update: {
        id?: string
        title?: string
        slug?: string
        content?: string
        excerpt?: string | null
        author?: string
        category?: string | null
        tags?: string[] | null
        featured_image?: string | null
        is_published?: boolean | null
        published_at?: string | null
        created_at?: string | null
        updated_at?: string | null
    }
    Relationships: []
}
