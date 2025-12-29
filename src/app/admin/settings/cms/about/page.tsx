import { getAllAboutFeatures, getAllAboutStats } from '@/lib/actions/about'
import AboutManagement from '@/domains/admin/settings/about-management'

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'About Section - CMS',
    description: 'Manage About page features and statistics'
}

export default async function AboutCMSPage() {
    const [featuresResult, statsResult] = await Promise.all([
        getAllAboutFeatures(),
        getAllAboutStats()
    ])

    const features = featuresResult.success ? featuresResult.data || [] : []
    const stats = statsResult.success ? statsResult.data || [] : []

    return <AboutManagement initialFeatures={features} initialStats={stats} />
}
