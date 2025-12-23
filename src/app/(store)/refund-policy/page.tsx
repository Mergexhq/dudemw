import { getCMSPage } from '@/lib/actions/cms'
import { CMSPageClient } from '@/components/cms/cms-page-client'
import { notFound } from 'next/navigation'

// Enable ISR: Regenerate page every hour when CMS content changes
export const revalidate = 3600

export default async function RefundPolicyPage() {
    const page = await getCMSPage('refund-policy')

    if (!page || !page.is_published) notFound()

    return <CMSPageClient title={page.title} content={page.content} />
}
