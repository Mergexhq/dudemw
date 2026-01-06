import { getAllFAQs } from '@/lib/actions/faq'
import FAQManagement from '@/domains/admin/settings/faq-management'

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'FAQ - CMS',
    description: 'Manage frequently asked questions'
}

export default async function FAQCMSPage() {
    const result = await getAllFAQs()
    const faqs = result.success ? result.data || [] : []

    return <FAQManagement initialFAQs={faqs} />
}
