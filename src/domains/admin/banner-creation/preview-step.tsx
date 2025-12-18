"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Image } from "lucide-react"

type BannerPlacement = "homepage-carousel" | "product-listing-carousel" | "category-banner"
type ActionType = "collection" | "category" | "product" | "external"

interface BannerFormData {
  placement?: BannerPlacement
  internalTitle: string
  bannerImage?: File
  ctaText?: string
  position?: number
  category?: string
  actionType?: ActionType
  actionTarget: string
}

interface PreviewStepProps {
  formData: BannerFormData
}

const getPlacementLabel = (placement: BannerPlacement): string => {
  switch (placement) {
    case "homepage-carousel": return "Homepage Carousel"
    case "product-listing-carousel": return "Product Listing Carousel"
    case "category-banner": return "Category Banner"
  }
}

const getActionLabel = (actionType: ActionType): string => {
  switch (actionType) {
    case "collection": return "Link to Collection"
    case "category": return "Link to Category"
    case "product": return "Link to Product"
    case "external": return "External URL"
  }
}

export function PreviewStep({ formData }: PreviewStepProps) {
  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-xl font-bold text-gray-900">
            <Eye className="h-5 w-5" />
            <span>Preview</span>
          </CardTitle>
          <CardDescription className="text-gray-600">
            How your banner will appear to customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Preview Panel */}
            <div className="p-6 bg-gray-100 rounded-lg">
              <div className="text-center">
                <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-center">
                    <Image className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Banner Preview</p>
                    <p className="text-xs text-gray-400">
                      {formData.placement && getPlacementLabel(formData.placement)}
                    </p>
                  </div>
                </div>
                {formData.ctaText && (
                  <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                    {formData.ctaText}
                  </Button>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="grid gap-4 sm:grid-cols-2 w-full">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Banner Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Internal Title:</span>
                    <span className="font-medium">{formData.internalTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Placement:</span>
                    <span className="font-medium">
                      {formData.placement && getPlacementLabel(formData.placement)}
                    </span>
                  </div>
                  {formData.category && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium">{formData.category}</span>
                    </div>
                  )}
                  {formData.position && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Position:</span>
                      <span className="font-medium">{formData.position}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Action & Status</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Action:</span>
                    <span className="font-medium">
                      {formData.actionType && getActionLabel(formData.actionType)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Target:</span>
                    <span className="font-medium truncate ml-2">{formData.actionTarget}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge variant="outline" className="text-green-700 border-green-200">
                      Active
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}