import { getFAQs } from '@/lib/actions/cms'
import { FAQClient } from '@/components/faq/faq-client'
import { generateFAQSchema } from '@/lib/utils/seo'
import type { Metadata } from 'next'

// Enable ISR: Regenerate page every hour when FAQ content changes
export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
    const faqs = await getFAQs()

    return {
        title: 'Frequently Asked Questions | Dude Menswear',
        description: 'Find answers to common questions about shipping, returns, refunds, and more at Dude Menswear.',
        openGraph: {
            title: 'Frequently Asked Questions | Dude Menswear',
            description: 'Find answers to common questions about shipping, returns, refunds, and more at Dude Menswear.',
            url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://dudemenswear.com'}/faq`,
            type: 'website',
        }
    }
}

export default async function FAQPage() {
    const faqs = await getFAQs()
    const jsonLd = generateFAQSchema(faqs)

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <FAQClient faqs={faqs} />
        </>
    )
}
