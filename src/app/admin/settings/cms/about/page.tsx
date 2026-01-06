import { getCMSPage } from '@/lib/actions/cms'
import AboutCMSEditor from '@/domains/admin/settings/about-cms-editor'

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'About Us - CMS',
    description: 'Manage About page content'
}

export default async function AboutCMSPage() {
    const cmsPage = await getCMSPage('about-us')

    return <AboutCMSEditor cmsPage={cmsPage} />
}
