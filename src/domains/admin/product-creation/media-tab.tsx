"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Image, Star, X, Move, Loader2 } from "lucide-react"
import { useState } from "react"
import { supabase } from "@/lib/supabase/client"

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
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setIsUploading(true)
    const newImages: ProductImage[] = []
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadProgress(`Uploading ${i + 1} of ${files.length}...`)
        
        // Upload directly to Supabase storage from client
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `products/${fileName}`

        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) {
          console.error('Failed to upload image:', file.name, error)
          continue
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath)

        newImages.push({
          id: `img-${Date.now()}-${i}`,
          url: publicUrl,
          alt: file.name.replace(/\.[^/.]+$/, ''),
          isPrimary: images.length === 0 && i === 0 // First image is primary if no images exist
        })
      }

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages])
      }
    } catch (error) {
      console.error('Error uploading images:', error)
    } finally {
      setIsUploading(false)
      setUploadProgress('')
      // Reset the input so the same file can be uploaded again if needed
      e.target.value = ''
    }
  }

  const setPrimaryImage = (imageId: string) => {
    onImagesChange(
      images.map(img => ({
        ...img,
        isPrimary: img.id === imageId
      }))
    )
  }

  const removeImage = (imageId: string) => {
    const filteredImages = images.filter(img => img.id !== imageId)
    
    // If we removed the primary image, make the first remaining image primary
    if (filteredImages.length > 0 && !filteredImages.some(img => img.isPrimary)) {
      filteredImages[0].isPrimary = true
    }
    
    onImagesChange(filteredImages)
  }

  const reorderImages = (fromIndex: number, toIndex: number) => {
    const newImages = [...images]
    const [movedImage] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, movedImage)
    onImagesChange(newImages)
  }

  return (
    <div className="space-y-6">
      {/* Product Images */}
      <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 dark:from-gray-900 dark:to-red-950/20 border-red-100/50 dark:border-red-900/20 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Product Images</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Control how your product looks - drag to reorder, star to set primary
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
            {isUploading ? (
              <div className="space-y-4">
                <Loader2 className="mx-auto h-12 w-12 text-red-600 animate-spin" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{uploadProgress}</p>
                <p className="text-xs text-gray-500">Please wait...</p>
              </div>
            ) : (
              <>
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    onClick={() => document.getElementById('image-upload')?.click()}
                    disabled={isUploading}
                  >
                    Upload Images
                  </Button>
                  <input
                    id="image-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Drag & drop or click to upload
                  </p>
                  <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB each</p>
                </div>
              </>
            )}
          </div>

          {/* Image Grid */}
          {images.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Uploaded Images ({images.length})
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Primary image is used everywhere
                </p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div
                    key={image.id}
                    className={`relative group rounded-lg overflow-hidden border-2 ${
                      image.isPrimary 
                        ? "border-red-500 ring-2 ring-red-200" 
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <div className="aspect-square bg-gray-100 dark:bg-gray-800">
                      <img
                        src={image.url}
                        alt={image.alt}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Image Controls */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setPrimaryImage(image.id)}
                        className={image.isPrimary ? "bg-red-600 text-white" : ""}
                      >
                        <Star className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="cursor-move"
                      >
                        <Move className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeImage(image.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Primary Badge */}
                    {image.isPrimary && (
                      <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                        Primary
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rules */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Image Rules</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Primary image is used in product cards, search results, and social sharing</li>
              <li>• Other images form the product gallery on the product page</li>
              <li>• Drag images to reorder them in the gallery</li>
              <li>• Variant-specific images can be added in the Variants tab</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
