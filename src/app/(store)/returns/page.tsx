import { getCMSPage } from '@/lib/actions/cms'
import { EnhancedPolicyPage } from '@/components/policy/enhanced-policy-page'
import { generatePolicySchema } from '@/lib/utils/seo'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

// Enable ISR
export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
    const page = await getCMSPage('returns')

    if (!page || !page.is_published) return {}

    return {
        title: `${page.title} | Dude Menswear`,
        description: 'Read our Returns and Refund Policy. We ensure a hassle-free return process for our customers.',
        openGraph: {
            title: `${page.title} | Dude Menswear`,
            description: 'Read our Returns and Refund Policy. We ensure a hassle-free return process for our customers.',
            url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://dudemenswear.com'}/returns`,
            type: 'website',
        }
    }
}

export default async function ReturnsPage() {
    const page = await getCMSPage('returns')

    if (!page || !page.is_published) notFound()

    const jsonLd = generatePolicySchema(page.title, `${process.env.NEXT_PUBLIC_APP_URL || 'https://dudemenswear.com'}/returns`)

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <EnhancedPolicyPage title={page.title} content={page.content} slug="returns" />
        </>
    )
}
