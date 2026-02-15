"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, Loader2, ArrowLeft, Upload, X, Image as ImageIcon } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Banner } from "@/lib/types/banners"

export default function EditBannerPage() {
  const params = useParams()
  const router = useRouter()
  const bannerId = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [banner, setBanner] = useState<Banner | null>(null)
  const [newImage, setNewImage] = useState<File | null>(null)
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    internal_title: "",
    placement: "",
    action_type: "",
    action_target: "",
    action_name: "",
    start_date: "",
    end_date: "",
    position: "",
    category: "",
    cta_text: "",
    status: "",
  })

  useEffect(() => {
    fetchBanner()
  }, [bannerId])

  const fetchBanner = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/banners/${bannerId}`)
      if (!response.ok) throw new Error('Failed to fetch banner')

      const data = await response.json()
      setBanner(data)

      // Populate form
      setFormData({
        internal_title: data.internal_title || "",
        placement: data.placement || "",
        action_type: data.action_type || "",
        action_target: data.action_target || "",
        action_name: data.action_name || "",
        start_date: data.start_date || "",
        end_date: data.end_date || "",
        position: data.position?.toString() || "",
        category: data.category || "",
        cta_text: data.cta_text || "",
        status: data.status || "",
      })
    } catch (error) {
      console.error('Error fetching banner:', error)
      toast.error('Failed to load banner')
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNewImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setNewImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const clearNewImage = () => {
    setNewImage(null)
    setNewImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'banners')

    const response = await fetch('/api/admin/banners/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to upload image')
    }

    const data = await response.json()
    return data.url
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSaving(true)

      // Upload new image if selected
      let imageUrl = banner?.image_url
      if (newImage) {
        setUploading(true)
        try {
          imageUrl = await uploadImage(newImage)
        } finally {
          setUploading(false)
        }
      }

      const updateData: any = {
        internal_title: formData.internal_title,
        placement: formData.placement,
        action_type: formData.action_type,
        action_target: formData.action_target,
        action_name: formData.action_name,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        position: formData.position ? parseInt(formData.position) : undefined,
        category: formData.category || undefined,
        cta_text: formData.cta_text || undefined,
        status: formData.status,
        // Preserve existing complex data
        carousel_data: banner?.carousel_data,
        marquee_data: banner?.marquee_data,
      }

      // Include image_url if we have a new one
      if (imageUrl) {
        updateData.image_url = imageUrl
      }

      const response = await fetch(`/api/admin/banners/${bannerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update banner')
      }

      toast.success('Banner updated successfully!')
      router.push('/admin/banners')
    } catch (error) {
      console.error('Error updating banner:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update banner')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  if (!banner) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Banner not found</h2>
        <Button asChild>
          <Link href="/admin/banners">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Banners
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">
              Edit Banner
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2">
              Update banner details and settings
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/admin/banners">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update banner title</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="internal_title">Internal Title *</Label>
                <Input
                  id="internal_title"
                  value={formData.internal_title}
                  onChange={(e) => setFormData({ ...formData, internal_title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Action Target - Hidden for Marquee Banners */}
          {formData.placement !== 'top-marquee-banner' && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Action Target</CardTitle>
                <CardDescription>Where the banner links to</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="action_type">Action Type</Label>
                  <Select value={formData.action_type} onValueChange={(value) => setFormData({ ...formData, action_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="collection">Collection</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                      <SelectItem value="product">Product</SelectItem>
                      <SelectItem value="external">External URL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="action_target">Action Target</Label>
                    <Input
                      id="action_target"
                      value={formData.action_target}
                      onChange={(e) => setFormData({ ...formData, action_target: e.target.value })}
                      placeholder="ID or URL"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="action_name">Action Name</Label>
                    <Input
                      id="action_name"
                      value={formData.action_name}
                      onChange={(e) => setFormData({ ...formData, action_name: e.target.value })}
                      placeholder="Display name"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Optional Fields - Hidden for Marquee Banners */}
          {formData.placement !== 'top-marquee-banner' && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Optional Settings</CardTitle>
                <CardDescription>Additional banner configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cta_text">CTA Text</Label>
                    <Input
                      id="cta_text"
                      value={formData.cta_text}
                      onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                      placeholder="e.g., Shop Now"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      type="number"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      placeholder="1, 2, 3..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category (for category banners)</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Shirts"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="datetime-local"
                      value={formData.start_date ? new Date(formData.start_date).toISOString().slice(0, 16) : ""}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="datetime-local"
                      value={formData.end_date ? new Date(formData.end_date).toISOString().slice(0, 16) : ""}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Banner Content */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>
                {formData.placement === 'top-marquee-banner' ? 'Marquee Messages' : 'Banner Image'}
              </CardTitle>
              <CardDescription>
                {formData.placement === 'top-marquee-banner'
                  ? 'This is a marquee banner with scrolling text messages'
                  : (formData.placement === 'homepage-carousel' || formData.placement === 'product-listing-carousel')
                    ? 'This is a carousel banner with multiple images'
                    : 'Upload a new image to replace the current one'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Parse and display based on banner type */}
              {(() => {
                // Parse marquee data
                let marqueeItems: any[] = []
                if (banner.marquee_data) {
                  try {
                    marqueeItems = typeof banner.marquee_data === 'string'
                      ? JSON.parse(banner.marquee_data)
                      : banner.marquee_data
                  } catch (e) {
                    console.error('Failed to parse marquee_data:', e)
                  }
                }

                // Parse carousel data
                let carouselItems: any[] = []
                if (banner.carousel_data) {
                  try {
                    carouselItems = typeof banner.carousel_data === 'string'
                      ? JSON.parse(banner.carousel_data)
                      : banner.carousel_data
                  } catch (e) {
                    console.error('Failed to parse carousel_data:', e)
                  }
                }

                // Marquee Banner
                if (formData.placement === 'top-marquee-banner' || marqueeItems.length > 0) {
                  return (
                    <div className="space-y-4">
                      <p className="text-sm font-medium text-gray-700">
                        Current Marquee Messages ({marqueeItems.length} items)
                      </p>
                      <div className="space-y-2">
                        {marqueeItems.map((item: any, index: number) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="flex-shrink-0 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </span>
                            <p className="text-gray-700 font-medium">{item.text}</p>
                            {item.link && (
                              <span className="text-xs text-blue-600 ml-auto">→ {item.link}</span>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                        Note: To modify marquee messages, please create a new banner.
                      </p>
                    </div>
                  )
                }

                // Carousel Banner
                if (carouselItems.length > 0) {
                  return (
                    <div className="space-y-4">
                      <p className="text-sm font-medium text-gray-700">
                        Current Carousel Images ({carouselItems.length} slides)
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {carouselItems.map((item: any, index: number) => (
                          <div key={index} className="relative rounded-lg overflow-hidden border border-gray-200">
                            <img
                              src={item.image_url || item.imageUrl}
                              alt={`Slide ${index + 1}`}
                              className="w-full h-32 object-cover"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2">
                              <p className="font-medium">Slide {index + 1}</p>
                              {item.action_type && (
                                <p className="text-gray-300 truncate">
                                  {item.action_type}: {item.action_name || item.action_target}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                        Note: To modify carousel images, please create a new banner. Individual slide editing is not yet supported.
                      </p>
                    </div>
                  )
                }

                // Single image banner
                return (
                  <>
                    {/* Current Image Preview */}
                    {(newImagePreview || banner.image_url) && (
                      <div className="relative">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          {newImagePreview ? 'New Image Preview' : 'Current Image'}
                        </p>
                        <div className="relative inline-block">
                          <img
                            src={newImagePreview || banner.image_url || ''}
                            alt={banner.internal_title}
                            className="w-full max-w-2xl rounded-lg border border-gray-200"
                          />
                          {newImagePreview && (
                            <button
                              type="button"
                              onClick={clearNewImage}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Upload Section for single image banners */}
                    <div className="space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="banner-image-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full max-w-md"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            {newImage ? 'Change Image' : (banner.image_url ? 'Replace Image' : 'Upload Image')}
                          </>
                        )}
                      </Button>
                      {newImage && (
                        <p className="text-sm text-green-600">
                          New image selected: {newImage.name}
                        </p>
                      )}
                    </div>
                  </>
                )
              })()}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/banners">Cancel</Link>
            </Button>
            <Button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
