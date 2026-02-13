import { NextRequest, NextResponse } from 'next/server'

interface GoogleReview {
    reviewId: string
    reviewer: {
        displayName: string
        profilePhotoUrl?: string
    }
    starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE'
    comment?: string
    createTime: string
    updateTime: string
}

interface GoogleReviewsResponse {
    reviews: GoogleReview[]
    averageRating: number
    totalReviewCount: number
}

/**
 * API Route to fetch Google Business Profile reviews
 * Uses OAuth 2.0 authentication
 * 
 * Environment variables required:
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 * - GOOGLE_BUSINESS_LOCATION_ID
 */
export async function GET(request: NextRequest) {
    try {
        const locationId = process.env.GOOGLE_BUSINESS_LOCATION_ID

        if (!locationId) {
            return NextResponse.json(
                {
                    error: 'Google Business Location ID not configured',
                    reviews: [],
                    averageRating: 0,
                    totalReviewCount: 0
                },
                { status: 200 } // Return empty data instead of error
            )
        }

        // TODO: Implement OAuth 2.0 authentication and API call
        // For now, return mock data structure
        const mockReviews: GoogleReview[] = [
            {
                reviewId: '1',
                reviewer: {
                    displayName: 'Rajesh Kumar',
                    profilePhotoUrl: 'https://ui-avatars.com/api/?name=Rajesh+Kumar&background=random'
                },
                starRating: 'FIVE',
                comment: 'Excellent quality products and fast delivery! Love shopping at Dude.',
                createTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                updateTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                reviewId: '2',
                reviewer: {
                    displayName: 'Priya Sharma',
                    profilePhotoUrl: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=random'
                },
                starRating: 'FIVE',
                comment: 'Great collection and amazing customer service. Highly recommend!',
                createTime: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
                updateTime: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                reviewId: '3',
                reviewer: {
                    displayName: 'Amit Patel',
                    profilePhotoUrl: 'https://ui-avatars.com/api/?name=Amit+Patel&background=random'
                },
                starRating: 'FOUR',
                comment: 'Good quality and reasonable prices. Will shop again.',
                createTime: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
                updateTime: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
            }
        ]

        const response: GoogleReviewsResponse = {
            reviews: mockReviews,
            averageRating: 4.8,
            totalReviewCount: 127
        }

        return NextResponse.json(response, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200'
            }
        })
    } catch (error) {
        console.error('Error fetching Google reviews:', error)
        return NextResponse.json(
            {
                error: 'Failed to fetch reviews',
                reviews: [],
                averageRating: 0,
                totalReviewCount: 0
            },
            { status: 200 }
        )
    }
}
