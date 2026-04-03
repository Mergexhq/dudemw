"use client"

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Save,
  Package,
  IndianRupee,
  Warehouse,
  Image as ImageIcon,
  Upload,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { updateVariantAction, saveVariantImageAction, deleteVariantImageAction } from '@/lib/actions/variants'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface VariantEditViewProps {
  product: any
  variant: any
}

export function VariantEditView({ product, variant }: VariantEditViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: variant.name || '',
    sku: variant.sku || '',
    price: variant.price || 0,
    compare_price: variant.discount_price || '',
    stock: variant.stock || 0,
    active: variant.active ?? true,
    manage_inventory: true, // We are defaulting this to true as the inventory_items tracks it
    allow_backorders: false,
    discountable: true,
    taxable: true,
  })

  // Variant images state - current existing images + new ones
  const [existingImages, setExistingImages] = useState<Array<any>>(variant.variant_images || [])
  const [newImages, setNewImages] = useState<Array<{ url: string; file: File }>>([])

  // Stock status
  const getStockStatus = () => {
    if (!formData.manage_inventory) return { label: 'Unlimited', color: 'bg-blue-100 text-blue-700 border-blue-200' }
    if (formData.allow_backorders && formData.stock <= 0) return { label: 'Backorder', color: 'bg-orange-100 text-orange-700 border-orange-200' }
    if (formData.stock <= 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700 border-red-200' }
    if (formData.stock < 10) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
    return { label: 'In Stock', color: 'bg-green-100 text-green-700 border-green-200' }
  }

  const stockStatus = getStockStatus()

  // Calculate final price
  const finalPrice = formData.price
  const hasDiscount = formData.compare_price && parseFloat(formData.compare_price.toString()) > formData.price
  const discountPercent = hasDiscount
    ? Math.round(((parseFloat(formData.compare_price.toString()) - formData.price) / parseFloat(formData.compare_price.toString())) * 100)
    : 0

  // Handle image upload preview
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`)
        continue
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 5MB.`)
        continue
      }

      const url = URL.createObjectURL(file)
      setNewImages(prev => [...prev, { url, file }])
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Handle deleting new unuploaded image
  const handleDeleteNewImage = (index: number) => {
    setNewImages(prev => {
      const images = [...prev]
      URL.revokeObjectURL(images[index].url)
      images.splice(index, 1)
      return images
    })
  }

  // Handle deleting existing image
  const handleDeleteExistingImage = async (imageId: string) => {
    try {
      const result = await deleteVariantImageAction(imageId)
      if (result.success) {
        setExistingImages(prev => prev.filter(img => img.id !== imageId))
        toast.success("Image removed")
      } else {
        toast.error("Failed to remove image")
      }
    } catch (e) {
      toast.error("Error deleting image")
    }
  }

  // Handle save
  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error('Variant name is required')
      return
    }

    if (formData.price <= 0) {
      toast.error('Price must be greater than 0')
      return
    }

    startTransition(async () => {
      try {
        // We aren't doing strict SKU validation if it hasn't changed.
        // It's possible to do a check, but we skip for now on edit

        // Update variant
        const result = await updateVariantAction(variant.id, {
          name: formData.name,
          sku: formData.sku,
          price: formData.price,
          discount_price: formData.compare_price ? parseFloat(formData.compare_price.toString()) : null,
          stock: formData.stock,
          active: formData.active,
        })

        if (!result.success) throw new Error(result.error)

        // Upload new images if any
        if (newImages.length > 0) {
          setIsUploading(true)
          const startingPos = existingImages.length

          for (let i = 0; i < newImages.length; i++) {
            const { file } = newImages[i]

            try {
              const imageFormData = new FormData()
              imageFormData.append('file', file)

              const { uploadImageAction } = await import('@/app/actions/media')
              const uploadResult = await uploadImageAction(imageFormData, 'products')

              if (!uploadResult.success || !uploadResult.url) {
                console.error('Upload error:', uploadResult.error)
                toast.error(`Failed to upload ${file.name}`)
                continue
              }

              await saveVariantImageAction(variant.id, uploadResult.url, file.name, startingPos + i)
            } catch (error: any) {
              console.error('Error uploading variant image:', error)
              toast.error(`Failed to upload ${file.name}`)
              continue
            }
          }
        }

        toast.success('Variant updated successfully')
        router.push(`/admin/products/${product.id}/variants`)
      } catch (error) {
        console.error('Error updating variant:', error)
        toast.error('Failed to update variant')
      } finally {
        setIsUploading(false)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between py-4 border-b border-gray-200">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">Edit Variant</h1>
          <p className="text-gray-500">Editing variant: {variant.name}</p>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="outline" className="bg-white border-gray-200 text-gray-700" asChild>
            <Link href={`/admin/products/${product.id}/variants`}>
              Cancel
            </Link>
          </Button>

          <Button onClick={handleSave} disabled={isPending || isUploading} className="bg-red-600 hover:bg-red-700 text-white">
            <Save className="w-4 h-4 mr-2" />
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Basic Information */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <Package className="w-5 h-5 mr-2 text-red-600" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Variant Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., M / Black"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                disabled
                className="font-mono bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500">SKU is auto-generated and cannot be edited</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <IndianRupee className="w-5 h-5 mr-2 text-red-600" />
            Pricing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor="price">Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                className="text-lg font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="compare_price">Compare-at Price (₹)</Label>
              <Input
                id="compare_price"
                type="number"
                min="0"
                step="0.01"
                value={formData.compare_price}
                onChange={(e) => setFormData(prev => ({ ...prev, compare_price: e.target.value }))}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label>Discountable</Label>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg h-10">
                <span className="text-sm">{formData.discountable ? 'Yes' : 'No'}</span>
                <Switch
                  checked={formData.discountable}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, discountable: checked }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Taxable</Label>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg h-10">
                <span className="text-sm">{formData.taxable ? 'Yes' : 'No'}</span>
                <Switch
                  checked={formData.taxable}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, taxable: checked }))}
                />
              </div>
            </div>
          </div>

          {/* Final Price Preview */}
          <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Customer Pays</p>
                <p className="text-2xl font-bold text-green-800">₹{finalPrice.toLocaleString()}</p>
              </div>
              {hasDiscount && (
                <Badge className="bg-green-600 text-white text-sm">
                  {discountPercent}% OFF
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <Warehouse className="w-5 h-5 mr-2 text-red-600" />
            Inventory & Fulfillment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Manage Inventory</Label>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{formData.manage_inventory ? 'Tracked' : 'Unlimited'}</p>
                  <p className="text-xs text-gray-500">
                    {formData.manage_inventory ? 'Stock is monitored' : 'No quantity limits'}
                  </p>
                </div>
                <Switch
                  checked={formData.manage_inventory}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, manage_inventory: checked }))}
                />
              </div>
            </div>

            {formData.manage_inventory && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                    className="text-lg font-semibold"
                  />
                  <Badge className={stockStatus.color}>{stockStatus.label}</Badge>
                </div>

                <div className="space-y-2">
                  <Label>Allow Backorders</Label>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{formData.allow_backorders ? 'Allowed' : 'Not Allowed'}</p>
                      <p className="text-xs text-gray-500">
                        {formData.allow_backorders ? 'Sell when out of stock' : 'Stop selling at 0'}
                      </p>
                    </div>
                    <Switch
                      checked={formData.allow_backorders}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allow_backorders: checked }))}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Variant Images */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <ImageIcon className="w-5 h-5 mr-2 text-red-600" />
            Variant Images
          </CardTitle>
          <CardDescription>
            Update images specific to this variant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />

          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Existing Images */}
              {existingImages.map((image, index) => (
                <div
                  key={image.id}
                  className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group border-2 border-transparent hover:border-red-200 transition-colors"
                >
                  <img
                    src={image.image_url}
                    alt={`Variant image`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteExistingImage(image.id)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  {index === 0 && (
                    <Badge className="absolute top-2 left-2 bg-white text-gray-700 text-xs">Current</Badge>
                  )}
                </div>
              ))}

              {/* New Selected Images */}
              {newImages.map((image, index) => (
                <div
                  key={`new-${index}`}
                  className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group border-2 border-blue-200"
                >
                  <img
                    src={image.url}
                    alt={`New variant image`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteNewImage(index)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <Badge className="absolute top-2 left-2 bg-blue-500 text-white text-xs">New</Badge>
                </div>
              ))}

              {/* Upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-red-300 flex flex-col items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
              >
                {isUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 mb-1" />
                    <span className="text-xs">Add</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
            Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Active Status</p>
              <p className="text-sm text-gray-500">
                {formData.active ? 'Variant is available in store' : 'Variant is hidden from store'}
              </p>
            </div>
            <Switch
              checked={formData.active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
