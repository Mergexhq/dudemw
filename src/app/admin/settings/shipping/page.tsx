import { ShippingSettingsForm } from "@/domains/admin/settings/shipping-settings-form"

export default function ShippingSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Shipping Settings</h1>
        <p className="text-lg text-gray-600 mt-2">
          Configure ST Courier rates and shipping zones
        </p>
      </div>
      <ShippingSettingsForm />
    </div>
  )
}