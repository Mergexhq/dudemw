import { getCMSPage } from '@/lib/actions/cms'
import { EnhancedPolicyPage } from '@/components/policy/enhanced-policy-page'
import { generatePolicySchema } from '@/lib/utils/seo'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

// Enable ISR
export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
    const page = await getCMSPage('shipping-policy')

    if (!page || !page.is_published) return {}

    return {
        title: `${page.title} | Dude Menswear`,
        description: 'Learn about our shipping and delivery policies. We ship across India with reliable courier partners.',
        openGraph: {
            title: `${page.title} | Dude Menswear`,
            description: 'Learn about our shipping and delivery policies. We ship across India with reliable courier partners.',
            url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://dudemenswear.com'}/shipping-policy`,
            type: 'website',
        }
    }
}

export default async function ShippingPolicyPage() {
    const page = await getCMSPage('shipping-policy')

    if (!page || !page.is_published) notFound()

    const jsonLd = generatePolicySchema(page.title, `${process.env.NEXT_PUBLIC_APP_URL || 'https://dudemenswear.com'}/shipping-policy`)

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <EnhancedPolicyPage title={page.title} content={page.content} slug="shipping-policy" />
        </>
    )
}
