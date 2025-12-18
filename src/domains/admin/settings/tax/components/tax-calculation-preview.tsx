"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { TaxSettings } from "../types"

interface TaxCalculationPreviewProps {
  taxSettings: TaxSettings
}

export function TaxCalculationPreview({ taxSettings }: TaxCalculationPreviewProps) {
  if (!taxSettings.tax_enabled) return null

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-purple-50 dark:from-gray-900 dark:to-purple-950/20 border-purple-100/50 dark:border-purple-900/20">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">Tax Calculation Preview</CardTitle>
        <CardDescription>See how tax will be calculated on a sample ₹1000 product</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Inclusive Preview */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              {taxSettings.price_includes_tax ? (
                <Badge className="bg-green-100 text-green-700">Current Setting</Badge>
              ) : null}
              GST Inclusive (₹1000 product)
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Base Price:</span>
                <span>₹{(1000 / (1 + taxSettings.default_gst_rate / 100)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">CGST ({taxSettings.default_gst_rate / 2}%):</span>
                <span>₹{((1000 - 1000 / (1 + taxSettings.default_gst_rate / 100)) / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">SGST ({taxSettings.default_gst_rate / 2}%):</span>
                <span>₹{((1000 - 1000 / (1 + taxSettings.default_gst_rate / 100)) / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium pt-2 border-t">
                <span>Customer Pays:</span>
                <span>₹1000.00</span>
              </div>
            </div>
          </div>

          {/* Exclusive Preview */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              {!taxSettings.price_includes_tax ? (
                <Badge className="bg-green-100 text-green-700">Current Setting</Badge>
              ) : null}
              GST Exclusive (₹1000 product)
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Base Price:</span>
                <span>₹1000.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">CGST ({taxSettings.default_gst_rate / 2}%):</span>
                <span>₹{(1000 * taxSettings.default_gst_rate / 100 / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">SGST ({taxSettings.default_gst_rate / 2}%):</span>
                <span>₹{(1000 * taxSettings.default_gst_rate / 100 / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium pt-2 border-t">
                <span>Customer Pays:</span>
                <span>₹{(1000 * (1 + taxSettings.default_gst_rate / 100)).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}