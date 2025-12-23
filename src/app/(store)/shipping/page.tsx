import { getCMSPage } from '@/lib/actions/cms'
import ShippingClient from './shipping-client'

// Enable ISR: Regenerate page every hour when CMS content changes
export const revalidate = 3600

export default async function ShippingPage() {
    const page = await getCMSPage('shipping-policy')

    return <ShippingClient cmsContent={page?.is_published ? page.content : undefined} />
}
