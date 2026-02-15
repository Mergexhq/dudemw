"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Upload, Loader2, Image as ImageIcon, X } from "lucide-react"
import Image from "next/image"

interface CategoryFormData {
  image_url: string
  image_file?: File
}

interface MediaStepProps {
  formData: CategoryFormData
  onFormDataChange: (updates: Partial<CategoryFormData>) => void
  onValidationChange?: (isValid: boolean) => void
}

export function MediaStep({ formData, onFormDataChange, onValidationChange }: MediaStepProps) {
  const [previewUrl, setPreviewUrl] = useState<string>()

  // Create preview URL for selected file
  useEffect(() => {
    if (formData.image_file) {
      const url = URL.createObjectURL(formData.image_file)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    } else if (formData.image_url) {
      setPreviewUrl(formData.image_url)
    } else {
      setPreviewUrl(undefined)
    }
  }, [formData.image_file, formData.image_url])

  // Notify parent of validation state changes
  useEffect(() => {
    if (onValidationChange) {
      const hasImage = !!(formData.image_file || formData.image_url)
      onValidationChange(hasImage)
    }
  }, [formData.image_file, formData.image_url, onValidationChange])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error(`File size exceeds 5MB limit. Current: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    // Store the file
    onFormDataChange({
      image_file: file
    })

    toast.success('Category thumbnail selected successfully')
  }

  const removeMedia = () => {
    onFormDataChange({
      image_url: '',
      image_file: undefined
    })
  }

  return (
    <div className="space-y-6">
      {/* Category Thumbnail */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gray-900">Category Thumbnail</CardTitle>
          <p className="text-sm text-gray-600">Upload the main image for this category</p>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">
                Category Image *
              </Label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 overflow-hidden">
                {previewUrl ? (
                  <div className="relative group aspect-[3/4] w-full max-w-[300px] mx-auto">
                    <Image
                      src={previewUrl}
                      alt="Category thumbnail"
                      fill
                      className="object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={removeMedia}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center p-6 aspect-[3/4] flex flex-col items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-sm font-medium text-gray-700 mb-2">Select category image</p>
                    <p className="text-xs text-gray-500 mb-4">Recommended: 600x800px or larger<br />(Max 5MB)</p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="category-image"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full max-w-[140px]"
                      onClick={() => document.getElementById('category-image')?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}