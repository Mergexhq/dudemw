"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Calculator, Info, CheckCircle2 } from "lucide-react"
import { GST_RATES, type TaxSettings } from "../types"

interface GlobalTaxSettingsProps {
  taxSettings: TaxSettings
  setTaxSettings: (settings: TaxSettings) => void
}

export function GlobalTaxSettings({ taxSettings, setTaxSettings }: GlobalTaxSettingsProps) {
  return (
    <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 dark:from-gray-900 dark:to-red-950/20 border-red-100/50 dark:border-red-900/20 hover:shadow-md transition-all duration-200">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <Calculator className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Global Tax Settings</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Configure default GST behavior for your store
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tax Enable Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="tax-enabled" className="text-base font-medium">Enable Tax Collection</Label>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              When enabled, GST will be calculated on all orders
            </p>
          </div>
          <Switch
            id="tax-enabled"
            checked={taxSettings.tax_enabled}
            onCheckedChange={(checked) => setTaxSettings({ ...taxSettings, tax_enabled: checked })}
          />
        </div>

        {taxSettings.tax_enabled && (
          <>
            {/* Pricing Type */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                Pricing Type
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p><strong>Inclusive:</strong> Product prices already include GST. Tax is extracted from the price.</p>
                    <p className="mt-1"><strong>Exclusive:</strong> GST is added on top of product prices at checkout.</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    taxSettings.price_includes_tax
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setTaxSettings({ ...taxSettings, price_includes_tax: true })}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      taxSettings.price_includes_tax ? 'border-red-500 bg-red-500' : 'border-gray-400'
                    }`}>
                      {taxSettings.price_includes_tax && (
                        <div className="w-full h-full flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Prices are GST Inclusive</p>
                      <p className="text-sm text-gray-500">₹1000 = ₹847 + ₹153 GST (18%)</p>
                    </div>
                  </div>
                </div>
                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    !taxSettings.price_includes_tax
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setTaxSettings({ ...taxSettings, price_includes_tax: false })}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      !taxSettings.price_includes_tax ? 'border-red-500 bg-red-500' : 'border-gray-400'
                    }`}>
                      {!taxSettings.price_includes_tax && (
                        <div className="w-full h-full flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Prices are GST Exclusive</p>
                      <p className="text-sm text-gray-500">₹1000 + ₹180 GST (18%) = ₹1180</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Default GST Rate */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="default-gst">Default GST Rate (%)</Label>
                <Select
                  value={taxSettings.default_gst_rate.toString()}
                  onValueChange={(value) => setTaxSettings({ ...taxSettings, default_gst_rate: parseInt(value) })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GST_RATES.map((rate) => (
                      <SelectItem key={rate} value={rate.toString()}>
                        {rate}% GST
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Applied when no category or product override exists</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gstin">GSTIN (GST Registration Number)</Label>
                <Input
                  id="gstin"
                  placeholder="22AAAAA0000A1Z5"
                  value={taxSettings.gstin}
                  onChange={(e) => setTaxSettings({ ...taxSettings, gstin: e.target.value.toUpperCase() })}
                  className="font-mono"
                  maxLength={15}
                />
                <p className="text-xs text-gray-500">15-digit GST Identification Number</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}