"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, ExternalLink, Image as ImageIcon } from "lucide-react"
import Image from "next/image"

interface BannerOption {
  id: string
  internal_title: string
  image_url: string | null
  placement: string
  status: string
}

interface CategoryFormData {
  banner_source: 'none' | 'existing' | 'create'
  selected_banner_id: string
}

interface BannerStepProps {
  formData: CategoryFormData
  availableBanners: BannerOption[]
  onFormDataChange: (updates: Partial<CategoryFormData>) => void
  onCreateBanner: () => void
}

export function BannerStep({ formData, availableBanners, onFormDataChange, onCreateBanner }: BannerStepProps) {
  const selectedBanner = availableBanners.find(b => b.id === formData.selected_banner_id)

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gray-900">Banner Management</CardTitle>
          <p className="text-sm text-gray-600">Choose how to handle banners for this category</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup
            value={formData.banner_source}
            onValueChange={(value: 'none' | 'existing' | 'create') =>
              onFormDataChange({ banner_source: value, selected_banner_id: '' })
            }
            className="space-y-4"
          >
            {/* No Banner Option */}
            <div className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50/50 transition-colors">
              <RadioGroupItem value="none" id="banner-none" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="banner-none" className="text-sm font-medium text-gray-900 cursor-pointer">
                  No banner
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  This category will not display any banner
                </p>
              </div>
            </div>

            {/* Existing Banner Option */}
            <div className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50/50 transition-colors">
              <RadioGroupItem value="existing" id="banner-existing" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="banner-existing" className="text-sm font-medium text-gray-900 cursor-pointer">
                  Use existing banner
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  Select from {availableBanners.length} available category banners
                </p>
              </div>
            </div>

            {/* Create New Banner Option */}
            <div className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50/50 transition-colors">
              <RadioGroupItem value="create" id="banner-create" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="banner-create" className="text-sm font-medium text-gray-900 cursor-pointer">
                  Create new banner
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  Open banner creation wizard in a new tab
                </p>
              </div>
            </div>
          </RadioGroup>

          {/* Existing Banner Selection */}
          {formData.banner_source === 'existing' && (
            <div className="space-y-4 p-4 bg-blue-50/50 border border-blue-200 rounded-lg">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Select Banner</Label>
                {availableBanners.length > 0 ? (
                  <Select
                    value={formData.selected_banner_id}
                    onValueChange={(value) => onFormDataChange({ selected_banner_id: value })}
                  >
                    <SelectTrigger className="h-11 bg-white">
                      <SelectValue placeholder="Choose a banner" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBanners.map((banner) => (
                        <SelectItem key={banner.id} value={banner.id}>
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-6 bg-gray-200 rounded flex items-center justify-center">
                              <ImageIcon className="h-3 w-3 text-gray-500" />
                            </div>
                            <span>{banner.internal_title}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm">No category banners available</p>
                    <p className="text-xs">Create a new banner to get started</p>
                  </div>
                )}
              </div>

              {/* Selected Banner Preview */}
              {selectedBanner && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Preview</Label>
                  <div className="border border-gray-200 rounded-lg p-3 bg-white">
                    <div className="flex items-start space-x-3">
                      {selectedBanner.image_url ? (
                        <Image
                          src={selectedBanner.image_url}
                          alt={selectedBanner.internal_title}
                          width={120}
                          height={80}
                          className="rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-[120px] h-[80px] bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {selectedBanner.internal_title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          Placement: {selectedBanner.placement}
                        </p>
                        <p className="text-xs text-gray-500">
                          Status: {selectedBanner.status}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Create New Banner */}
          {formData.banner_source === 'create' && (
            <div className="space-y-4 p-4 bg-green-50/50 border border-green-200 rounded-lg">
              <div className="text-center">
                <Plus className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <h4 className="text-sm font-medium text-gray-900 mb-2">Create New Banner</h4>
                <p className="text-xs text-gray-500 mb-4">
                  This will open the banner creation wizard. You can return here after creating the banner.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCreateBanner}
                  className="w-full border-green-300 text-green-700 hover:bg-green-50"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Banner Creator
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}