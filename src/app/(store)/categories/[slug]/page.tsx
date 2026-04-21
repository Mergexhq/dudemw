import { notFound } from 'next/navigation'
import { generateBreadcrumbSchema } from '@/lib/utils/seo'
import { ProductsPage } from '@/domains/product'
import { CategoryService } from '@/lib/services/categories'

// Allow on-demand generation for new categories added after build
export const dynamicParams = true

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

  const category = categoryResult.data!

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
  try {
    const { slug } = await params
    const categoryResult = await CategoryService.getCategoryBySlug(slug)

    if (!categoryResult.success || !categoryResult.data) {
      return {
        title: 'Category Not Found',
        description: 'The requested category could not be found.',
      }
    }

    const category = categoryResult.data

    return {
      title: `${category.name} - Dude Menswear`,
      description: category.meta_description || `Shop ${category.name} at Dude Menswear`,
      keywords: ['menswear', 'fashion', category.name.toLowerCase(), 'clothing', 'men'],
      openGraph: {
        type: 'website',
        title: `${category.name} - Dude Menswear`,
        description: category.meta_description || `Shop ${category.name} collection`,
        siteName: 'Dude Menswear',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${category.name} - Dude Menswear`,
        description: category.meta_description || `Shop ${category.name} collection`,
      },
      alternates: {
        canonical: `/categories/${slug}`,
      },
    }
  } catch (error) {
    console.error('[CategoryPage] generateMetadata error:', error)
    return {
      title: 'Categories - Dude Menswear',
    }
  }
}

// Generate static params for categories from database
export async function generateStaticParams() {
  try {
    const categoriesResult = await CategoryService.getCategories()

    if (!categoriesResult.success || !categoriesResult.data) {
      return []
    }

    return categoriesResult.data.map((category: any) => ({
      slug: category.slug,
    }))
  } catch (error) {
    console.error('[CategoryPage] generateStaticParams error:', error)
    return []
  }
}