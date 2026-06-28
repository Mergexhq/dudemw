import { getAllReviews } from '@/lib/actions/reviews'
import { ReviewsListClient } from '@/domains/admin/reviews/reviews-list-client'

// Force dynamic rendering — admin data must always be fresh
export const dynamic = 'force-dynamic'

export default async function ReviewsPage() {
    const { reviews, total, stats } = await getAllReviews({ limit: 20, page: 1 })

    return (
        <ReviewsListClient
            initialReviews={reviews}
            initialTotal={total}
            initialStats={stats}
        />
    )
}
