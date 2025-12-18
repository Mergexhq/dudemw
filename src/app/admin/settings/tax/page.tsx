"use client"

import { TaxSettingsForm } from "@/domains/admin/settings/tax-settings-form"

export default function TaxSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Tax Settings</h1>
        <p className="text-lg text-gray-600 mt-2">
          Configure GST rates, tax rules, and state-wise behavior for Indian compliance
        </p>
      </div>
      <TaxSettingsForm />
    </div>
  )
}