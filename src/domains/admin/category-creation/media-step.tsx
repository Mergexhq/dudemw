"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Upload, Loader2, Image as ImageIcon, Video, X } from "lucide-react"
import Image from "next/image"

interface CategoryFormData {
  homepage_thumbnail_url: string
  homepage_video_url: string
  plp_square_thumbnail_url: string
  homepage_thumbnail_file?: File
  homepage_video_file?: File
  plp_square_thumbnail_file?: File
}

interface MediaStepProps {
  formData: CategoryFormData
  onFormDataChange: (updates: Partial<CategoryFormData>) => void
  onValidationChange?: (isValid: boolean) => void
}

interface ValidationError {
  field: string
  message: string
}

export function MediaStep({ formData, onFormDataChange, onValidationChange }: MediaStepProps) {
  const [previewUrls, setPreviewUrls] = useState<{
    homepage_thumbnail?: string
    homepage_video?: string
    plp_square_thumbnail?: string
  }>({})
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])

  // Create preview URLs for selected files
  useEffect(() => {
    const newPreviewUrls: typeof previewUrls = {}

    if (formData.homepage_thumbnail_file) {
      newPreviewUrls.homepage_thumbnail = URL.createObjectURL(formData.homepage_thumbnail_file)
    } else if (formData.homepage_thumbnail_url) {
      newPreviewUrls.homepage_thumbnail = formData.homepage_thumbnail_url
    }

    if (formData.homepage_video_file) {
      newPreviewUrls.homepage_video = URL.createObjectURL(formData.homepage_video_file)
    } else if (formData.homepage_video_url) {
      newPreviewUrls.homepage_video = formData.homepage_video_url
    }

    if (formData.plp_square_thumbnail_file) {
      newPreviewUrls.plp_square_thumbnail = URL.createObjectURL(formData.plp_square_thumbnail_file)
    } else if (formData.plp_square_thumbnail_url) {
      newPreviewUrls.plp_square_thumbnail = formData.plp_square_thumbnail_url
    }

    setPreviewUrls(newPreviewUrls)

    // Cleanup function to revoke blob URLs
    return () => {
      Object.values(newPreviewUrls).forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [
    formData.homepage_thumbnail_file,
    formData.homepage_video_file,
    formData.plp_square_thumbnail_file,
    formData.homepage_thumbnail_url,
    formData.homepage_video_url,
    formData.plp_square_thumbnail_url
  ])

  // Notify parent of validation state changes
  useEffect(() => {
    if (onValidationChange) {
      // Check if all required files meet validation
      const hasRequiredThumbnail = !!(formData.homepage_thumbnail_file || formData.homepage_thumbnail_url)
      const hasRequiredPLP = !!(formData.plp_square_thumbnail_file || formData.plp_square_thumbnail_url)
      const hasNoErrors = validationErrors.length === 0

      onValidationChange(hasRequiredThumbnail && hasRequiredPLP && hasNoErrors)
    }
  }, [validationErrors, formData.homepage_thumbnail_file, formData.homepage_thumbnail_url, formData.plp_square_thumbnail_file, formData.plp_square_thumbnail_url, onValidationChange])


  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'homepage_thumbnail' | 'homepage_video' | 'plp_square_thumbnail'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 1. Validate file size (max 5MB for images, 10MB for video)
    const maxSize = type === 'homepage_video' ? 10 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error(`File size exceeds limit (${type === 'homepage_video' ? '10MB' : '5MB'}). Current: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
      return
    }

    // 2. Validate file type
    if (type === 'homepage_video') {
      if (!file.type.startsWith('video/')) {
        toast.error('Please select a valid video file')
        return
      }
    } else {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file')
        return
      }

      // 3. Validate Orientation/Aspect Ratio
      try {
        const validationType = type === 'plp_square_thumbnail' ? 'plp' : 'homepage'
        const isValid = await validateImageRatio(file, validationType)
        if (!isValid.valid) {
          toast.error(isValid.error)
          // Add to validation errors to block progression
          setValidationErrors(prev => [
            ...prev.filter(e => e.field !== type),
            { field: type, message: isValid.error || 'Invalid aspect ratio' }
          ])
          return
        } else {
          // Remove validation error if it exists
          setValidationErrors(prev => prev.filter(e => e.field !== type))
        }
      } catch (err) {
        console.error('Validation error:', err)
      }
    }

    // Store the file object
    onFormDataChange({
      [`${type}_file`]: file
    })

    toast.success(`${type.replace(/_/g, ' ')} selected successfully.`)
  }

  const validateImageRatio = (file: File, type: 'homepage' | 'plp'): Promise<{ valid: boolean; error?: string }> => {
    return new Promise((resolve) => {
      const img = new (window as any).Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const ratio = img.width / img.height

        if (type === 'homepage') {
          // 4:3 ratio is 1.333 (matching EnhancedCategoryCard aspect-[4/3])
          if (ratio >= 1.25 && ratio <= 1.4) {
            resolve({ valid: true })
          } else {
            resolve({
              valid: false,
              error: `Homepage media must be 4:3 landscape ratio. Current: ${img.width}x${img.height} (${ratio.toFixed(2)}:1)`
            })
          }
        } else {
          // Square ratio is 1.0 (matching CategoryLiteCard aspect-square)
          if (ratio >= 0.95 && ratio <= 1.05) {
            resolve({ valid: true })
          } else {
            resolve({
              valid: false,
              error: `PLP thumbnail must be square (1:1 ratio). Current: ${img.width}x${img.height} (${ratio.toFixed(2)}:1)`
            })
          }
        }
      }
      img.onerror = () => resolve({ valid: false, error: 'Failed to load image for validation' })
      img.src = url
    })
  }

  const removeMedia = (type: 'homepage_thumbnail' | 'homepage_video' | 'plp_square_thumbnail') => {
    onFormDataChange({
      [`${type}_url`]: '',
      [`${type}_file`]: undefined
    })
  }

  return (
    <div className="space-y-6">
      {/* Homepage Display Media */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gray-900">Homepage Display</CardTitle>
          <p className="text-sm text-gray-600">Configure how this category appears on the homepage</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Homepage Thumbnail */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">
                Homepage Thumbnail *
              </Label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 overflow-hidden">
                {(previewUrls.homepage_thumbnail || formData.homepage_thumbnail_url) ? (
                  <div className="relative group aspect-[4/3] w-full max-w-[400px] mx-auto">
                    <Image
                      src={previewUrls.homepage_thumbnail || formData.homepage_thumbnail_url}
                      alt="Homepage thumbnail"
                      fill
                      className="object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeMedia('homepage_thumbnail')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center p-6 aspect-[4/3] flex flex-col items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-sm font-medium text-gray-700 mb-2">Select homepage thumbnail</p>
                    <p className="text-xs text-gray-500 mb-4">Required: Landscape 4:3<br />(e.g., 800x600px, Max 5MB)</p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e, 'homepage_thumbnail')}
                      className="hidden"
                      id="homepage-thumbnail"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full max-w-[140px]"
                      onClick={() => document.getElementById('homepage-thumbnail')?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Homepage Video (Optional) */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">
                Homepage Video (Optional)
              </Label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 overflow-hidden">
                {(previewUrls.homepage_video || formData.homepage_video_url) ? (
                  <div className="relative group aspect-[4/3] w-full max-w-[400px] mx-auto">
                    <video
                      src={previewUrls.homepage_video || formData.homepage_video_url}
                      className="w-full h-full object-cover"
                      controls
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeMedia('homepage_video')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center p-6 aspect-[4/3] flex flex-col items-center justify-center">
                    <Video className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-sm font-medium text-gray-700 mb-2">Select homepage video</p>
                    <p className="text-xs text-gray-500 mb-4">Recommended: Landscape 4:3, MP4, max 10MB</p>
                    <Input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleFileSelect(e, 'homepage_video')}
                      className="hidden"
                      id="homepage-video"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full max-w-[140px]"
                      onClick={() => document.getElementById('homepage-video')?.click()}
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

      {/* PLP Display Media */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gray-900">Product Listing Page (PLP) Display</CardTitle>
          <p className="text-sm text-gray-600">Configure how this category appears on product listing pages</p>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">
                Square Category Thumbnail *
              </Label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 overflow-hidden w-[200px] h-[200px]">
                {(previewUrls.plp_square_thumbnail || formData.plp_square_thumbnail_url) ? (
                  <div className="relative group w-full h-full">
                    <Image
                      src={previewUrls.plp_square_thumbnail || formData.plp_square_thumbnail_url}
                      alt="PLP square thumbnail"
                      fill
                      className="object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeMedia('plp_square_thumbnail')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center p-6 w-full h-full flex flex-col items-center justify-center">
                    <ImageIcon className="h-10 w-10 text-gray-400 mb-3" />
                    <p className="text-sm font-medium text-gray-700 mb-1">Select square</p>
                    <p className="text-[10px] text-gray-500 mb-3">1:1 ratio<br />(e.g. 400px)</p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e, 'plp_square_thumbnail')}
                      className="hidden"
                      id="plp-thumbnail"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full max-w-[120px]"
                      onClick={() => document.getElementById('plp-thumbnail')?.click()}
                    >
                      <Upload className="h-3 w-3 mr-2" />
                      Choose
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Errors Display */}
      {validationErrors.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Validation Errors</h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, idx) => (
                      <li key={idx}>{error.message}</li>
                    ))}
                  </ul>
                </div>
                <p className="mt-3 text-xs text-red-600">
                  Please fix these issues before proceeding to the next step.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}