"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Building2, Info, Truck, AlertCircle } from "lucide-react"
import { INDIAN_STATES, type TaxSettings } from "../types"

interface StoreLocationSettingsProps {
  taxSettings: TaxSettings
  setTaxSettings: (settings: TaxSettings) => void
}

export function StoreLocationSettings({ taxSettings, setTaxSettings }: StoreLocationSettingsProps) {
  if (!taxSettings.tax_enabled) return null

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-blue-950/20 border-blue-100/50 dark:border-blue-900/20 hover:shadow-md transition-all duration-200">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Store Location & Tax Type</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              State-based GST calculation (CGST/SGST vs IGST)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="store-state">Store Registered State</Label>
          <Select
            value={taxSettings.store_state}
            onValueChange={(value) => setTaxSettings({ ...taxSettings, store_state: value })}
          >
            <SelectTrigger className="w-full md:w-96">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INDIAN_STATES.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tax Type Information */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2 mb-3">
            <Info className="w-4 h-4" />
            How GST is Applied Based on Delivery Location
          </h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Intra-State
                </Badge>
                <Truck className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Delivery within <strong>{taxSettings.store_state}</strong>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Tax split: CGST ({taxSettings.default_gst_rate / 2}%) + SGST ({taxSettings.default_gst_rate / 2}%)
              </p>
            </div>
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  Inter-State
                </Badge>
                <Truck className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Delivery outside <strong>{taxSettings.store_state}</strong>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Tax: IGST ({taxSettings.default_gst_rate}%)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            This logic is automatically applied at checkout based on the customer&apos;s shipping address.
            You do not need to configure anything manually - the system handles CGST/SGST/IGST split.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}