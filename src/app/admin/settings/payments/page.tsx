import { PaymentSettingsForm } from "@/domains/admin/settings/payment-settings-form"

export default function PaymentSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Payment Settings</h1>
        <p className="text-lg text-gray-600 mt-2">
          Configure Razorpay, COD, and payment methods
        </p>
      </div>
      <PaymentSettingsForm />
    </div>
  )
}