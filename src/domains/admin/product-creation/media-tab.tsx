"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, X, Image as ImageIcon, Star, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ProductImage {
  id: string
  url: string
  alt: string
  isPrimary: boolean
}

interface MediaTabProps {
  images: ProductImage[]
  onImagesChange: (images: ProductImage[]) => void
}

export function MediaTab({ images, onImagesChange }: MediaTabProps) {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return

    setUploading(true)
    const uploadedImages: ProductImage[] = []

    try {
      // Upload each file to Cloudinary
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        try {
          // Create FormData for Server Action
          const formData = new FormData()
          formData.append('file', file)

          // Import Server Action
          const { uploadImageAction } = await import('@/app/actions/media')

          // Upload to Cloudinary 'products' folder
          const result = await uploadImageAction(formData, 'products')

          if (!result.success || !result.url) {
            console.error('Upload error:', result.error)
            toast.error(`Failed to upload ${file.name}: ${result.error}`)
            continue
          }

          uploadedImages.push({
            id: `uploaded-${Date.now()}-${i}`,
            url: result.url,
            alt: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
            isPrimary: images.length === 0 && i === 0 // First image is primary if no images exist
          })

          toast.success(`${file.name} uploaded successfully`)
        } catch (error: any) {
          console.error(`Error uploading ${file.name}:`, error)
          toast.error(`Failed to upload ${file.name}`)
        }
      }

      if (uploadedImages.length > 0) {
        onImagesChange([...images, ...uploadedImages])
      }
    } catch (error: any) {
      console.error('Error in file upload:', error)
      toast.error('Failed to upload images')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (imageId: string) => {
    const updatedImages = images.filter(img => img.id !== imageId)
    // If we removed the primary image, make the first remaining image primary
    if (updatedImages.length > 0 && !updatedImages.some(img => img.isPrimary)) {
      updatedImages[0].isPrimary = true
    }
    onImagesChange(updatedImages)
  }

  const setPrimaryImage = (imageId: string) => {
    const updatedImages = images.map(img => ({
      ...img,
      isPrimary: img.id === imageId
    }))
    onImagesChange(updatedImages)
  }

  const updateAltText = (imageId: string, alt: string) => {
    const updatedImages = images.map(img =>
      img.id === imageId ? { ...img, alt } : img
    )
    onImagesChange(updatedImages)
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">Product Images</CardTitle>
          <CardDescription className="text-gray-600">
            Upload high-quality images to showcase your product
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragOver
              ? 'border-red-400 bg-red-50'
              : 'border-gray-300 hover:border-red-300 hover:bg-red-50/50'
              }`}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              handleFileUpload(e.dataTransfer.files)
            }}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                Drop images here or click to upload
              </p>
              <p className="text-sm text-gray-600">
                PNG, JPG, GIF up to 10MB each. Recommended: 1200x1200px
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              disabled={uploading}
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.multiple = true
                input.accept = 'image/*'
                input.onchange = (e) => {
                  const target = e.target as HTMLInputElement
                  handleFileUpload(target.files)
                }
                input.click()
              }}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Choose Files'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Image Gallery */}
      {images.length > 0 && (
        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Image Gallery</CardTitle>
            <CardDescription className="text-gray-600">
              Manage your product images and set the primary image
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image) => (
                <div key={image.id} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={image.url}
                      alt={image.alt}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Image Controls */}
                  {/* Image Controls */}
                  <div className="absolute top-2 right-2 flex items-center gap-2">
                    {image.isPrimary ? (
                      <Badge className="bg-yellow-500 text-white h-8 px-2 flex items-center shadow-sm">
                        <Star className="w-3 h-3 mr-1" />
                        Primary
                      </Badge>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-8 bg-white/90 hover:bg-white shadow-sm backdrop-blur-sm"
                        onClick={() => setPrimaryImage(image.id)}
                      >
                        <Star className="w-3 h-3 mr-1" />
                        Set Primary
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8 shadow-sm"
                      onClick={() => removeImage(image.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Alt Text */}
                  <div className="mt-2">
                    <Label htmlFor={`alt-${image.id}`} className="text-sm font-medium">
                      Alt Text
                    </Label>
                    <Input
                      id={`alt-${image.id}`}
                      placeholder="Describe this image..."
                      value={image.alt}
                      onChange={(e) => updateAltText(image.id, e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}