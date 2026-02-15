"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, Image as ImageIcon } from "lucide-react"
import Image from "next/image"

interface CategoryFormData {
  name: string
  slug: string
  image_url: string
  image_file?: File
  meta_title: string
  meta_description: string
  status: 'active' | 'inactive'
  display_order: number
}

interface PreviewStepProps {
  formData: CategoryFormData
}

export function PreviewStep({ formData }: PreviewStepProps) {
  const [previewUrl, setPreviewUrl] = useState<string>()

  useEffect(() => {
    if (formData.image_file) {
      const url = URL.createObjectURL(formData.image_file)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [formData.image_file])

  const validationItems = [
    {
      label: "Category name",
      value: formData.name,
      valid: !!formData.name.trim(),
      required: true
    },
    {
      label: "URL slug",
      value: formData.slug,
      valid: !!formData.slug.trim(),
      required: true
    },
    {
      label: "Category thumbnail",
      value: (formData.image_url || formData.image_file) ? "Uploaded" : "Not uploaded",
      valid: !!(formData.image_url || formData.image_file),
      required: true
    }
  ]

  const allRequiredValid = validationItems.filter(item => item.required).every(item => item.valid)

  return (
    <div className="space-y-6">
      {/* Validation Summary */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-2">
            {allRequiredValid ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-600" />
            )}
            <CardTitle className="text-xl font-semibold text-gray-900">
              {allRequiredValid ? "Ready to Create" : "Review Required Fields"}
            </CardTitle>
          </div>
          <p className="text-sm text-gray-600">
            {allRequiredValid
              ? "All required information has been provided. Review the details below."
              : "Please complete the required fields before creating the category."
            }
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {validationItems.map((item, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50/50">
                {item.valid ? (
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    {item.required && (
                      <Badge variant="secondary" className="text-xs">Required</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Preview */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gray-900">Category Preview</CardTitle>
          <p className="text-sm text-gray-600">How your category will appear to customers</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{formData.name || "Category Name"}</h3>
                <p className="text-sm text-gray-500">/{formData.slug || "category-slug"}</p>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant={formData.status === 'active' ? 'default' : 'secondary'}>
                  {formData.status}
                </Badge>
                <span className="text-xs text-gray-500">Order: {formData.display_order}</span>
              </div>
            </div>

            {/* Image Preview */}
            {(formData.image_url || previewUrl) && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Category Thumbnail</h4>
                <div className="relative aspect-[3/4] w-[200px]">
                  <Image
                    src={previewUrl || formData.image_url}
                    alt="Category thumbnail"
                    fill
                    className="rounded-lg object-cover border"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SEO Preview */}
          {(formData.meta_title || formData.meta_description) && (
            <div className="border-t pt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">SEO Settings</h4>
              <div className="space-y-2">
                {formData.meta_title && (
                  <div>
                    <span className="text-xs text-gray-500">Meta Title:</span>
                    <p className="text-sm text-gray-900">{formData.meta_title}</p>
                  </div>
                )}
                {formData.meta_description && (
                  <div>
                    <span className="text-xs text-gray-500">Meta Description:</span>
                    <p className="text-sm text-gray-700">{formData.meta_description}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}