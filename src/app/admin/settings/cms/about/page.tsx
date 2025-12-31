import { getAllAboutFeatures, getAllAboutStats } from '@/lib/actions/about'
import { getCMSPage } from '@/lib/actions/cms'
import AboutManagement from '@/domains/admin/settings/about-management'

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'About Us - CMS',
    description: 'Manage About page content, features and statistics'
}

export default async function AboutCMSPage() {
    const [featuresResult, statsResult, cmsPage] = await Promise.all([
        getAllAboutFeatures(),
        getAllAboutStats(),
        getCMSPage('about-us')
    ])

    const features = featuresResult.success ? featuresResult.data || [] : []
    const stats = statsResult.success ? statsResult.data || [] : []

    return <AboutManagement 
        initialFeatures={features} 
        initialStats={stats} 
        cmsPage={cmsPage}
    />
}
