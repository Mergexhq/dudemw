"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Package, DollarSign, Settings, Image as ImageIcon, Upload, IndianRupee, X } from 'lucide-react'
import { updateProduct } from '@/lib/actions/products'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProductPreviewWrapper } from './product-preview-wrapper'
import { MediaTab } from '@/domains/admin/product-creation/media-tab'
import { ProductSiblingLinker, LinkedProduct } from '@/domains/admin/components/ProductSiblingLinker'
import type { ProductSearchResult } from '@/lib/actions/search-products'

interface ProductImage {
  id: string
  url: string
  alt: string
  isPrimary: boolean
  [key: string]: any // Allow other properties for Json compatibility
}

interface ProductEditFormProps {
  product: any
  categories: any[]
  collections: any[]
  tags: any[]
}

export function ProductEditForm({ product, categories, collections, tags }: ProductEditFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: product.title,
    subtitle: product.subtitle || '',
    description: product.description || '',
    status: product.status || 'draft',
    price: product.price,
    compare_price: product.compare_price || '',
    meta_title: product.meta_title || '',
    meta_description: product.meta_description || '',
    url_handle: product.url_handle || '',
    free_shipping: product.free_shipping ?? false,
  })

  // Organization State
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])
  const [highlights, setHighlights] = useState<string[]>([''])
  const [defaultVariantId, setDefaultVariantId] = useState<string | null>(product.default_variant_id || null)

  // Sibling product state (multi linked products)
  const [linkedSiblingProducts, setLinkedSiblingProducts] = useState<LinkedProduct[]>([])

  // Images state
  const [images, setImages] = useState<ProductImage[]>([])

  // Initialize separate states
  useEffect(() => {
    if (product.product_categories) {
      setSelectedCategories(product.product_categories.map((pc: any) => pc.categories.id))
    }
    if (product.product_collections) {
      setSelectedCollections(product.product_collections.map((pc: any) => pc.collections.id))
    }
    if (product.highlights && Array.isArray(product.highlights)) {
      setHighlights(product.highlights.length > 0 ? product.highlights : [''])
    } else if (typeof product.highlights === 'string') {
      // Handle case where it might be a JSON string
      try {
        const parsed = JSON.parse(product.highlights)
        if (Array.isArray(parsed)) setHighlights(parsed)
      } catch (e) {
        setHighlights([''])
      }
    }

    // Initialize images from product data
    if (product.product_images && product.product_images.length > 0) {
      setImages(product.product_images.map((img: any) => ({
        id: img.id,
        url: img.image_url,
        alt: img.alt_text || '',
        isPrimary: img.is_primary
      })).sort((a: any, b: any) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0)))
    }

    // Initialize linked siblings if product already has a family
    // Find all products in the same family (excluding current product)
    async function initializeLinkedSiblings() {
      if (product.product_family_id) {
        const supabase = createClient()
        const { data } = await supabase
          .from('products')
          .select('id, title, slug, product_family_id')
          .eq('product_family_id', product.product_family_id)
          .neq('id', product.id)

        if (data && data.length > 0) {
          setLinkedSiblingProducts(data.map(item => {
            // Auto-derive the sibling label from the title: extract text after "–" (em dash)
            const dashIdx = item.title.lastIndexOf('–')
            const autoName = dashIdx !== -1 ? item.title.slice(dashIdx + 1).trim() : item.title
            return {
              id: item.id,
              title: item.title,
              slug: item.slug ?? null,
              product_family_id: item.product_family_id ?? null,
              siblingName: autoName,
            }
          }))
        }
      }
    }

    initializeLinkedSiblings()
  }, [product])

  // Computed preview image for sidebar
  const previewImage = images.find(img => img.isPrimary)?.url || images[0]?.url || null



  const handleAutoGenerateSEO = () => {
    const slug = formData.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    setFormData(prev => ({
      ...prev,
      meta_title: formData.title,
      meta_description: formData.description?.slice(0, 160) || '',
      url_handle: slug
    }))
    toast.success("SEO fields auto-generated")
  }

  const toggleCategory = (extractId: string) => {
    setSelectedCategories(prev =>
      prev.includes(extractId)
        ? prev.filter(id => id !== extractId)
        : [...prev, extractId]
    )
  }

  const toggleCollection = (extractId: string) => {
    setSelectedCollections(prev =>
      prev.includes(extractId)
        ? prev.filter(id => id !== extractId)
        : [...prev, extractId]
    )
  }

  // Removed toggleRelatedProduct - no longer needed with single sibling linker

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Determine product_family_id based on sibling linking
      let familyId: string | null

      if (linkedSiblingProducts.length > 0) {
        // Multi-product logic
        // 1. Check if any selected sibling has a family ID (prioritize existing families)
        // 2. If multiple families involved, we might need to merge them, but for now let's pick the first one
        // 3. Or if none have one, generate a new one based on the first sibling

        const siblingWithFamily = linkedSiblingProducts.find(s => s.product_family_id)

        if (siblingWithFamily && siblingWithFamily.product_family_id) {
          familyId = siblingWithFamily.product_family_id
        } else {
          // No linked sibling has a family ID, generate one
          familyId = `${linkedSiblingProducts[0].slug}-family`
        }

        // Apply this familyId to all linked siblings that don't have it
        const siblingsToUpdate = linkedSiblingProducts.filter(s => s.product_family_id !== familyId)

        if (siblingsToUpdate.length > 0) {
          const supabase = createClient()
          await Promise.all(siblingsToUpdate.map(sibling =>
            supabase.from('products').update({ product_family_id: familyId }).eq('id', sibling.id)
          ))
        }

        // Update sibling names (Color Option) if provided
        const siblingsWithName = linkedSiblingProducts.filter(s => s.siblingName && s.siblingName.trim() !== '')
        if (siblingsWithName.length > 0) {
          const { updateProductColorOption } = await import('@/lib/actions/update-product-color')
          await Promise.all(siblingsWithName.map(sibling =>
            updateProductColorOption(sibling.id, sibling.siblingName!)
          ))
        }

      } else if (product.product_family_id) {
        // If no sibling linked anymore (list cleared), but product had one...
        // Strictly speaking, if the user cleared the list, they might intend to unlink.
        // However, per current requirements, we won't forcibly unlink unless explicitly requested or implemented.
        // But if the user CLEARED the list, `linkedSiblingProducts` is empty. 
        // If we keep `familyId = product.product_family_id`, it remains in the family.
        // Let's keep existing behavior: preserve ID if no explicit change provided.
        // Actually, let's keep it simple: if list is empty, we don't change anything about family ID 
        // UNLESS we want to support unlinking. 
        // The previous logic was: if no new link, keep existing.
        familyId = product.product_family_id
      } else {
        // No sibling linked and no existing family - generate new family ID if needed?
        // Actually if it's a standalone product, it can have its own family ID (self-family).
        familyId = `${formData.url_handle || product.slug}-family`
      }

      const result = await updateProduct(product.id, {
        title: formData.title,
        subtitle: formData.subtitle || null,
        description: formData.description || null,
        status: formData.status,
        price: formData.price,
        compare_price: formData.compare_price ? parseFloat(formData.compare_price.toString()) : null,
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
        url_handle: formData.url_handle || null,
        categoryIds: selectedCategories,
        collectionIds: selectedCollections,
        images: images,
        highlights: highlights.filter(h => h.trim() !== ''),
        default_variant_id: defaultVariantId,
        product_family_id: familyId,
        free_shipping: formData.free_shipping,
      })

      if (result.success) {
        toast.success('Product updated successfully')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to update product')
      }
    } catch (error) {
      toast.error('Failed to update product')
      console.error('Error updating product:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Edit Product
            </h1>
            <p className="text-gray-500">{product.title}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Back button moved to right side group */}
          <Link href={`/admin/products/${product.id}`}>
            <Button variant="outline" className="border-gray-200 hover:border-red-200 hover:bg-red-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <Button onClick={handleSave} disabled={isLoading} className="bg-red-600 hover:bg-red-700 text-white">
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900">
                <Package className="w-5 h-5 mr-2 text-red-600" />
                General Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Product Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter product title"
                  className="bg-white/60"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="Enter product subtitle (optional)"
                  className="bg-white/60"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <div className="prose-editor">
                  <RichTextEditor
                    value={formData.description}
                    onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                    placeholder="Describe your product - fit, fabric, wash care, return notes..."
                    className="min-h-[200px]"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <strong className="text-blue-900">💡 Formatting Tips for Better UX:</strong>
                  <br />• Use <strong>Headers (H2/H3)</strong> to organize sections like "Key Features", "Materials", "Care Instructions"
                  <br />• Use <strong>Bullet Points</strong> for features, specifications, or care steps
                  <br />• Use <strong>Bold text</strong> to highlight important details
                  <br />• Keep paragraphs short (2-3 sentences) for easy scanning
                </p>
              </div>
            </CardContent>
          </Card>



          {/* Highlights */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900">
                <Package className="w-5 h-5 mr-2 text-red-600" />
                Product Highlights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Highlights</Label>
                {highlights.map((highlight, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={highlight}
                      onChange={(e) => {
                        const newHighlights = [...highlights]
                        newHighlights[index] = e.target.value
                        setHighlights(newHighlights)
                      }}
                      placeholder="e.g. 100% Cotton, Machine Washable"
                      className="bg-white/60"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const newHighlights = highlights.filter((_, i) => i !== index)
                        setHighlights(newHighlights.length ? newHighlights : [''])
                      }}
                      className="shrink-0 text-red-600 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setHighlights([...highlights, ''])}
                  className="w-full mt-2 border-dashed text-gray-600"
                >
                  + Add Highlight
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Variants Summary */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900">
                <Settings className="w-5 h-5 mr-2 text-red-600" />
                Variants & Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Default Variant Selector */}
              {product.product_variants && product.product_variants.length > 0 && (
                <div className="space-y-2 pb-4 border-b border-gray-200">
                  <Label htmlFor="default-variant" className="text-sm font-medium">
                    Display Variant (for Product Cards)
                  </Label>
                  <select
                    id="default-variant"
                    value={defaultVariantId || ''}
                    onChange={(e) => setDefaultVariantId(e.target.value || null)}
                    className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  >
                    <option value="">Auto (First Variant)</option>
                    {product.product_variants.map((v: any) => (
                      <option key={v.id} value={v.id}>
                        {v.name || 'Untitled'} - ₹{v.price} (SKU: {v.sku})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500">
                    This variant's price and image will show on product cards in the store.
                  </p>
                </div>
              )}

              {product.product_variants && product.product_variants.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    This product has {product.product_variants.length} variants.
                  </p>
                  <div className="bg-white/50 rounded-md p-3 max-h-40 overflow-y-auto">
                    {product.product_variants.map((v: any) => (
                      <div key={v.id} className={`flex justify-between items-center py-2 border-b last:border-0 border-gray-100 ${defaultVariantId === v.id ? 'bg-red-50 -mx-3 px-3 rounded' : ''}`}>
                        <div>
                          <p className="font-medium text-sm">
                            {v.name || 'Untitled'}
                            {defaultVariantId === v.id && (
                              <span className="ml-2 text-[10px] uppercase tracking-wider bg-red-600/90 text-black px-1.5 py-0.5 rounded-sm font-bold">Display</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">SKU: {v.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">₹{v.price}</p>
                          <p className={`text-xs ${v.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {v.stock > 0 ? `${v.stock} in stock` : 'Out of stock'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No variants created for this product.
                </div>
              )}
              {/* Link to extensive variant editing if route exists, or placeholder */}
              <p className="text-xs text-center text-gray-400">
                (Variant editing is currently available via separate module)
              </p>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900">
                <IndianRupee className="w-5 h-5 mr-2 text-red-600" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹)</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className="pl-10 bg-white/60"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compare_price">Compare Price (₹)</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="compare_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.compare_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, compare_price: e.target.value }))}
                      placeholder="Optional"
                      className="pl-10 bg-white/60"
                    />
                  </div>
                </div>
              </div>

              {/* Free Shipping Toggle */}
              <div className="flex items-start gap-3 p-3 rounded-lg border border-dashed border-green-300 bg-green-50/50">
                <input
                  type="checkbox"
                  id="free_shipping"
                  checked={formData.free_shipping}
                  onChange={(e) => setFormData(prev => ({ ...prev, free_shipping: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                />
                <div>
                  <label htmlFor="free_shipping" className="text-sm font-semibold text-green-800 cursor-pointer">
                    🚚 Free Shipping
                  </label>
                  <p className="text-xs text-green-700 mt-0.5">
                    Shipping is waived (₹0) when every item in the cart has free shipping enabled.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Media */}
          <MediaTab
            images={images}
            onImagesChange={setImages}
          />

          {/* SEO */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-0.5">
                <CardTitle className="flex items-center text-gray-900 text-base">
                  <Settings className="w-4 h-4 mr-2 text-red-600" />
                  SEO & URL
                </CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAutoGenerateSEO}
                className="text-xs h-8 border-red-100 text-red-600 hover:bg-red-50"
              >
                Auto Generate
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meta_title">Meta Title</Label>
                  <Input
                    id="meta_title"
                    value={formData.meta_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                    placeholder="SEO title"
                    className="bg-white/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url_handle">URL Handle (Slug)</Label>
                  <Input
                    id="url_handle"
                    value={formData.url_handle}
                    onChange={(e) => setFormData(prev => ({ ...prev, url_handle: e.target.value }))}
                    placeholder="product-url-handle"
                    className="bg-white/60 font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                  placeholder="SEO description"
                  rows={3}
                  className="bg-white/60"
                />
                <p className="text-xs text-gray-500 text-right">
                  {formData.meta_description.length}/160 characters
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:max-h-[calc(100vh-80px)] lg:overflow-y-auto lg:pr-1">
          {/* Status */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
            <CardHeader>
              <CardTitle className="text-gray-900">Product Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['draft', 'published', 'archived'].map((status) => (
                  <label key={status} className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-100 transition-colors">
                    <input
                      type="radio"
                      name="status"
                      value={status}
                      checked={formData.status === status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span className="capitalize text-gray-700">{status}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Categories Election */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
            <CardHeader>
              <CardTitle className="text-gray-900 text-base">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                {categories.length > 0 ? (
                  categories.map((category: any) => (
                    <div key={category.id} className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        id={`cat-${category.id}`}
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => toggleCategory(category.id)}
                        className="mt-1 rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <label htmlFor={`cat-${category.id}`} className="text-sm text-gray-700 cursor-pointer select-none">
                        {category.name}
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No categories available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Collections Selection */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
            <CardHeader>
              <CardTitle className="text-gray-900 text-base">Collections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                {collections.length > 0 ? (
                  collections.map((collection: any) => (
                    <div key={collection.id} className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        id={`col-${collection.id}`}
                        checked={selectedCollections.includes(collection.id)}
                        onChange={() => toggleCollection(collection.id)}
                        className="mt-1 rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <label htmlFor={`col-${collection.id}`} className="text-sm text-gray-700 cursor-pointer select-none">
                        {collection.title}
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No collections available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Product Sibling Linker */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
            <CardHeader>
              <CardTitle className="text-gray-900 text-base">Product Family</CardTitle>
              <CardDescription className="text-xs">
                Link this product to an existing product to create a color variant group
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductSiblingLinker
                currentProductId={product.id}
                linkedSiblings={linkedSiblingProducts}
                onSiblingsChange={setLinkedSiblingProducts}
              />
            </CardContent>
          </Card>

          {/* Product Preview - Sidebar */}
          <ProductPreviewWrapper
            title={formData.title}
            subtitle={formData.subtitle}
            description={formData.description}
            price={formData.price}
            comparePrice={formData.compare_price ? parseFloat(formData.compare_price.toString()) : 0}
            images={previewImage
              ? [{ id: 'preview', image_url: previewImage, alt_text: 'Preview', is_primary: true }, ...product.product_images]
              : product.product_images
            }
            status={formData.status}
            variantCount={product.product_variants?.length || 0}
          />
        </div>
      </div>
    </div >
  )
}