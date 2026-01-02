"use client"

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Edit,
  ExternalLink,
  Package,
  DollarSign,
  Warehouse,
  Image as ImageIcon,
  List,
  MoreHorizontal,
  Archive,
  Trash2,
  X,
  Plus,
  AlertCircle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ProductDetailViewProps {
  product: any // Type from domain
}

export function GeneralTab({ formData, onFormDataChange }: GeneralTabProps) {
  const [errors, setErrors] = useState<{
    name?: string
    description?: string
  }>({})

  const validateName = (value: string) => {
    if (!value.trim()) {
      return "Product name is required"
    }
    if (value.trim().length < 3) {
      return "Product name must be at least 3 characters"
    }
    if (value.trim().length > 100) {
      return "Product name must not exceed 100 characters"
    }
    return undefined
  }

  const validateDescription = (value: string) => {
    if (!value.trim()) {
      return "Description is required"
    }
    if (value.trim().length < 10) {
      return "Description must be at least 10 characters"
    }
    return undefined
  }

  const handleNameChange = (value: string) => {
    onFormDataChange({ name: value })
    const error = validateName(value)
    setErrors(prev => ({ ...prev, name: error }))
  }

  const handleNameBlur = () => {
    const error = validateName(formData.name)
    setErrors(prev => ({ ...prev, name: error }))
  }

  const handleDescriptionChange = (value: string) => {
    onFormDataChange({ description: value })
    const error = validateDescription(value)
    setErrors(prev => ({ ...prev, description: error }))
  }

  const handleDescriptionBlur = () => {
    const error = validateDescription(formData.description)
    setErrors(prev => ({ ...prev, description: error }))
  }
  const addHighlight = () => {
    onFormDataChange({
      highlights: [...formData.highlights, ""]
    })
  }

  const updateHighlight = (index: number, value: string) => {
    const newHighlights = [...formData.highlights]
    newHighlights[index] = value
    onFormDataChange({ highlights: newHighlights })
  }

  const removeHighlight = (index: number) => {
    onFormDataChange({
      highlights: formData.highlights.filter((_, i) => i !== index)
    })
  }

  return (
    <div className="space-y-6">
      {/* Product Identity */}
      <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">Product Identity</CardTitle>
          <CardDescription className="text-gray-600">
            Define what the product is and how it's described
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Oversized Cotton Hoodie"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={handleNameBlur}
              className={`w-full ${errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            />
            {errors.name && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.name}</span>
              </div>
            )}
            <p className="text-xs text-gray-500">
              Used everywhere - keep it clear and descriptive
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Product Subtitle</Label>
            <Input
              id="subtitle"
              placeholder="e.g., Winter essential, relaxed fit"
              value={formData.subtitle}
              onChange={(e) => onFormDataChange({ subtitle: e.target.value })}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Short tagline used in cards and banners
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe your product - fit, fabric, wash care, return notes..."
              value={formData.description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              onBlur={handleDescriptionBlur}
              rows={6}
              className={`w-full ${errors.description ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            />
            {errors.description && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.description}</span>
              </div>
            )}
            <p className="text-xs text-gray-500">
              Rich text editor will be added here for bold, lists, paragraphs
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Product Highlights */}
      <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">Product Highlights</CardTitle>
          <CardDescription className="text-gray-600">
            Key features for PDP highlights, SEO snippets, and mobile UX
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {formData.highlights.map((highlight, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  placeholder="e.g., 100% Cotton, Pre-shrunk, Made in India"
                  value={highlight}
                  onChange={(e) => updateHighlight(index, e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeHighlight(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addHighlight}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Highlight
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Product Status */}
      <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">Product Status</CardTitle>
          <CardDescription className="text-gray-600">
            Control product visibility and availability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => onFormDataChange({ status: value as "draft" | "active" | "archived" })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Default is Draft - publish when ready
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface ProductFormData {
  name: string
  subtitle: string
  description: string
  highlights: string[]
  status: "draft" | "active" | "archived"
}

interface GeneralTabProps {
  formData: ProductFormData
  onFormDataChange: (updates: Partial<ProductFormData>) => void
}

export function ProductDetailView({ product }: ProductDetailViewProps) {
  // FRONTEND RESPONSIBILITY: Display state, navigation, read-only calculations

  // Calculate display values (read-only, no business logic)
  const primaryImage = product.product_images?.find((img: any) => img.is_primary) || product.product_images?.[0]
  const totalStock = product.product_variants?.reduce((sum: number, variant: any) => sum + (variant.stock || 0), 0) || 0
  const variantCount = product.product_variants?.length || 0
  const categoryName = product.product_categories?.[0]?.categories?.name || 'Uncategorized'
  const collectionNames = product.product_collections?.map((pc: any) => pc.collections?.title).filter(Boolean) || []

  // Price range calculation (display only)
  const prices = product.product_variants?.map((v: any) => v.price) || [product.price]
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)

  // Stock status (display only)
  const getStockStatus = () => {
    if (totalStock === 0) return { label: 'Out of Stock', color: 'destructive' as const }
    if (totalStock < 10) return { label: 'Low Stock', color: 'secondary' as const }
    return { label: 'In Stock', color: 'default' as const }
  }

  const stockStatus = getStockStatus()

  return (
    <div className="space-y-6">
      {/* Header - FRONTEND: Navigation and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
            {primaryImage ? (
              <Image
                src={primaryImage.image_url}
                alt={primaryImage.alt_text || product.title}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.title}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge
                variant={product.status === 'active' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {product.status || 'draft'}
              </Badge>
              <span className="text-sm text-gray-500">#{product.id.slice(-8)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/products/${product.slug}`}>
              <ExternalLink className="w-4 h-4 mr-2" />
              View Storefront
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/admin/products/${product.id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Product
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>
                <Archive className="w-4 h-4 mr-2" />
                Archive Product
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Product
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Summary - FRONTEND: Read-only display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Product Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-gray-900">{product.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Handle</label>
                  <p className="text-gray-900">{product.slug}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="text-gray-900">{categoryName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <Badge variant={product.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                    {product.status || 'draft'}
                  </Badge>
                </div>
              </div>

              {product.subtitle && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Subtitle</label>
                  <p className="text-gray-900">{product.subtitle}</p>
                </div>
              )}

              {collectionNames.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Collections</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {collectionNames.map((name: string, index: number) => (
                      <Badge key={index} variant="outline">{name}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Created:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(product.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Updated:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(product.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Summary - FRONTEND: Display calculated values */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Pricing Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {variantCount > 1 ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Price Range</span>
                    <span className="font-semibold">
                      ₹{minPrice.toLocaleString('en-IN')} - ₹{maxPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Variants</span>
                    <span className="font-semibold">{variantCount} variants</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Price</span>
                    <span className="font-semibold">₹{product.price.toLocaleString('en-IN')}</span>
                  </div>
                  {product.compare_price && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Compare Price</span>
                      <span className="text-gray-500 line-through">
                        ₹{product.compare_price.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Variant Overview - FRONTEND: Navigation to variants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <List className="w-5 h-5 mr-2" />
                  Variant Overview
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/products/${product.id}/variants`}>
                    View All Variants
                  </Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {variantCount > 0 ? (
                <div className="space-y-3">
                  {product.product_variants?.slice(0, 3).map((variant: any) => (
                    <Link
                      key={variant.id}
                      href={`/admin/products/${product.id}/variants/${variant.id}`}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <p className="font-medium hover:text-blue-600">{variant.name || 'Default Variant'}</p>
                        <p className="text-sm text-gray-500">{variant.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{variant.price.toLocaleString('en-IN')}</p>
                        <p className="text-sm text-gray-500">{variant.stock} in stock</p>
                      </div>
                    </Link>
                  ))}
                  {variantCount > 3 && (
                    <p className="text-sm text-gray-500 text-center">
                      +{variantCount - 3} more variants
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No variants created</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Inventory Summary - FRONTEND: Display aggregated values */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Warehouse className="w-5 h-5 mr-2" />
                Inventory Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Total Stock</span>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">{totalStock}</span>
                  <Badge variant={stockStatus.color}>{stockStatus.label}</Badge>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Track Inventory</span>
                <Badge variant={product.track_inventory ? 'default' : 'secondary'}>
                  {product.track_inventory ? 'ON' : 'OFF'}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Backorders</span>
                <Badge variant={product.allow_backorders ? 'default' : 'secondary'}>
                  {product.allow_backorders ? 'Allowed' : 'Not Allowed'}
                </Badge>
              </div>

              <Separator />

              <div className="space-y-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/admin/inventory">
                    <Warehouse className="w-4 h-4 mr-2" />
                    Manage Inventory
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/admin/products/${product.id}/variants`}>
                    <List className="w-4 h-4 mr-2" />
                    View Variants
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Media Preview - FRONTEND: Display images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ImageIcon className="w-5 h-5 mr-2" />
                Media Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {product.product_images?.length > 0 ? (
                <div className="space-y-3">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={primaryImage.image_url}
                      alt={primaryImage.alt_text || product.title}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex space-x-2">
                    {product.product_images.slice(1, 4).map((image: any, index: number) => (
                      <div key={index} className="w-16 h-16 bg-gray-100 rounded overflow-hidden">
                        <Image
                          src={image.image_url}
                          alt={image.alt_text || ''}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {product.product_images.length > 4 && (
                      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-500">+{product.product_images.length - 4}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description Preview - FRONTEND: Display content */}
          {product.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 line-clamp-4">
                    {product.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}