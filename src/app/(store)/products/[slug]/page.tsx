import { notFound } from 'next/navigation'
import { Product } from '@/domains/product/types'
import { ProductService } from '@/lib/services/products'
import { generateProductSchema, generateBreadcrumbSchema } from '@/lib/utils/seo'
import { ProductDetailPage } from '@/domains/product'

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Fetch product using ProductService
  const productResult = await ProductService.getProduct(slug, true)

  // Handle product not found
  if (!productResult.success || !productResult.data) {
    notFound()
  }

  const product = productResult.data

  // Get random related products (You May Also Like)
  let relatedProducts: any[] = []
  const relatedResult = await ProductService.getRandomProducts(4, product.id)

  if (relatedResult.success) {
    relatedProducts = relatedResult.data || []
  }

  // Generate structured data for SEO
  const productSchema = generateProductSchema({
    id: product.id,
    title: product.title,
    description: product.description || '',
    price: product.price,
    images: product.images || [],
    slug: product.slug,
  })

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Products', url: '/products' },
    { name: product.title, url: `/products/${product.slug}` },
  ])

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <ProductDetailPage
        product={product as Product}
        relatedProducts={relatedProducts}
      />
    </>
  )
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const productResult = await ProductService.getProduct(slug, true)

  if (!productResult.success || !productResult.data) {
    return {
      title: 'Product Not Found',
    }
  }

  const product = productResult.data

  const description = product.description || `Shop ${product.title} at Dude Menswear. Premium quality menswear with fast delivery.`

  return {
    title: `${product.title} - ₹${product.price.toLocaleString()}`,
    description,
    keywords: [product.title, 'menswear', 'fashion', 'streetwear', 'clothing'],
    openGraph: {
      type: 'website',
      title: product.title,
      description,
      images: [
        {
          url: product.images?.[0] || '',
          width: 1080,
          height: 1350,
          alt: product.title,
        },
      ],
      siteName: 'Dude Menswear',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.title,
      description,
      images: [product.images?.[0] || ''],
    },
    alternates: {
      canonical: `/products/${product.slug}`,
    },
  }
}