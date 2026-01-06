import { getCMSPage } from '@/lib/actions/cms'
import RefundPolicyEditor from '@/domains/admin/settings/refund-policy-editor'

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'Refund Policy - CMS',
    description: 'Manage Refund Policy content'
}

export default async function RefundPolicyPage() {
    const cmsPage = await getCMSPage('refund-policy')

    return <RefundPolicyEditor cmsPage={cmsPage} />
}
