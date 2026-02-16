'use client'

import { Star } from 'lucide-react'
import Image from 'next/image'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation } from 'swiper/modules'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import { Button } from '@/components/ui/button'

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

interface GoogleReviewsData {
    reviews: GoogleReview[]
    averageRating: number
    totalReviewCount: number
}

const STAR_RATING_MAP = {
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5
}

const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
}

const StarRating = ({ rating }: { rating: number }) => {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`w-4 h-4 ${star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-gray-200 text-gray-200'
                        }`}
                />
            ))}
        </div>
    )
}

// Hardcoded reviews data
const REVIEWS_DATA: GoogleReviewsData = {
    reviews: [
        {
            reviewId: '1',
            reviewer: {
                displayName: 'Surey Suresh',
                profilePhotoUrl: 'https://ui-avatars.com/api/?name=Surey+Suresh&background=4285F4&color=fff&size=128'
            },
            starRating: 'FIVE',
            comment: 'Great collection of cargo tracks! The quality is excellent and I am really happy with my purchase. Highly recommend checking them out for the latest styles!',
            createTime: new Date(Date.now() - 240 * 24 * 60 * 60 * 1000).toISOString(),
            updateTime: new Date(Date.now() - 240 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            reviewId: '2',
            reviewer: {
                displayName: 'DHANUSH DHANUSH',
                profilePhotoUrl: 'https://ui-avatars.com/api/?name=DHANUSH+DHANUSH&background=34A853&color=fff&size=128'
            },
            starRating: 'FIVE',
            comment: 'Pradeep bro collection was very nice ☺️✅',
            createTime: new Date(Date.now() - 240 * 24 * 60 * 60 * 1000).toISOString(),
            updateTime: new Date(Date.now() - 240 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            reviewId: '3',
            reviewer: {
                displayName: 'Dinesh Kumar',
                profilePhotoUrl: 'https://ui-avatars.com/api/?name=Dinesh+Kumar&background=EA4335&color=fff&size=128'
            },
            starRating: 'FIVE',
            comment: 'Affordable price and good quality cloths',
            createTime: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString(),
            updateTime: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            reviewId: '4',
            reviewer: {
                displayName: 'Lokesh Kumar',
                profilePhotoUrl: 'https://ui-avatars.com/api/?name=Lokesh+Kumar&background=FBBC05&color=000&size=128'
            },
            starRating: 'FIVE',
            comment: 'So more collections of dude',
            createTime: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString(),
            updateTime: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            reviewId: '5',
            reviewer: {
                displayName: 'Krishna Prasath',
                profilePhotoUrl: 'https://ui-avatars.com/api/?name=Krishna+Prasath&background=673AB7&color=fff&size=128'
            },
            starRating: 'FIVE',
            comment: 'Very nice',
            createTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            updateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            reviewId: '6',
            reviewer: {
                displayName: 'Lakshu 8765',
                profilePhotoUrl: 'https://ui-avatars.com/api/?name=Lakshu+8765&background=009688&color=fff&size=128'
            },
            starRating: 'FIVE',
            comment: '❤️Very nice ❤️ good job 🌏',
            createTime: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            updateTime: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
        }
    ],
    averageRating: 5.0,
    totalReviewCount: 23
}

export default function GoogleReviewsSection() {
    const reviewsData = REVIEWS_DATA

    return (
        <section className="bg-white py-16 md:py-24">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="mb-12 text-center">
                    <h2 className="font-heading text-4xl tracking-wider text-black md:text-5xl mb-3">
                        WHAT OUR <span className="text-brand-red">CUSTOMERS</span> SAY
                    </h2>
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <StarRating rating={Math.round(reviewsData.averageRating)} />
                        <span className="text-2xl font-bold text-gray-900">
                            {reviewsData.averageRating.toFixed(1)}
                        </span>
                    </div>
                </div>

                {/* Reviews Carousel */}
                <div className="max-w-6xl mx-auto">
                    <Swiper
                        modules={[Autoplay, Pagination, Navigation]}
                        spaceBetween={24}
                        slidesPerView={1}
                        loop={true}
                        autoplay={{
                            delay: 5000,
                            disableOnInteraction: false,
                            pauseOnMouseEnter: true
                        }}
                        pagination={{
                            clickable: true,
                            dynamicBullets: true
                        }}
                        navigation={{
                            enabled: true,
                        }}
                        breakpoints={{
                            640: {
                                slidesPerView: 2,
                                spaceBetween: 20
                            },
                            1024: {
                                slidesPerView: 3,
                                spaceBetween: 24
                            }
                        }}
                        className="reviews-swiper pb-12"
                    >
                        {reviewsData.reviews.map((review) => (
                            <SwiperSlide key={review.reviewId}>
                                <div className="bg-gray-50 rounded-xl p-6 h-full hover:shadow-lg transition-shadow">
                                    {/* Reviewer Info */}
                                    <div className="flex items-start gap-3 mb-4">
                                        {review.reviewer.profilePhotoUrl ? (
                                            <Image
                                                src={review.reviewer.profilePhotoUrl}
                                                alt={review.reviewer.displayName}
                                                width={48}
                                                height={48}
                                                className="rounded-full"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                                                {review.reviewer.displayName.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">
                                                {review.reviewer.displayName}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {formatDate(review.createTime)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Star Rating */}
                                    <div className="mb-3">
                                        <StarRating rating={STAR_RATING_MAP[review.starRating]} />
                                    </div>

                                    {/* Review Comment */}
                                    {review.comment && (
                                        <p className="text-gray-700 text-sm leading-relaxed line-clamp-4">
                                            {review.comment}
                                        </p>
                                    )}
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>

                {/* Google Badge */}
                <div className="mt-8 flex flex-col items-center gap-4 text-center">
                    <Button asChild className="rounded-full px-8">
                        <a
                            href="https://g.page/r/CeHED4WQBAU_EBM/review"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Write a Review
                        </a>
                    </Button>
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${process.env.NEXT_PUBLIC_GOOGLE_BUSINESS_LOCATION_ID || ''}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google Reviews
                    </a>
                </div>
            </div>

            <style jsx global>{`
                /* Hide navigation on mobile */
                .reviews-swiper .swiper-button-next,
                .reviews-swiper .swiper-button-prev {
                    display: none;
                }

                /* Show navigation on desktop (md and up) */
                @media (min-width: 768px) {
                    .reviews-swiper .swiper-button-next,
                    .reviews-swiper .swiper-button-prev {
                        display: flex;
                        color: #000;
                        background: white;
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                        top: -60px;
                    }

                    .reviews-swiper .swiper-button-next {
                        right: 0;
                    }

                    .reviews-swiper .swiper-button-prev {
                        right: 50px;
                        left: auto;
                    }

                    .reviews-swiper .swiper-button-next:after,
                    .reviews-swiper .swiper-button-prev:after {
                        font-size: 16px;
                        font-weight: bold;
                    }
                }

                .reviews-swiper .swiper-pagination-bullet {
                    background: #ccc;
                    opacity: 1;
                }

                .reviews-swiper .swiper-pagination-bullet-active {
                    background: #ef4444;
                }
            `}</style>
        </section>
    )
}
