'use client'

/**
 * Client-side component for homepage interactive features
 * Receives pre-fetched data from server component
 * No data fetching happens here - only interactivity
 */

import type { Product } from '@/domains/product'
import HorizontalProductScroll from '@/domains/product/components/cards/HorizontalProductScroll'
import BannerCarousel from '@/domains/product/components/banners/BannerCarousel'
import CategoryGrid from '../sections/CategoryGrid'
import InstagramFeed from '../sections/InstagramFeed'
import WhyDudeSection from '../sections/WhyDudeSection'
import GoogleReviewsSection from '../sections/GoogleReviewsSection'

interface CollectionWithProducts {
    id: string
    title: string
    description?: string | null
    slug: string
    products: Product[]
}

interface HomepageClientProps {
    initialCollections: CollectionWithProducts[]
}

export default function HomepageClient({ initialCollections }: HomepageClientProps) {
    return (
        <div className="min-h-screen bg-white">
            {/* 1. BANNER SECTION */}
            <BannerCarousel />

            {/* 2. CATEGORY GRID SECTION */}
            <CategoryGrid />

            {/* 3. COLLECTIONS SECTION */}
            {initialCollections.length > 0 && (
                <section className="bg-white py-12 md:py-16">
                    <div className="mx-auto max-w-7xl px-4">
                        <div className="space-y-12">
                            {initialCollections.map((collection, index) => (
                                <HorizontalProductScroll
                                    key={collection.id}
                                    title={collection.title}
                                    description={collection.description}
                                    products={collection.products}
                                    badge={index === 0 ? 'NEW' : undefined}
                                    badgeColor={index === 0 ? 'red' : 'black'}
                                    centerHeader={true}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* 4. GOOGLE REVIEWS SECTION */}
            <GoogleReviewsSection />

            {/* 5. WHY DUDE SECTION */}
            <WhyDudeSection />

            {/* 6. INSTAGRAM SECTION */}
            <InstagramFeed />
        </div>
    )
}
