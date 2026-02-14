import { Product } from '@/domains/product'

export function generateProductSchema(product: Product) {
    const currentVariant = product.product_variants?.[0]
    const price = currentVariant?.price || product.price
    const availability = (currentVariant?.stock && currentVariant.stock > 0)
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock'

    return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.title,
        description: product.description || `Premium ${product.title} from Dude Menswear`,
        image: product.images?.map(img => img) || [],
        brand: {
            '@type': 'Brand',
            name: 'Dude Menswear'
        },
        offers: {
            '@type': 'Offer',
            url: typeof window !== 'undefined' ? window.location.href : '',
            priceCurrency: 'INR',
            price: price,
            priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
            availability: availability,
            itemCondition: 'https://schema.org/NewCondition',
            seller: {
                '@type': 'Organization',
                name: 'Dude Menswear'
            }
        },
        ...(product.average_rating && {
            aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: product.average_rating,
                reviewCount: product.review_count || 1
            }
        })
    }
}
