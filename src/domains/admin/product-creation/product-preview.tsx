"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Image, Star, ShoppingCart } from "lucide-react"

interface ProductImage {
  id: string
  url: string
  alt: string
  isPrimary: boolean
}

interface ProductPreviewProps {
  productName: string
  productSubtitle: string
  price: string
  comparePrice: string
  images: ProductImage[]
  status: string
  hasVariants: boolean
  variantCount: number
}

export function ProductPreview({ 
  productName, 
  productSubtitle, 
  price, 
  comparePrice, 
  images, 
  status,
  hasVariants,
  variantCount 
}: ProductPreviewProps) {
  const primaryImage = images.find(img => img.isPrimary)
  const displayPrice = parseFloat(price) || 0
  const displayComparePrice = parseFloat(comparePrice) || 0
  const discount = displayComparePrice > displayPrice 
    ? Math.round(((displayComparePrice - displayPrice) / displayComparePrice) * 100)
    : 0

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 dark:from-gray-900 dark:to-red-950/20 border-red-100/50 dark:border-red-900/20 hover:shadow-md transition-all duration-200 sticky top-4">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">Product Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Product Image */}
        <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
          {primaryImage ? (
            <img
              src={primaryImage.url}
              alt={primaryImage.alt}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <Image className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No image</p>
              </div>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {productName || "Product Name"}
          </h3>
          {productSubtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {productSubtitle}
            </p>
          )}
        </div>

        {/* Pricing */}
        <div className="space-y-2">
          {displayPrice > 0 ? (
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                ₹{displayPrice.toFixed(2)}
              </span>
              {displayComparePrice > displayPrice && (
                <>
                  <span className="text-sm text-gray-500 line-through">
                    ₹{displayComparePrice.toFixed(2)}
                  </span>
                  <Badge className="bg-green-600 text-white text-xs">
                    {discount}% OFF
                  </Badge>
                </>
              )}
            </div>
          ) : hasVariants ? (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Price varies by variant
            </div>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Price not set
            </div>
          )}
        </div>

        {/* Variant Info */}
        {hasVariants && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {variantCount} variants available
            </p>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
          <Badge 
            variant={status === "active" ? "default" : status === "draft" ? "secondary" : "outline"}
            className={
              status === "active" 
                ? "bg-green-100 text-green-700 border-green-200" 
                : status === "draft"
                ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                : "bg-gray-100 text-gray-700 border-gray-200"
            }
          >
            {status}
          </Badge>
        </div>

        {/* Mock Product Actions */}
        <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-1 text-yellow-500">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="h-4 w-4 fill-current" />
            ))}
            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">(24 reviews)</span>
          </div>
          
          <Button className="w-full bg-red-600 hover:bg-red-700 text-white" disabled>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Preview only - not functional
          </p>
        </div>
      </CardContent>
    </Card>
  )
}