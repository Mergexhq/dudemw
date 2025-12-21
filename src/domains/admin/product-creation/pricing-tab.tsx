"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { DollarSign, AlertCircle, Check, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface PricingData {
  price: string
  comparePrice: string
  cost: string
  taxable: boolean
}

interface PricingTabProps {
  pricingData: PricingData
  onPricingDataChange: (updates: Partial<PricingData>) => void
  hasVariants: boolean
  variantCount: number
}

export function PricingTab({ pricingData, onPricingDataChange, hasVariants, variantCount }: PricingTabProps) {
  const calculateDiscount = () => {
    const price = parseFloat(pricingData.price) || 0
    const comparePrice = parseFloat(pricingData.comparePrice) || 0

    if (price > 0 && comparePrice > price) {
      const discount = ((comparePrice - price) / comparePrice) * 100
      return Math.round(discount)
    }
    return 0
  }

  const discount = calculateDiscount()

  return (
    <div className="space-y-6">
      {/* Pricing Mode Notice - Auto-detected */}
      <Card className={`border-0 shadow-sm transition-all duration-200 ${hasVariants
          ? 'bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/30 dark:to-gray-900 border-blue-100/50'
          : 'bg-gradient-to-b from-white to-red-50 dark:from-gray-900 dark:to-red-950/20 border-red-100/50'
        }`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <DollarSign className={`h-5 w-5 ${hasVariants ? 'text-blue-600' : 'text-red-600'}`} />
                Pricing Mode
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {hasVariants
                  ? 'Pricing is managed per variant'
                  : 'Set a single price for this product'
                }
              </CardDescription>
            </div>
            <Badge className={hasVariants ? 'bg-blue-600' : 'bg-red-600'}>
              {hasVariants ? 'Variant Pricing' : 'Single Pricing'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {hasVariants
              ? `This product has ${variantCount} variants. Each variant can have its own price.`
              : 'This product has no variants, so it uses a single price.'
            }
          </p>
        </CardContent>
      </Card>

      {/* Variant Pricing Mode */}
      {hasVariants && (
        <Card className="border-0 shadow-sm bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-900">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Pricing is managed in the Variants tab
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Since this product has variants, each variant has its own price.
                  Go to the <strong>Variants tab</strong> to set prices for each variant.
                </p>
                <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" asChild>
                  <Link href="#" onClick={() => {
                    // Find the variants tab button and click it
                    const variantsBtn = document.querySelector('[data-tab="variants"]') as HTMLButtonElement
                    variantsBtn?.click()
                  }}>
                    Go to Variants Tab
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Single Price Mode */}
      {!hasVariants && (
        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 dark:from-gray-900 dark:to-red-950/20 border-red-100/50 dark:border-red-900/20 hover:shadow-md transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Product Pricing</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Set the selling price, MRP, and cost for this product
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-base font-semibold text-gray-900 dark:text-white">
                  Selling Price (₹) *
                </Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={pricingData.price}
                  onChange={(e) => onPricingDataChange({ price: e.target.value })}
                  className="text-lg"
                />
                <p className="text-xs text-gray-500">The price customers pay</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="comparePrice" className="text-base font-semibold text-gray-900 dark:text-white">
                  Compare at Price / MRP (₹)
                </Label>
                <Input
                  id="comparePrice"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={pricingData.comparePrice}
                  onChange={(e) => onPricingDataChange({ comparePrice: e.target.value })}
                  className="text-lg"
                />
                <p className="text-xs text-gray-500">Original price before discount</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost" className="text-base font-semibold text-gray-900 dark:text-white">
                  Cost per Item (₹)
                </Label>
                <Input
                  id="cost"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={pricingData.cost}
                  onChange={(e) => onPricingDataChange({ cost: e.target.value })}
                  className="text-lg"
                />
                <p className="text-xs text-gray-500">Your cost (not shown to customers)</p>
              </div>
            </div>

            {/* Discount Preview */}
            {discount > 0 && (
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Check className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-900 dark:text-green-100">
                        ₹{pricingData.price}
                        <span className="text-sm font-normal text-green-700 dark:text-green-300 ml-2 line-through">
                          ₹{pricingData.comparePrice}
                        </span>
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Customer saves ₹{(parseFloat(pricingData.comparePrice) - parseFloat(pricingData.price)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-600 text-white text-lg px-3 py-1">
                    {discount}% OFF
                  </Badge>
                </div>
              </div>
            )}

            {/* Profit Calculation */}
            {pricingData.price && pricingData.cost && parseFloat(pricingData.cost) > 0 && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-blue-900 dark:text-blue-100">
                      Profit Margin
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      ₹{(parseFloat(pricingData.price) - parseFloat(pricingData.cost)).toFixed(2)} profit per sale
                    </p>
                  </div>
                  <Badge className="bg-blue-600 text-white">
                    {Math.round(((parseFloat(pricingData.price) - parseFloat(pricingData.cost)) / parseFloat(pricingData.price)) * 100)}% margin
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tax Settings - Always visible */}
      <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 dark:from-gray-900 dark:to-red-950/20 border-red-100/50 dark:border-red-900/20 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Tax Settings</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Configure tax behavior for this product
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/60 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Checkbox
                id="taxable"
                checked={pricingData.taxable}
                onCheckedChange={(checked) => onPricingDataChange({ taxable: !!checked })}
              />
              <div>
                <Label htmlFor="taxable" className="text-base font-semibold cursor-pointer">
                  Charge tax on this product
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Tax will be calculated based on your store's tax settings
                </p>
              </div>
            </div>
            <Badge variant={pricingData.taxable ? "default" : "secondary"}>
              {pricingData.taxable ? "Taxable" : "Tax-free"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}