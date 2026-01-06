import { getCMSPage } from '@/lib/actions/cms'
import ReturnPolicyEditor from '@/domains/admin/settings/return-policy-editor'

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'Return Policy - CMS',
    description: 'Manage Return Policy content'
}

export default async function ReturnPolicyPage() {
    const cmsPage = await getCMSPage('returns-policy')

    return <ReturnPolicyEditor cmsPage={cmsPage} />
}
