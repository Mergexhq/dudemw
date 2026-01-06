import { getHomepageDataSafe } from '@/lib/data/homepage'
import HomepageClient from '@/domains/homepage/components/HomepageClient'

/**
 * Homepage - Server Component
 * Fetches data server-side for optimal SEO and performance
 * Data is passed to client component for interactivity
 */
export default async function Home() {
  // Fetch all homepage data server-side
  const { collections } = await getHomepageDataSafe()

  // Pass server-fetched data to client component
  return <HomepageClient initialCollections={collections} />
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
