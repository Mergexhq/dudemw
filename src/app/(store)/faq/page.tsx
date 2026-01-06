import { getPublishedFAQs } from '@/lib/actions/faq'
import FAQClient from './faq-client'

// Enable ISR: Regenerate page every hour when FAQs change
export const revalidate = 3600

export const metadata = {
    title: 'FAQ - Dude Mens Wear',
    description: 'Frequently asked questions about our products and services'
}

export default async function FAQPage() {
    const result = await getPublishedFAQs()
    const faqs = result.success ? result.data || [] : []

    return <FAQClient faqs={faqs} />
}
