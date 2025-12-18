"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Upload } from "lucide-react"

type BannerPlacement = "homepage-carousel" | "product-listing-carousel" | "category-banner"

interface BannerFormData {
  internalTitle: string
  bannerImage?: File
  ctaText?: string
  position?: number
  category?: string
}

interface ContentStepProps {
  placement: BannerPlacement
  formData: BannerFormData
  onFormDataChange: (updates: Partial<BannerFormData>) => void
}

export function ContentStep({ placement, formData, onFormDataChange }: ContentStepProps) {
  const getAspectRatio = (placement: BannerPlacement): string => {
    switch (placement) {
      case "homepage-carousel":
      case "product-listing-carousel":
        return "16:6 or 16:7"
      case "category-banner":
        return "16:4"
    }
  }

  return (
    <div className="space-y-6">
      {/* Common Fields */}
      <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">Banner Content</CardTitle>
          <CardDescription className="text-gray-600">
            Essential banner details and image
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="internalTitle">Internal Title *</Label>
            <Input
              id="internalTitle"
              placeholder="e.g., Winter Sale – Main Banner"
              value={formData.internalTitle}
              onChange={(e) => onFormDataChange({ internalTitle: e.target.value })}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Used only in admin - not visible to customers
            </p>
          </div>

          <div className="space-y-2">
            <Label>Banner Image *</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="space-y-2">
                <Button variant="outline" onClick={() => document.getElementById('banner-upload')?.click()}>
                  Upload Banner Image
                </Button>
                <input
                  id="banner-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) onFormDataChange({ bannerImage: file })
                  }}
                />
                <p className="text-sm text-gray-500">
                  Recommended: {getAspectRatio(placement)} aspect ratio
                </p>
                <p className="text-xs text-gray-400">PNG, JPG up to 10MB</p>
              </div>
            </div>
            {formData.bannerImage && (
              <p className="text-sm text-green-600">
                ✓ {formData.bannerImage.name} selected
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Placement-Specific Fields */}
      {(placement === "homepage-carousel" || placement === "product-listing-carousel") && (
        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Carousel Settings</CardTitle>
            <CardDescription className="text-gray-600">
              Configure carousel-specific options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 w-full">
              <div className="space-y-2 min-w-0">
                <Label htmlFor="ctaText">CTA Text (Optional)</Label>
                <Input
                  id="ctaText"
                  placeholder="e.g., Shop Winter Sale"
                  value={formData.ctaText || ""}
                  onChange={(e) => onFormDataChange({ ctaText: e.target.value })}
                  className="w-full"
                />
              </div>
              <div className="space-y-2 min-w-0">
                <Label htmlFor="position">Position in Carousel</Label>
                <Select value={formData.position?.toString()} onValueChange={(value) => onFormDataChange({ position: parseInt(value) })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 (First)</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {placement === "category-banner" && (
        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Category Settings</CardTitle>
            <CardDescription className="text-gray-600">
              Select which category this banner will appear on
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => onFormDataChange({ category: value })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Shirts">Shirts</SelectItem>
                  <SelectItem value="Hoodies">Hoodies</SelectItem>
                  <SelectItem value="Pants">Pants</SelectItem>
                  <SelectItem value="Jackets">Jackets</SelectItem>
                  <SelectItem value="Accessories">Accessories</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Only one active banner per category is allowed
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}