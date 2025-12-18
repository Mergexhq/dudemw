import { StoreSettingsForm } from "@/domains/admin/settings/store-settings-form"

export default function StoreSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Store Settings</h1>
        <p className="text-lg text-gray-600 mt-2">
          Configure your store identity and basic information
        </p>
      </div>
      <StoreSettingsForm />
    </div>
  )
}