export type ReviewStatus = 'pending' | 'approved' | 'rejected'

export interface ProductReview {
    id: string
    product_id: string
    reviewer_name: string
    rating: number
    comment: string | null
    verified_purchase: boolean | null
    helpful_count: number | null
    images: string[] | null
    status: ReviewStatus
    user_id: string | null
    is_featured: boolean
    admin_reply: string | null
    created_at: string
    updated_at: string
}

export interface ProductReviewWithProduct extends ProductReview {
    product_name: string | null
    product_slug: string | null
}

export interface ReviewFilters {
    status?: ReviewStatus | 'all'
    rating?: number | 'all'
    product_id?: string
    search?: string
    page?: number
    limit?: number
}

export interface ReviewStats {
    total: number
    pending: number
    approved: number
    rejected: number
    featured: number
    average_rating: number
}

export interface BulkReviewAction {
    ids: string[]
    action: 'approve' | 'reject' | 'delete' | 'feature' | 'unfeature'
}
