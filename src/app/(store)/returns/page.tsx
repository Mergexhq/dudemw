import { getCMSPage } from '@/lib/actions/cms'
import ReturnsClient from './returns-client'

// Enable ISR: Regenerate page every hour when CMS content changes
export const revalidate = 3600

export default async function ReturnsPage() {
    const page = await getCMSPage('returns')

    return <ReturnsClient cmsContent={page?.is_published ? page.content : undefined} />
}
