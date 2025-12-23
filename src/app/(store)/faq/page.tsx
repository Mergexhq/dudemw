import { getCMSPage } from '@/lib/actions/cms'
import FAQClient from './faq-client'

// Enable ISR: Regenerate page every hour when CMS content changes
export const revalidate = 3600

export default async function FAQPage() {
    const page = await getCMSPage('faq')

    return <FAQClient cmsContent={page?.is_published ? page.content : undefined} />
}
