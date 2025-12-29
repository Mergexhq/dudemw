import { getCampaign } from '@/lib/actions/campaigns'
import { notFound } from 'next/navigation'
import { CampaignDetailClient } from '@/domains/admin/campaigns/campaign-detail-client'

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic'

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
    const { id } = await params

    const campaign = await getCampaign(id)

    if (!campaign) {
        notFound()
    }

    return <CampaignDetailClient campaign={campaign} />
}
