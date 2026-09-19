import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { generateBreadcrumbSchema } from '@/lib/utils/seo'
import { ProductsPage } from '@/domains/product'
import { CategoryService } from '@/lib/services/categories'

// Allow on-demand generation for new categories added after build
export const dynamicParams = true

// Cache rendered pages for 5 minutes (ISR) — prevents every request from hitting the DB
export const revalidate = 300

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Fetch category from database
  let categoryResult
  try {
    categoryResult = await CategoryService.getCategoryBySlug(slug)
  } catch (error) {
    console.error('[CategoryPage] Failed to fetch category:', error)
    notFound()
  }

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

      {/* Suspense boundary required for client components using useSearchParams() */}
      <Suspense fallback={<CategoryPageSkeleton />}>
        <ProductsPage
          searchParams={{ category: slug }}
          category={slug}
          pageTitle={category.name}
        />
      </Suspense>
    </>
  )
}

/** Inline skeleton shown while ProductsPage hydrates */
function CategoryPageSkeleton() {
  return (
    <div className="bg-white pt-8 pb-4 md:pt-12 md:pb-6 text-center">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="h-10 w-64 mx-auto animate-pulse bg-gray-200 rounded mb-4" />
        <div className="h-4 w-48 mx-auto animate-pulse bg-gray-100 rounded" />
      </div>
      <section className="mx-auto max-w-7xl px-4 pb-12 md:px-6 pt-8">
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 md:gap-y-10 lg:grid-cols-4 lg:gap-x-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square rounded-lg bg-gray-200" />
              <div className="mt-3 h-4 w-3/4 rounded bg-gray-200" />
              <div className="mt-2 h-4 w-1/2 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </section>
    </div>
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