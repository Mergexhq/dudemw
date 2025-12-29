import { getAllCampaigns } from '@/lib/actions/campaigns'
import { CampaignsListClient } from '@/domains/admin/campaigns/campaigns-list-client'

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic'

export default async function CampaignsPage() {
    const campaigns = await getAllCampaigns()

    return <CampaignsListClient initialCampaigns={campaigns} />
}
