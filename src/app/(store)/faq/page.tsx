import { getPublishedFAQs } from '@/lib/actions/faq'
import FAQClient from './faq-client'

// This page uses cookies via Supabase, so it must be dynamic
export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'FAQ - Dude Mens Wear',
    description: 'Frequently asked questions about our products and services'
}

export default async function FAQPage() {
    const result = await getPublishedFAQs()
    const faqs = result.success ? result.data || [] : []

    return <FAQClient faqs={faqs} />
}
