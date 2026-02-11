import { notFound } from 'next/navigation'
import { generateBreadcrumbSchema } from '@/lib/utils/seo'
import { ProductsPage } from '@/domains/product'
import { CategoryService } from '@/lib/services/categories'

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ q?: string; page?: string; sort?: string }>
}) {
  const { slug } = await params
  const resolvedSearchParams = await searchParams

  // Fetch category from database
  const categoryResult = await CategoryService.getCategoryBySlug(slug)

  if (!categoryResult.success || !categoryResult.data) {
    notFound()
  }

  const category = categoryResult.data

  // Generate structured data for SEO
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Products', url: '/products' },
    { name: category.name, url: `/categories/${slug}` },
  ])

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Use ProductsPage with category filter */}
      <ProductsPage
        searchParams={{
          ...resolvedSearchParams,
          category: slug,
        }}
        category={slug}
        pageTitle={category.name}
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
  const categoryResult = await CategoryService.getCategoryBySlug(slug)

  if (!categoryResult.success || !categoryResult.data) {
    return {
      title: 'Category Not Found',
    }
  }

  const category = categoryResult.data

  return {
    title: `${category.name} - Dude Menswear`,
    description: category.description || `Shop ${category.name} at Dude Menswear`,
    keywords: ['menswear', 'fashion', category.name.toLowerCase(), 'clothing', 'men'],
    openGraph: {
      type: 'website',
      title: `${category.name} - Dude Menswear`,
      description: category.description || `Shop ${category.name} collection`,
      siteName: 'Dude Menswear',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${category.name} - Dude Menswear`,
      description: category.description || `Shop ${category.name} collection`,
    },
    alternates: {
      canonical: `/categories/${slug}`,
    },
  }
}

// Generate static params for categories from database
export async function generateStaticParams() {
  const categoriesResult = await CategoryService.getCategories()

  if (!categoriesResult.success || !categoriesResult.data) {
    return []
  }

  return categoriesResult.data.map((category: any) => ({
    slug: category.slug,
  }))
}