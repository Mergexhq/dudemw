"use client"

import { useState } from "react"
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
  const [errors, setErrors] = useState<{
    price?: string
    comparePrice?: string
    cost?: string
  }>({})

  const validatePrice = (value: string) => {
    if (!value.trim()) {
      return "Selling price is required"
    }
    const numValue = parseFloat(value)
    if (isNaN(numValue)) {
      return "Price must be a valid number"
    }
    if (numValue < 0) {
      return "Price cannot be negative"
    }
    if (numValue === 0) {
      return "Price must be greater than 0"
    }
    return undefined
  }

  const validateComparePrice = (value: string, price: string) => {
    if (!value.trim()) return undefined // Optional field
    
    const numValue = parseFloat(value)
    if (isNaN(numValue)) {
      return "Compare price must be a valid number"
    }
    if (numValue < 0) {
      return "Compare price cannot be negative"
    }
    
    const priceValue = parseFloat(price)
    if (!isNaN(priceValue) && numValue <= priceValue) {
      return "Compare price should be higher than selling price"
    }
    return undefined
  }

  const validateCost = (value: string) => {
    if (!value.trim()) return undefined // Optional field
    
    const numValue = parseFloat(value)
    if (isNaN(numValue)) {
      return "Cost must be a valid number"
    }
    if (numValue < 0) {
      return "Cost cannot be negative"
    }
    return undefined
  }

  const handlePriceChange = (value: string) => {
    onPricingDataChange({ price: value })
    const error = validatePrice(value)
    setErrors(prev => ({ ...prev, price: error }))
    
    // Re-validate compare price if it exists
    if (pricingData.comparePrice) {
      const comparePriceError = validateComparePrice(pricingData.comparePrice, value)
      setErrors(prev => ({ ...prev, comparePrice: comparePriceError }))
    }
  }

  const handlePriceBlur = () => {
    const error = validatePrice(pricingData.price)
    setErrors(prev => ({ ...prev, price: error }))
  }

  const handleComparePriceChange = (value: string) => {
    onPricingDataChange({ comparePrice: value })
    const error = validateComparePrice(value, pricingData.price)
    setErrors(prev => ({ ...prev, comparePrice: error }))
  }

  const handleComparePriceBlur = () => {
    const error = validateComparePrice(pricingData.comparePrice, pricingData.price)
    setErrors(prev => ({ ...prev, comparePrice: error }))
  }

  const handleCostChange = (value: string) => {
    onPricingDataChange({ cost: value })
    const error = validateCost(value)
    setErrors(prev => ({ ...prev, cost: error }))
  }

  const handleCostBlur = () => {
    const error = validateCost(pricingData.cost)
    setErrors(prev => ({ ...prev, cost: error }))
  }
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
          ? 'bg-gradient-to-b from-blue-50 to-white border-blue-100/50'
          : 'bg-gradient-to-b from-white to-red-50 border-red-100/50'
        }`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className={`h-5 w-5 ${hasVariants ? 'text-blue-600' : 'text-red-600'}`} />
                Pricing Mode
              </CardTitle>
              <CardDescription className="text-gray-600">
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
          <p className="text-sm text-gray-600">
            {hasVariants
              ? `This product has ${variantCount} variants. Each variant can have its own price.`
              : 'This product has no variants, so it uses a single price.'
            }
          </p>
        </CardContent>
      </Card>

      {/* Variant Pricing Mode */}
      {hasVariants && (
        <Card className="border-0 shadow-sm bg-gradient-to-b from-blue-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Pricing is managed in the Variants tab
                </h3>
                <p className="text-sm text-gray-600 mb-4">
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
        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Product Pricing</CardTitle>
            <CardDescription className="text-gray-600">
              Set the selling price, MRP, and cost for this product
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-base font-semibold text-gray-900">
                  Selling Price (₹) *
                </Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={pricingData.price}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  onBlur={handlePriceBlur}
                  className={`text-lg ${errors.price ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                {errors.price && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.price}</span>
                  </div>
                )}
                <p className="text-xs text-gray-500">The price customers pay</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="comparePrice" className="text-base font-semibold text-gray-900">
                  Compare at Price / MRP (₹)
                </Label>
                <Input
                  id="comparePrice"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={pricingData.comparePrice}
                  onChange={(e) => handleComparePriceChange(e.target.value)}
                  onBlur={handleComparePriceBlur}
                  className={`text-lg ${errors.comparePrice ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                {errors.comparePrice && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.comparePrice}</span>
                  </div>
                )}
                <p className="text-xs text-gray-500">Original price before discount</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost" className="text-base font-semibold text-gray-900">
                  Cost per Item (₹)
                </Label>
                <Input
                  id="cost"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={pricingData.cost}
                  onChange={(e) => handleCostChange(e.target.value)}
                  onBlur={handleCostBlur}
                  className={`text-lg ${errors.cost ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                {errors.cost && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.cost}</span>
                  </div>
                )}
                <p className="text-xs text-gray-500">Your cost (not shown to customers)</p>
              </div>
            </div>

            {/* Discount Preview */}
            {discount > 0 && (
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-900">
                        ₹{pricingData.price}
                        <span className="text-sm font-normal text-green-700 ml-2 line-through">
                          ₹{pricingData.comparePrice}
                        </span>
                      </p>
                      <p className="text-sm text-green-700">
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
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-blue-900">
                      Profit Margin
                    </p>
                    <p className="text-sm text-blue-700">
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
      <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">Tax Settings</CardTitle>
          <CardDescription className="text-gray-600">
            Configure tax behavior for this product
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/60 border border-gray-200/50">
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
                <p className="text-sm text-gray-600">
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