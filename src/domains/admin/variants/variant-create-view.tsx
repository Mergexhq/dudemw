"use client"

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Save,
  Package,
  IndianRupee,
  Warehouse,
  Image as ImageIcon,
  Upload,
  X,
  Loader2,
  Tag,
  AlertCircle,
  Plus
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface VariantCreateViewProps {
  product: any
}

export function VariantCreateView({ product }: VariantCreateViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get product options for variant creation
  const productOptions = product.product_options || []
  const colorOptions = productOptions.find((opt: any) => opt.name.toLowerCase() === 'color')?.product_option_values || []
  const sizeOptions = productOptions.find((opt: any) => opt.name.toLowerCase() === 'size')?.product_option_values || []

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: product.price || 0,
    compare_price: '',
    stock: 0,
    active: true,
    manage_inventory: true,
    allow_backorders: false,
    discountable: true,
    taxable: true,
    // Variant options
    color_option_id: '',
    size_option_id: '',
  })

  // Variant images state
  const [variantImages, setVariantImages] = useState<Array<{ url: string; file: File }>>([])

  // Auto-generate SKU when options change
  const generateSKU = () => {
    const selectedColor = colorOptions.find((opt: any) => opt.id === formData.color_option_id)
    const selectedSize = sizeOptions.find((opt: any) => opt.id === formData.size_option_id)
    
    if (selectedColor && selectedSize) {
      const category = product.product_categories?.[0]?.categories?.name || 'PRODUCT'
      const colorName = selectedColor.name.toUpperCase().replace(/\s+/g, '')
      const sizeName = selectedSize.name.toUpperCase().replace(/\s+/g, '')
      
      const sku = `${category.toUpperCase()}-DUDE-FZT-${sizeName}-${colorName}`
      setFormData(prev => ({ ...prev, sku }))
    }
  }

  // Update SKU when options change
  const handleOptionChange = (type: 'color' | 'size', value: string) => {
    setFormData(prev => ({
      ...prev,
      [`${type}_option_id`]: value
    }))
    
    // Auto-generate name
    const selectedColor = type === 'color' ? 
      colorOptions.find((opt: any) => opt.id === value) : 
      colorOptions.find((opt: any) => opt.id === formData.color_option_id)
    const selectedSize = type === 'size' ? 
      sizeOptions.find((opt: any) => opt.id === value) : 
      sizeOptions.find((opt: any) => opt.id === formData.size_option_id)
    
    if (selectedColor && selectedSize) {
      const name = `${selectedSize.name} / ${selectedColor.name}`
      setFormData(prev => ({ ...prev, name }))
    }
    
    // Auto-generate SKU after a short delay
    setTimeout(generateSKU, 100)
  }

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

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`)
        continue
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`)
        continue
      }

      const url = URL.createObjectURL(file)
      setVariantImages(prev => [...prev, { url, file }])
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Handle image delete
  const handleDeleteImage = (index: number) => {
    setVariantImages(prev => {
      const newImages = [...prev]
      URL.revokeObjectURL(newImages[index].url)
      newImages.splice(index, 1)
      return newImages
    })
  }

  // Handle save
  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error('Variant name is required')
      return
    }
    if (!formData.sku.trim()) {
      toast.error('SKU is required')
      return
    }
    if (formData.price <= 0) {
      toast.error('Price must be greater than 0')
      return
    }

    startTransition(async () => {
      try {
        const supabase = createClient()

        // Check if SKU already exists
        const { data: existingVariant } = await supabase
          .from('product_variants')
          .select('id')
          .eq('sku', formData.sku)
          .single()

        if (existingVariant) {
          toast.error('SKU already exists')
          return
        }

        // Create variant
        const { data: variant, error: variantError } = await supabase
          .from('product_variants')
          .insert({
            product_id: product.id,
            name: formData.name,
            sku: formData.sku,
            price: formData.price,
            compare_price: formData.compare_price || null,
            stock: formData.stock,
            active: formData.active,
            track_quantity: formData.manage_inventory,
            allow_backorders: formData.allow_backorders,
          })
          .select()
          .single()

        if (variantError) throw variantError

        // Create variant option values
        const optionValues = []
        if (formData.color_option_id) {
          optionValues.push({
            variant_id: variant.id,
            option_value_id: formData.color_option_id
          })
        }
        if (formData.size_option_id) {
          optionValues.push({
            variant_id: variant.id,
            option_value_id: formData.size_option_id
          })
        }

        if (optionValues.length > 0) {
          const { error: optionError } = await supabase
            .from('variant_option_values')
            .insert(optionValues)

          if (optionError) throw optionError
        }

        // Upload images if any
        if (variantImages.length > 0) {
          setIsUploading(true)
          
          for (let i = 0; i < variantImages.length; i++) {
            const { file } = variantImages[i]
            const fileExt = file.name.split('.').pop()
            const fileName = `variant-${variant.id}-${Date.now()}-${i}.${fileExt}`
            const filePath = `variant-images/${fileName}`

            const { error: uploadError } = await supabase.storage
              .from('product-images')
              .upload(filePath, file)

            if (uploadError) {
              console.error('Upload error:', uploadError)
              continue
            }

            const { data: { publicUrl } } = supabase.storage
              .from('product-images')
              .getPublicUrl(filePath)

            await (supabase as any)
              .from('variant_images')
              .insert({
                variant_id: variant.id,
                image_url: publicUrl,
                alt_text: file.name,
                position: i
              })
          }
        }

        toast.success('Variant created successfully')
        router.push(`/admin/products/${product.id}/variants/${variant.id}`)
      } catch (error) {
        console.error('Error creating variant:', error)
        toast.error('Failed to create variant')
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
          <h1 className="text-2xl font-bold text-gray-900">Create New Variant</h1>
          <p className="text-gray-500">Add a new variant to {product.title}</p>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="outline" className="bg-white border-gray-200 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200" asChild>
            <Link href={`/admin/products/${product.id}/variants`}>
              ← Back to Variants
            </Link>
          </Button>

          <Button onClick={handleSave} disabled={isPending || isUploading} className="bg-red-600 hover:bg-red-700 text-white">
            <Save className="w-4 h-4 mr-2" />
            {isPending ? 'Creating...' : 'Create Variant'}
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
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                placeholder="e.g., SHIRTS-DUDE-FZT-M-BLACK"
                className="font-mono"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Variant Options */}
      {(colorOptions.length > 0 || sizeOptions.length > 0) && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Tag className="w-5 h-5 mr-2 text-red-600" />
              Variant Options
            </CardTitle>
            <CardDescription>
              Select the specific options for this variant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sizeOptions.length > 0 && (
                <div className="space-y-2">
                  <Label>Size</Label>
                  <Select value={formData.size_option_id} onValueChange={(value) => handleOptionChange('size', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {sizeOptions.map((option: any) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {colorOptions.length > 0 && (
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Select value={formData.color_option_id} onValueChange={(value) => handleOptionChange('color', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((option: any) => (
                        <SelectItem key={option.id} value={option.id}>
                          <div className="flex items-center space-x-2">
                            {option.hex_color && (
                              <div
                                className="w-4 h-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: option.hex_color }}
                              />
                            )}
                            <span>{option.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
            Upload images specific to this variant (optional)
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

          {variantImages.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {variantImages.map((image, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group border-2 border-transparent hover:border-red-200 transition-colors"
                  >
                    <img
                      src={image.url}
                      alt={`Variant image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteImage(index)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    {index === 0 && (
                      <Badge className="absolute top-2 left-2 bg-white text-gray-700 text-xs">Primary</Badge>
                    )}
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
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-red-300 cursor-pointer transition-colors"
            >
              {isUploading ? (
                <Loader2 className="w-10 h-10 mx-auto text-red-600 animate-spin" />
              ) : (
                <>
                  <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600 font-medium">Upload variant images</p>
                  <p className="text-sm text-gray-400 mt-1">Click or drag images here (optional)</p>
                </>
              )}
            </div>
          )}
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
                {formData.active ? 'Variant will be available in store' : 'Variant will be hidden from store'}
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