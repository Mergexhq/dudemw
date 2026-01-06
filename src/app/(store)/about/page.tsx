import { getCMSPage } from '@/lib/actions/cms'
import AboutClient from './about-client'

// Enable ISR: Regenerate page every hour when CMS content changes
export const revalidate = 3600

export default async function AboutPage() {
    const page = await getCMSPage('about-us')

    return <AboutClient cmsContent={page?.is_published ? page.content : undefined} />
}
