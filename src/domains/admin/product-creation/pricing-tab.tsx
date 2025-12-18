"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

type PricingMode = "single" | "variant"

interface PricingData {
  mode: PricingMode
  price: string
  comparePrice: string
  cost: string
  taxable: boolean
}

interface PricingTabProps {
  pricingData: PricingData
  onPricingDataChange: (updates: Partial<PricingData>) => void
  hasVariants: boolean
}

export function PricingTab({ pricingData, onPricingDataChange, hasVariants }: PricingTabProps) {
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
      {/* Pricing Mode */}
      <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 dark:from-gray-900 dark:to-red-950/20 border-red-100/50 dark:border-red-900/20 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Pricing Mode</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Choose how pricing works for this product
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={pricingData.mode}
            onValueChange={(value: PricingMode) => onPricingDataChange({ mode: value })}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="single" id="single" />
              <Label htmlFor="single" className="font-medium">Single price</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="variant" id="variant" disabled={!hasVariants} />
              <Label htmlFor="variant" className={`font-medium ${!hasVariants ? 'text-gray-400' : ''}`}>
                Variant-based pricing
              </Label>
              {!hasVariants && (
                <Badge variant="secondary" className="text-xs">
                  Add variants first
                </Badge>
              )}
            </div>
          </RadioGroup>
          
          <p className="text-xs text-gray-500 dark:text-gray-400">
            This toggle controls where pricing is managed
          </p>
        </CardContent>
      </Card>

      {/* Single Price Mode */}
      {pricingData.mode === "single" && (
        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 dark:from-gray-900 dark:to-red-950/20 border-red-100/50 dark:border-red-900/20 hover:shadow-md transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Product Pricing</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Set price and discount information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3 w-full">
              <div className="space-y-2 min-w-0">
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={pricingData.price}
                  onChange={(e) => onPricingDataChange({ price: e.target.value })}
                  className="w-full"
                />
              </div>
              <div className="space-y-2 min-w-0">
                <Label htmlFor="comparePrice">Compare at Price (MRP) (₹)</Label>
                <Input
                  id="comparePrice"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={pricingData.comparePrice}
                  onChange={(e) => onPricingDataChange({ comparePrice: e.target.value })}
                  className="w-full"
                />
              </div>
              <div className="space-y-2 min-w-0">
                <Label htmlFor="cost">Cost per Item (₹)</Label>
                <Input
                  id="cost"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={pricingData.cost}
                  onChange={(e) => onPricingDataChange({ cost: e.target.value })}
                  className="w-full"
                />
              </div>
            </div>

            {/* Discount Preview */}
            {discount > 0 && (
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">
                      Price: ₹{pricingData.price} | MRP: ₹{pricingData.comparePrice}
                    </p>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      You save: {discount}%
                    </p>
                  </div>
                  <Badge className="bg-green-600 text-white">
                    {discount}% OFF
                  </Badge>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="taxable" 
                checked={pricingData.taxable}
                onCheckedChange={(checked) => onPricingDataChange({ taxable: !!checked })}
              />
              <Label htmlFor="taxable">Charge tax on this product</Label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Variant Pricing Mode */}
      {pricingData.mode === "variant" && (
        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 dark:from-gray-900 dark:to-red-950/20 border-red-100/50 dark:border-red-900/20 hover:shadow-md transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Variant-Based Pricing</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Pricing is managed per variant in the Variants tab
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Variant Pricing</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Each variant can have its own price and MRP</li>
                <li>• Discounts are calculated automatically per variant</li>
                <li>• Go to the Variants tab to set individual prices</li>
                <li>• Tax settings apply to all variants</li>
              </ul>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="taxable-variant" 
                checked={pricingData.taxable}
                onCheckedChange={(checked) => onPricingDataChange({ taxable: !!checked })}
              />
              <Label htmlFor="taxable-variant">Charge tax on all variants</Label>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}