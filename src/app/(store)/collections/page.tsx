import Link from 'next/link'
import { CollectionService } from '@/lib/services/collections'
import { generateBreadcrumbSchema } from '@/lib/utils/seo'

export default async function CollectionsPage() {
  // Fetch all active collections
  const collectionsResult = await CollectionService.getCollections(true)
  const collections = collectionsResult.success ? collectionsResult.data : []

  // Generate structured data for SEO
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Collections', url: '/collections' },
  ])

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="font-heading text-4xl tracking-wider text-black md:text-5xl">
            Our Collections
          </h1>
          <p className="mt-4 font-body text-lg text-gray-600">
            Explore our curated collections of premium menswear
          </p>
        </div>

        {/* Collections Grid */}
        {collections.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection: any) => (
              <Link
                key={collection.id}
                href={`/collections/${collection.slug}`}
                className="group relative overflow-hidden rounded-lg bg-gray-100 transition-transform hover:scale-105"
                data-testid={`collection-card-${collection.slug}`}
              >
                <div className="aspect-[4/3] bg-gradient-to-br from-gray-200 to-gray-300">
                  {/* Placeholder for collection image - can be added later */}
                  <div className="flex h-full items-center justify-center">
                    <span className="text-4xl font-bold text-gray-400">
                      {collection.title.charAt(0)}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h2 className="font-heading text-2xl tracking-wide text-black group-hover:text-gray-700">
                    {collection.title}
                  </h2>
                  {collection.description && (
                    <p className="mt-2 font-body text-gray-600 line-clamp-2">
                      {collection.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center text-sm font-medium text-black">
                    <span>View Collection</span>
                    <svg
                      className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No collections available at the moment.</p>
          </div>
        )}
      </div>
    </>
  )
}

// Generate metadata for SEO
export async function generateMetadata() {
  return {
    title: 'Collections - Dude Menswear',
    description: 'Explore our curated collections of premium menswear. Discover the latest trends and timeless classics.',
    keywords: ['menswear', 'fashion', 'collections', 'clothing', 'style'],
    openGraph: {
      type: 'website',
      title: 'Collections - Dude Menswear',
      description: 'Explore our curated collections of premium menswear',
      siteName: 'Dude Menswear',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Collections - Dude Menswear',
      description: 'Explore our curated collections of premium menswear',
    },
    alternates: {
      canonical: '/collections',
    },
  }
}
