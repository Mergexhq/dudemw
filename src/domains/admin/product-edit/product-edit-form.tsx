"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Package, DollarSign, Settings } from 'lucide-react'
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

  const handleSave = async () => {
    setIsLoading(true)
    try {
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
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/products/${product.id}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Product
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Edit Product
            </h1>
            <p className="text-gray-500">{product.title}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/products/${product.id}`}>
              Cancel
            </Link>
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Product'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="Enter product subtitle (optional)"
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
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
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
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input
                  id="meta_title"
                  value={formData.meta_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                  placeholder="SEO title for search engines"
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
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Product Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['draft', 'active', 'archived'].map((status) => (
                  <label key={status} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value={status}
                      checked={formData.status === status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="text-blue-600"
                    />
                    <span className="capitalize">{status}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Current Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {product.product_categories?.length > 0 ? (
                  product.product_categories.map((pc: any) => (
                    <Badge key={pc.categories.id} variant="outline">
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
          <Card>
            <CardHeader>
              <CardTitle>Collections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {product.product_collections?.length > 0 ? (
                  product.product_collections.map((pc: any) => (
                    <Badge key={pc.collections.id} variant="outline">
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
          <Card>
            <CardHeader>
              <CardTitle>Variants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total Variants:</span>
                  <span className="font-medium">{product.product_variants?.length || 0}</span>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/admin/products/${product.id}/variants`}>
                    Manage Variants
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}