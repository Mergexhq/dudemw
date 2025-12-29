import { getPrimaryStoreLocation } from '@/lib/actions/store-location'
import { StoreSettingsForm } from '@/domains/admin/settings/store-settings-form'

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'General Settings - Admin',
    description: 'Manage store contact information and settings'
}

export default async function GeneralSettingsPage() {
    const storeResult = await getPrimaryStoreLocation()
    const store = storeResult.success ? storeResult.data : null

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">General Settings</h1>
                <p className="text-gray-600">Manage your store contact information and location</p>
            </div>

            <StoreSettingsForm initialData={store} />
        </div>
    )
}
