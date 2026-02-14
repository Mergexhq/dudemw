import { getCMSPage } from '@/lib/actions/cms'
import AboutClient from './about-client'
import { generatePolicySchema } from '@/lib/utils/seo'
import type { Metadata } from 'next'

// Enable ISR: Regenerate page every hour when CMS content changes
export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
    const page = await getCMSPage('about-us')

    if (!page || !page.is_published) return {}

    return {
        title: `${page.title} | Dude Menswear`,
        description: 'Discover the story behind Dude Menswear. Established in 2020, we offer high-quality, stylish, and affordable men\'s fashion.',
        openGraph: {
            title: `${page.title} | Dude Menswear`,
            description: 'Discover the story behind Dude Menswear. Established in 2020, we offer high-quality, stylish, and affordable men\'s fashion.',
            url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://dudemenswear.com'}/about`,
            type: 'website',
            images: [
                {
                    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://dudemenswear.com'}/logo/logo.png`,
                    width: 800,
                    height: 600,
                    alt: 'Dude Menswear Logo',
                }
            ]
        }
    }
}

export default async function AboutPage() {
    const page = await getCMSPage('about-us')

    const jsonLd = generatePolicySchema('About Us', `${process.env.NEXT_PUBLIC_APP_URL || 'https://dudemenswear.com'}/about`)

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <AboutClient cmsContent={page?.is_published ? page.content : undefined} />
        </>
    )
}
