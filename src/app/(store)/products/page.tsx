import { generateBreadcrumbSchema } from '@/lib/utils/seo'
import { ProductsPage as ProductsPageComponent } from '@/domains/product'

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; sort?: string; collection?: string; category?: string }>
}) {
  const resolvedSearchParams = await searchParams

  // Generate structured data for SEO
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Products', url: '/products' },
  ])

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <ProductsPageComponent
        searchParams={resolvedSearchParams}
        category={resolvedSearchParams.category}
        pageTitle="All Products"
      />
    </>
  )
}

// Generate metadata for SEO
export async function generateMetadata() {
  const description = 'Shop premium menswear at Dude Menswear. Discover our collection of streetwear, casual wear, and fashion essentials with fast delivery.'

  return {
    title: 'Products - Dude Menswear',
    description,
    keywords: ['menswear', 'fashion', 'streetwear', 'clothing', 'products', 'shop'],
    openGraph: {
      type: 'website',
      title: 'Products - Dude Menswear',
      description,
      siteName: 'Dude Menswear',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Products - Dude Menswear',
      description,
    },
    alternates: {
      canonical: '/products',
    },
  }
}
