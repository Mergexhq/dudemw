import { getCMSPage } from '@/lib/actions/cms'
import ShippingPolicyEditor from '@/domains/admin/settings/shipping-policy-editor'

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'Shipping Policy - CMS',
    description: 'Manage Shipping Policy content'
}

export default async function ShippingPolicyPage() {
    const cmsPage = await getCMSPage('shipping-policy')

    return <ShippingPolicyEditor cmsPage={cmsPage} />
}
