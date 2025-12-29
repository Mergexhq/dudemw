import { getAllWhyDudeFeatures } from '@/lib/actions/why-dude'
import { WhyDudeManagement } from '@/domains/admin/settings/why-dude-management'

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic'

export default async function WhyDudeSettingsPage() {
    const features = await getAllWhyDudeFeatures()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Why Dude Section</h1>
                <p className="text-gray-500 mt-2">Manage the features displayed in the "Why Dude" section on your homepage.</p>
            </div>

            <WhyDudeManagement initialFeatures={features} />
        </div>
    )
}
