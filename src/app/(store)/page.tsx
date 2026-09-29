import { getHomepageDataSafe } from '@/lib/data/homepage'
import HomepageClient from '@/domains/homepage/components/HomepageClient'
import { generateOrganizationSchema, generateWebsiteSchema } from "@/lib/utils/seo"

/**
 * Homepage - Server Component
 * Fetches data server-side for optimal SEO and performance
 * Data is passed to client component for interactivity
 */
export default async function Home() {
  // Fetch all homepage data server-side
  const { collections } = await getHomepageDataSafe()

  // Generate SEO structured data
  const organizationSchema = generateOrganizationSchema()
  const websiteSchema = generateWebsiteSchema()

  // Pass server-fetched data to client component
  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      {/* Homepage Content */}
      <HomepageClient initialCollections={collections} />
    </>
  )
}

/**
 * Incremental Static Regeneration (ISR)
 * Revalidate every 10 minutes (600 seconds)
 * This provides:
 * - Fast page loads (served from cache)
 * - Fresh data (automatically updates every 10 min)
 * - Reduced database load
 */
export const revalidate = 600
