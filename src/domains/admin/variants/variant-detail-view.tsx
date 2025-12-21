"use client"

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Save,
  Package,
  IndianRupee,
  Warehouse,
  Image as ImageIcon,
  AlertTriangle,
  Trash2,
  Copy,
  Check,
  Upload,
  X,
  Loader2,
  Tag,
  ShoppingBag,
  Clock,
  Link as LinkIcon,
  AlertCircle,
  BarChart3,
  Edit,
  ArrowLeft,
  List,
  Layers
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface VariantDetailViewProps {
  product: any
  variant: any
}

export function VariantDetailView({ product, variant }: VariantDetailViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [skuCopied, setSkuCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [formData, setFormData] = useState({
    sku: variant.sku,
    price: variant.price,
    compare_price: variant.compare_price || '',
    stock: variant.stock,
    active: variant.active ?? true,
    manage_inventory: variant.track_quantity ?? true,
    allow_backorders: variant.allow_backorders ?? false,
    discountable: variant.discountable ?? true,
    taxable: variant.taxable ?? true,
  })

  // Variant images state
  const [variantImages, setVariantImages] = useState<Array<{ id: string; url: string; alt: string }>>(
    variant.variant_images || []
  )

  // Check if variant has orders (would need to be passed from backend)
  const hasOrders = variant.order_count > 0 || false
  const totalSold = variant.total_sold || 0
  const lastOrderDate = variant.last_order_date

  // Stock status
  const getStockStatus = () => {
    if (!formData.manage_inventory) return { label: 'Unlimited', color: 'bg-blue-100 text-blue-700 border-blue-200' }
    if (formData.allow_backorders && formData.stock <= 0) return { label: 'Backorder', color: 'bg-orange-100 text-orange-700 border-orange-200' }
    if (formData.stock <= 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700 border-red-200' }
    if (formData.stock < 10) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
    return { label: 'In Stock', color: 'bg-green-100 text-green-700 border-green-200' }
  }

  const stockStatus = getStockStatus()

  // Get variant attributes
  const getAttributes = () => {
    return variant.variant_option_values?.map((vov: any) => ({
      name: vov.product_option_values?.product_options?.name,
      value: vov.product_option_values?.name,
      hexColor: vov.product_option_values?.hex_color,
    })) || []
  }

  const attributes = getAttributes()

  // Copy SKU to clipboard
  const handleCopySku = () => {
    navigator.clipboard.writeText(formData.sku)
    setSkuCopied(true)
    toast.success('SKU copied to clipboard')
    setTimeout(() => setSkuCopied(false), 2000)
  }

  // Calculate final price
  const finalPrice = formData.price
  const hasDiscount = formData.compare_price && parseFloat(formData.compare_price.toString()) > formData.price
  const discountPercent = hasDiscount
    ? Math.round(((parseFloat(formData.compare_price.toString()) - formData.price) / parseFloat(formData.compare_price.toString())) * 100)
    : 0

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)

    // Create authenticated Supabase client with current user session
    const supabase = createClient()

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image`)
          continue
        }

        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 5MB)`)
          continue
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `variant-${variant.id}-${Date.now()}.${fileExt}`
        const filePath = `variant-images/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          toast.error(`Failed to upload ${file.name}: ${uploadError.message}`)
          continue
        }

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath)

        // Note: variant_images table may not be in generated Supabase types
        const { data: imageData, error: dbError } = await (supabase as any)
          .from('variant_images')
          .insert({
            variant_id: variant.id,
            image_url: publicUrl,
            alt_text: file.name,
            position: variantImages.length
          })
          .select()
          .single()

        if (!dbError && imageData) {
          setVariantImages(prev => [...prev, {
            id: imageData.id,
            url: publicUrl,
            alt: file.name
          }])
          toast.success(`${file.name} uploaded`)
        }
      }
    } catch (error) {
      console.error('Error in image upload:', error)
      toast.error('Failed to upload images')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Handle image delete
  const handleDeleteImage = async (imageId: string, imageUrl: string) => {
    try {
      // Create authenticated Supabase client
      const supabase = createClient()

      const urlParts = imageUrl.split('/')
      const filePath = `variant-images/${urlParts[urlParts.length - 1]}`

      await supabase.storage.from('product-images').remove([filePath])
      await (supabase as any).from('variant_images').delete().eq('id', imageId)

      setVariantImages(prev => prev.filter(img => img.id !== imageId))
      toast.success('Image deleted')
    } catch (error) {
      console.error('Error deleting image:', error)
      toast.error('Failed to delete image')
    }
  }

  // Handle save
  const handleSave = async () => {
    startTransition(async () => {
      try {
        // Create authenticated Supabase client
        const supabase = createClient()

        const { error } = await supabase
          .from('product_variants')
          .update({
            sku: formData.sku,
            price: formData.price,
            compare_price: formData.compare_price || null,
            stock: formData.stock,
            active: formData.active,
            track_quantity: formData.manage_inventory,
            allow_backorders: formData.allow_backorders,
          })
          .eq('id', variant.id)

        if (error) throw error

        toast.success('Variant saved successfully')
        setIsEditing(false)
        router.refresh()
      } catch (error) {
        console.error('Error saving variant:', error)
        toast.error('Failed to save variant')
      }
    })
  }

  // Handle cancel edit
  const handleCancelEdit = () => {
    // Reset form to original values
    setFormData({
      sku: variant.sku,
      price: variant.price,
      compare_price: variant.compare_price || '',
      stock: variant.stock,
      active: variant.active ?? true,
      manage_inventory: variant.track_quantity ?? true,
      allow_backorders: variant.allow_backorders ?? false,
      discountable: variant.discountable ?? true,
      taxable: variant.taxable ?? true,
    })
    setIsEditing(false)
  }

  // Get collections and categories from product
  const collections = product.product_collections?.map((pc: any) => pc.collections?.title).filter(Boolean) || []
  const categories = product.product_categories?.map((pc: any) => pc.categories?.name).filter(Boolean) || []
  const tags = product.highlights || [] // Assuming highlights is a string array on product
  const productTags = product.tags || [] // Assuming tags is available

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════════════════
          1️⃣ PAGE HEADER (TOP STRIP)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-start justify-between py-4">
        <div className="space-y-1">
          {/* Variant Title */}
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {variant.name || attributes.map((a: any) => a.value).join(' / ') || 'Default Variant'}
            </h1>
            <Badge variant="outline" className="border-gray-300 text-gray-500">
              {product.title}
            </Badge>
          </div>

          {/* SKU with copy button */}
          <div className="flex items-center space-x-2">
            <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono text-gray-600">
              {formData.sku}
            </code>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-gray-100"
              onClick={handleCopySku}
            >
              {skuCopied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </Button>
          </div>
        </div>

        {/* Right side: Back Button + Status + Actions */}
        <div className="flex items-center space-x-4">
          <Link href={`/admin/products/${product.id}`}>
            <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-red-50 hover:text-red-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Product
            </Button>
          </Link>

          {/* Status Badge */}
          <Badge className={`${stockStatus.color} text-sm px-3 py-1`}>
            {stockStatus.label}
          </Badge>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancelEdit} disabled={isPending} className="border-gray-200">
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isPending} className="bg-red-600 hover:bg-red-700 text-white">
                  <Save className="w-4 h-4 mr-2" />
                  {isPending ? 'Saving...' : 'Save'}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} className="bg-red-600 hover:bg-red-700 text-white">
                <Edit className="w-4 h-4 mr-2" />
                Edit Variant
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* ═══════════════════════════════════════════════════════════════════
              BASIC VARIANT INFO
          ═══════════════════════════════════════════════════════════════════ */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg text-gray-900 dark:text-white">
                <Package className="w-5 h-5 mr-2 text-red-600" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-gray-600">Variant Title</Label>
                  <p className="font-medium text-gray-900">
                    {variant.name || attributes.map((a: any) => a.value).join(' / ') || 'Default'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-600">SKU</Label>
                  <Input
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    disabled={!isEditing || hasOrders}
                    className={`font-mono ${!isEditing || hasOrders ? 'bg-gray-50 cursor-not-allowed' : 'bg-white/60'}`}
                  />
                  {hasOrders && (
                    <p className="text-xs text-amber-600">Cannot edit after orders placed</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-600">Status</Label>
                  <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-gray-100">
                    <span className="text-sm font-medium">{formData.active ? 'Active' : 'Inactive'}</span>
                    <Switch
                      checked={formData.active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ═══════════════════════════════════════════════════════════════════
              PRICING SECTION
          ═══════════════════════════════════════════════════════════════════ */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg text-gray-900 dark:text-white">
                <IndianRupee className="w-5 h-5 mr-2 text-red-600" />
                Pricing
              </CardTitle>
              <CardDescription>
                What customer pays for this variant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    disabled={!isEditing}
                    className={`text-lg font-semibold ${!isEditing ? 'bg-gray-50' : 'bg-white/60'}`}
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
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : 'bg-white/60'}
                  />
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

          {/* ═══════════════════════════════════════════════════════════════════
              INVENTORY & FULFILLMENT
          ═══════════════════════════════════════════════════════════════════ */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg text-gray-900 dark:text-white">
                <Warehouse className="w-5 h-5 mr-2 text-red-600" />
                Inventory & Fulfillment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Manage Inventory</Label>
                  <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-gray-200">
                    <div>
                      <p className="text-sm font-medium">{formData.manage_inventory ? 'Tracked' : 'Unlimited'}</p>
                      <p className="text-xs text-gray-500">
                        {formData.manage_inventory ? 'Stock is monitored' : 'No quantity limits'}
                      </p>
                    </div>
                    <Switch
                      checked={formData.manage_inventory}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, manage_inventory: checked }))}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                {formData.manage_inventory && (
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Quantity</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="stock"
                        type="number"
                        min="0"
                        value={formData.stock}
                        onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                        disabled={!isEditing}
                        className={`text-lg font-semibold ${!isEditing ? 'bg-gray-50' : 'bg-white/60'}`}
                      />
                      <Badge className={stockStatus.color}>{stockStatus.label}</Badge>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ═══════════════════════════════════════════════════════════════════
              VARIANT IMAGES
          ═══════════════════════════════════════════════════════════════════ */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg text-gray-900 dark:text-white">
                <ImageIcon className="w-5 h-5 mr-2 text-red-600" />
                Variant Images
              </CardTitle>
              <CardDescription>
                Images specific to this variant • Overrides product images when set
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {variantImages.map((image, index) => (
                    <div
                      key={image.id}
                      className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group border-2 border-transparent hover:border-red-200 transition-colors"
                    >
                      <Image
                        src={image.url}
                        alt={image.alt}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteImage(image.id, image.url)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-red-300 flex flex-col items-center justify-center text-gray-400 hover:text-red-500 transition-colors bg-white/40"
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
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-red-300 cursor-pointer transition-colors bg-white/40"
                >
                  {isUploading ? (
                    <Loader2 className="w-10 h-10 mx-auto text-red-600 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-600 font-medium">Upload variant images</p>
                      <p className="text-sm text-gray-400 mt-1">Click or drag images here</p>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* ═══════════════════════════════════════════════════════════════════
              PARENT PRODUCT CONTEXT
          ═══════════════════════════════════════════════════════════════════ */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-gray-900 dark:text-white flex items-center">
                <LinkIcon className="w-4 h-4 mr-2 text-red-600" />
                Product Context
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Linked Product */}
              <div>
                <Label className="text-gray-500 text-xs uppercase tracking-wide">Parent Product</Label>
                <Link href={`/admin/products/${product.id}`} className="block mt-1 font-medium text-red-600 hover:underline">
                  {product.title}
                </Link>
              </div>

              {/* Categories */}
              <div>
                <Label className="text-gray-500 text-xs uppercase tracking-wide flex items-center">
                  <List className="w-3 h-3 mr-1" /> Categories
                </Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {categories.length > 0 ? categories.map((name: string, index: number) => (
                    <Badge key={index} variant="secondary" className="bg-white/80">{name}</Badge>
                  )) : (
                    <span className="text-sm text-gray-400">No categories</span>
                  )}
                </div>
              </div>

              {/* Collections */}
              <div>
                <Label className="text-gray-500 text-xs uppercase tracking-wide flex items-center">
                  <Layers className="w-3 h-3 mr-1" /> Collections
                </Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {collections.length > 0 ? collections.map((name: string, index: number) => (
                    <Badge key={index} variant="secondary" className="bg-white/80">{name}</Badge>
                  )) : (
                    <span className="text-sm text-gray-400">No collections</span>
                  )}
                </div>
              </div>

              {/* Tags (if available) */}
              {productTags && (
                <div>
                  <Label className="text-gray-500 text-xs uppercase tracking-wide flex items-center">
                    <Tag className="w-3 h-3 mr-1" /> Tags
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {productTags.length > 0 ? productTags.map((tag: any, index: number) => (
                      <Badge key={index} variant="outline" className="border-gray-300">{tag.name || tag}</Badge>
                    )) : (
                      <span className="text-sm text-gray-400">No tags</span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ═══════════════════════════════════════════════════════════════════
              HIGHLIGHTS
          ═══════════════════════════════════════════════════════════════════ */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-gray-900 dark:text-white flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 text-red-600" />
                Highlights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tags.length > 0 ? (
                <ul className="space-y-2">
                  {tags.map((highlight: string, index: number) => (
                    <li key={index} className="flex items-start text-sm text-gray-700">
                      <span className="mr-2 text-red-500">•</span>
                      {highlight}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 italic">No highlights defined for this product.</p>
              )}
            </CardContent>
          </Card>

          {/* ═══════════════════════════════════════════════════════════════════
              VARIANT ATTRIBUTES
          ═══════════════════════════════════════════════════════════════════ */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-gray-900 dark:text-white">Attributes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {attributes.length > 0 ? attributes.map((attr: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white/60 rounded">
                    <span className="text-sm text-gray-500">{attr.name}</span>
                    <div className="flex items-center space-x-2">
                      {attr.hexColor && (
                        <div
                          className="w-3 h-3 rounded-full border border-gray-300"
                          style={{ backgroundColor: attr.hexColor }}
                        />
                      )}
                      <span className="text-sm font-medium text-gray-900">{attr.value}</span>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-gray-400">No specific attributes</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ═══════════════════════════════════════════════════════════════════
              SALES STATS
          ═══════════════════════════════════════════════════════════════════ */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-gray-900 dark:text-white">Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Sold</span>
                <span className="font-bold text-gray-900">{totalSold}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Last Order</span>
                <span className="text-sm text-gray-900 text-right">
                  {lastOrderDate ? new Date(lastOrderDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* ═══════════════════════════════════════════════════════════════════
              DANGER ZONE
          ═══════════════════════════════════════════════════════════════════ */}
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="p-4">
              <h4 className="font-medium text-red-900 mb-2">Delete Variant</h4>
              <p className="text-xs text-red-700 mb-3">
                Once deleted, this variant cannot be recovered.
              </p>
              <Button variant="destructive" size="sm" className="w-full bg-white text-red-600 border border-red-200 hover:bg-red-100">
                Delete Variant
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}