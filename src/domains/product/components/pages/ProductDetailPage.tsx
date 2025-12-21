'use client'

import MobileProductView from '../detail/MobileProductView'
import DesktopProductView from '../detail/DesktopProductView'

import { Product } from '@/domains/product'
import TrustBadges from '../../sections/TrustBadges'
import ProductHighlights from '../../sections/ProductHighlights'
import FrequentlyBoughtTogether from '../../sections/FrequentlyBoughtTogether'
import ProductReviews from '../../sections/ProductReviews'
import RelatedProducts from '../../sections/RelatedProducts'

interface ProductDetailPageProps {
  product: Product
  relatedProducts?: Product[]
}

export default function ProductDetailPage({ product, relatedProducts }: ProductDetailPageProps) {
  // Get primary image for current product - handle both ProductImage[] and string[]
  const getProductImageUrl = (): string => {
    // First try product_images array
    if (product.product_images && product.product_images.length > 0) {
      const primaryImage = product.product_images.find(img => img.is_primary)
      const firstImage = product.product_images[0]
      return primaryImage?.image_url || firstImage?.image_url || '/images/placeholder-product.jpg'
    }
    // Fallback to images string array
    if (product.images && product.images.length > 0) {
      return product.images[0]
    }
    return '/images/placeholder-product.jpg'
  }

  const productImage = getProductImageUrl()

  // Get category ID for related products
  const categoryId = product.category_id || product.product_categories?.[0]?.categories?.id

  return (
    <>
      {/* Mobile and Desktop Product Views */}
      <MobileProductView product={product} />
      <DesktopProductView product={product} />

      {/* Trust Badges */}
      <TrustBadges />

      {/* Product Highlights - Pass product attributes */}
      <ProductHighlights
        highlights={product.highlights as string[] | undefined}
        material={product.material}
        fabricWeight={product.fabric_weight}
      />

      {/* Frequently Bought Together */}
      <FrequentlyBoughtTogether
        productId={product.id}
        currentProduct={{
          id: product.id,
          title: product.title,
          price: product.price,
          image: productImage || '/images/placeholder-product.jpg'
        }}
      />

      {/* Product Reviews */}
      <ProductReviews productId={product.id} />

      {/* Related Products */}
      <RelatedProducts
        productId={product.id}
        categoryId={categoryId}
        products={relatedProducts}
      />
    </>
  )
}

