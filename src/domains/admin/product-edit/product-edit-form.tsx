"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Package, DollarSign, Settings, Image as ImageIcon, Upload } from 'lucide-react'
import { updateProduct } from '@/lib/actions/products'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

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
  })

  const [selectedImage, setSelectedImage] = useState<File | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0])
      toast.info("Image selected. Save to upload.")
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Logic for image upload would go here
      if (selectedImage) {
        // await uploadImage(selectedImage)
        console.log("Uploading image:", selectedImage.name)
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
      })

      if (result.success) {
        toast.success('Product updated successfully')
        router.push(`/admin/products/${product.id}`)
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
          <Link href={`/admin/products/${product.id}`}>
            <Button variant="outline" size="sm" className="border-gray-200 hover:border-red-200 hover:bg-red-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Product
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Edit Product
            </h1>
            <p className="text-gray-500">{product.title}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link href={`/admin/products/${product.id}`}>
            <Button variant="outline" className="border-gray-200 hover:bg-gray-50">
              Cancel
            </Button>
          </Link>
          <Button onClick={handleSave} disabled={isLoading} className="bg-red-600 hover:bg-red-700 text-white">
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Product'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-white">
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
                  className="bg-white/60 dark:bg-gray-800/60"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="Enter product subtitle (optional)"
                  className="bg-white/60 dark:bg-gray-800/60"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter product description"
                  rows={4}
                  className="bg-white/60 dark:bg-gray-800/60"
                />
              </div>
            </CardContent>
          </Card>

          {/* Media */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-white">
                <ImageIcon className="w-5 h-5 mr-2 text-red-600" />
                Media
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-red-400 transition-colors bg-white/40">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <span className="text-red-600 hover:text-red-700 font-medium">
                    Upload New Thumbnail
                  </span>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
                {selectedImage && (
                  <p className="mt-2 text-sm text-green-600 font-medium">Selected: {selectedImage.name}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 10MB</p>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-white">
                <DollarSign className="w-5 h-5 mr-2 text-red-600" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="bg-white/60 dark:bg-gray-800/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compare_price">Compare Price</Label>
                  <Input
                    id="compare_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.compare_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, compare_price: e.target.value }))}
                    placeholder="Optional"
                    className="bg-white/60 dark:bg-gray-800/60"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEO */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-white">
                <Settings className="w-5 h-5 mr-2 text-red-600" />
                SEO & URL
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url_handle">URL Handle</Label>
                <Input
                  id="url_handle"
                  value={formData.url_handle}
                  onChange={(e) => setFormData(prev => ({ ...prev, url_handle: e.target.value }))}
                  placeholder="product-url-handle"
                  className="bg-white/60 dark:bg-gray-800/60"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input
                  id="meta_title"
                  value={formData.meta_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                  placeholder="SEO title for search engines"
                  className="bg-white/60 dark:bg-gray-800/60"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                  placeholder="SEO description for search engines"
                  rows={3}
                  className="bg-white/60 dark:bg-gray-800/60"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Product Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['draft', 'active', 'archived'].map((status) => (
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

          {/* Current Categories */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {product.product_categories?.length > 0 ? (
                  product.product_categories.map((pc: any) => (
                    <Badge key={pc.categories.id} variant="secondary" className="bg-white hover:bg-gray-100">
                      {pc.categories.name}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No categories assigned</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Current Collections */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Collections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {product.product_collections?.length > 0 ? (
                  product.product_collections.map((pc: any) => (
                    <Badge key={pc.collections.id} variant="secondary" className="bg-white hover:bg-gray-100">
                      {pc.collections.title}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No collections assigned</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Variants Info */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Variants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-2 rounded bg-white/60">
                  <span className="text-sm text-gray-500">Total Variants</span>
                  <span className="font-bold text-gray-900">{product.product_variants?.length || 0}</span>
                </div>
                <Link href={`/admin/products/${product.id}/variants`}>
                  <Button variant="outline" className="w-full border-red-200 text-red-700 hover:bg-red-50">
                    Manage Variants
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}