'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CategoryService } from '@/lib/services/categories'
import { getCategoryAction, updateCategoryAction } from '@/lib/actions/categories'
import { BannerService } from '@/lib/services/banners'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ArrowLeft, Upload, Loader2, Save, FolderTree, Settings, Image as ImageIcon, RefreshCw, Package } from 'lucide-react'
import { ProductSelectionStep } from "@/domains/admin/category-creation"
import type { SelectedProduct } from "@/domains/admin/category-creation/types"
import { ProductService } from '@/lib/services/products'

export default function EditCategoryPage() {
  const router = useRouter()
  const params = useParams()
  const categoryId = params.id as string

  const [loading, setLoading] = useState(false)
  const [fetchingCategory, setFetchingCategory] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [availableBanners, setAvailableBanners] = useState<any[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Map<string, SelectedProduct>>(new Map())

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parent_id: '',
    image_url: '',
    icon_url: '',
    homepage_thumbnail_url: '',
    plp_square_thumbnail_url: '',
    meta_title: '',
    meta_description: '',
    status: 'active' as 'active' | 'inactive',
    display_order: 0,
    selected_banner_id: 'none'
  })

  useEffect(() => {
    fetchBanners()
    fetchCategory()
  }, [categoryId])

  const fetchBanners = async () => {
    try {
      const result = await BannerService.getBanners({
        placement: 'category-banner',
        status: 'active'
      })
      if (result.success && result.data) {
        setAvailableBanners(result.data || [])
      }
    } catch (error) {
      console.error('Error loading banners:', error)
    }
  }

  const fetchCategory = async () => {
    try {
      const result = await getCategoryAction(categoryId)
      if (!result.success) {
        toast.error('Category not found')
        router.push('/admin/categories')
        return
      }

      const categoryData = (result as any).data
      if (categoryData) {
        setFormData({
          name: categoryData.name,
          slug: categoryData.slug,
          description: categoryData.description || '',
          parent_id: categoryData.parent_id || '',
          image_url: categoryData.image_url || '',
          icon_url: categoryData.icon_url || '',
          homepage_thumbnail_url: categoryData.homepage_thumbnail_url || '',
          plp_square_thumbnail_url: categoryData.plp_square_thumbnail_url || '',
          meta_title: categoryData.meta_title || '',
          meta_description: categoryData.meta_description || '',
          status: categoryData.status || 'active',
          display_order: categoryData.display_order || 0,
          selected_banner_id: categoryData.selected_banner_id || 'none'
        })

        // Fetch associated products
        try {
          const productsResult = await ProductService.getProducts({
            categoryId: categoryId,
            limit: 1000 // Get all products in category
          })

          if (productsResult.success && productsResult.data) {
            const productMap = new Map<string, SelectedProduct>()
            productsResult.data.forEach(p => {
              productMap.set(p.id, {
                product: {
                  id: p.id,
                  title: p.title,
                  price: p.price,
                  description: p.description,
                  images: p.images,
                  product_images: p.product_images,
                  product_variants: p.product_variants,
                  status: p.status,
                  is_active: p.status === 'active'
                }
              })
            })
            setSelectedProducts(productMap)
          }
        } catch (err) {
          console.error('Error fetching associated products:', err)
        }
      }
    } catch (error) {
      toast.error('Failed to fetch category')
      router.push('/admin/categories')
    } finally {
      setFetchingCategory(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'icon' | 'homepage_thumbnail' | 'plp_square') => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)

    try {
      const result = await CategoryService.uploadImage(file, type)
      if (result.success && result.url) {
        const fieldName = type === 'image' ? 'image_url' :
          type === 'homepage_thumbnail' ? 'homepage_thumbnail_url' :
            type === 'plp_square' ? 'plp_square_thumbnail_url' : 'icon_url'

        setFormData(prev => ({
          ...prev,
          [fieldName]: result.url
        }))
        toast.success('Upload successful')
      } else {
        toast.error(result.error || 'Failed to upload')
      }
    } catch (error) {
      toast.error('Failed to upload file')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await updateCategoryAction(categoryId, {
        ...formData,
        parent_id: (formData.parent_id === 'none' || formData.parent_id === '') ? null : formData.parent_id,
        selected_banner_id: (formData.selected_banner_id === 'none' || formData.selected_banner_id === '') ? null : formData.selected_banner_id,
        product_ids: Array.from(selectedProducts.keys())
      })

      if (result.success) {
        toast.success('Category updated successfully')
        router.push(`/admin/categories/${categoryId}`)
      } else {
        toast.error(result.error || 'Failed to update category')
      }
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error('Failed to update category')
    } finally {
      setLoading(false)
    }
  }


  const generateSEO = () => {
    const title = formData.name || "Category Name"
    const description = formData.description
      ? formData.description.substring(0, 155)
      : "Category description"

    setFormData(prev => ({
      ...prev,
      meta_title: title,
      meta_description: description
    }))
  }

  if (fetchingCategory) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Edit Category
            </h1>
            <p className="text-gray-500">{formData.name}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/categories/${categoryId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Category
            </Link>
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-red-600 hover:bg-red-700">
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Category'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <FolderTree className="w-5 h-5 mr-2 text-red-600" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                  <Label htmlFor="name" className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Category Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., T-Shirts"
                    required
                    className="mt-2 border-0 bg-transparent p-0 text-gray-900 font-medium focus-visible:ring-0"
                  />
                </div>

                <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                  <Label htmlFor="slug" className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    URL Slug *
                  </Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="e.g., t-shirts"
                    required
                    className="mt-2 border-0 bg-transparent p-0 text-gray-900 font-mono text-sm focus-visible:ring-0"
                  />
                </div>

                <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                  <Label htmlFor="description" className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this category..."
                    rows={4}
                    className="mt-2 border-0 bg-transparent p-0 text-gray-900 focus-visible:ring-0 resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* SEO Settings */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <Settings className="w-5 h-5 mr-2 text-red-600" />
                  SEO Settings
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateSEO}
                  disabled={!formData.name}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generate Defaults
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                  <Label htmlFor="meta_title" className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Meta Title
                  </Label>
                  <Input
                    id="meta_title"
                    value={formData.meta_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                    placeholder="SEO title for this category"
                    maxLength={60}
                    className="mt-2 border-0 bg-transparent p-0 text-gray-900 focus-visible:ring-0"
                  />
                  <p className="text-xs text-gray-400 mt-1">{formData.meta_title.length}/60 characters</p>
                </div>

                <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                  <Label htmlFor="meta_description" className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Meta Description
                  </Label>
                  <Textarea
                    id="meta_description"
                    value={formData.meta_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                    placeholder="SEO description for this category"
                    rows={3}
                    maxLength={160}
                    className="mt-2 border-0 bg-transparent p-0 text-gray-900 focus-visible:ring-0 resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">{formData.meta_description.length}/160 characters</p>
                </div>
              </CardContent>
            </Card>

            {/* Product Associations */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Package className="h-5 w-5 text-red-600" />
                  Product Associations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProductSelectionStep
                  selectedProducts={selectedProducts}
                  onProductsChange={setSelectedProducts}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Category Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                  <div>
                    <Label htmlFor="status" className="text-gray-700 dark:text-gray-300">Active</Label>
                    <p className="text-xs text-gray-500 mt-1">Make this category visible</p>
                  </div>
                  <Switch
                    id="status"
                    checked={formData.status === 'active'}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({ ...prev, status: checked ? 'active' : 'inactive' }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Homepage Thumbnail (Portrait 3:4) */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <ImageIcon className="w-5 h-5 mr-2 text-red-600" />
                  Homepage Thumbnail
                </CardTitle>
              </CardHeader>
              <CardContent>
                {formData.homepage_thumbnail_url ? (
                  <div className="space-y-3">
                    <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
                      <Image
                        src={formData.homepage_thumbnail_url}
                        alt="Homepage Thumbnail"
                        width={300}
                        height={400}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => setFormData(prev => ({ ...prev, homepage_thumbnail_url: '' }))}
                    >
                      Remove Thumbnail
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                    <Upload className="mx-auto h-10 w-10 text-gray-300" />
                    <div className="mt-4">
                      <Label htmlFor="homepage-thumbnail-upload" className="cursor-pointer">
                        <span className="text-red-600 hover:text-red-700 font-medium">Upload portrait image</span>
                        <input
                          id="homepage-thumbnail-upload"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'homepage_thumbnail')}
                          disabled={uploadingImage}
                        />
                      </Label>
                      <p className="text-xs text-gray-500 mt-2">
                        Portrait (3:4 ratio)<br />
                        Max 5MB
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* PLP Thumbnail (Square 1:1) */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <ImageIcon className="w-5 h-5 mr-2 text-red-600" />
                  PLP Thumbnail
                </CardTitle>
              </CardHeader>
              <CardContent>
                {formData.plp_square_thumbnail_url ? (
                  <div className="space-y-3">
                    <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
                      <Image
                        src={formData.plp_square_thumbnail_url}
                        alt="PLP Thumbnail"
                        width={300}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => setFormData(prev => ({ ...prev, plp_square_thumbnail_url: '' }))}
                    >
                      Remove Thumbnail
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                    <Upload className="mx-auto h-10 w-10 text-gray-300" />
                    <div className="mt-4">
                      <Label htmlFor="plp-thumbnail-upload" className="cursor-pointer">
                        <span className="text-red-600 hover:text-red-700 font-medium">Upload square image</span>
                        <input
                          id="plp-thumbnail-upload"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'plp_square')}
                          disabled={uploadingImage}
                        />
                      </Label>
                      <p className="text-xs text-gray-500 mt-2">
                        Square (1:1 ratio)<br />
                        Max 5MB
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Banner Configuration */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <ImageIcon className="w-5 h-5 mr-2 text-red-600" />
                  Banner Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                      Select Banner
                    </Label>
                    <Select
                      value={formData.selected_banner_id}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, selected_banner_id: val }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a banner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Banner</SelectItem>
                        {availableBanners.map((banner) => (
                          <SelectItem key={banner.id} value={banner.id}>
                            {banner.internal_title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.selected_banner_id !== 'none' && (
                      <div className="mt-3 p-2 bg-gray-50 rounded border text-xs text-gray-500">
                        Selected banner will be displayed at the top of this category page.
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Display Order */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Display Order</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                  <Label htmlFor="display_order" className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Order Position
                  </Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                    min={0}
                    className="mt-2 border-0 bg-transparent p-0 text-gray-900 focus-visible:ring-0"
                  />
                  <p className="text-xs text-gray-400 mt-1">Lower numbers appear first</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div >
  )
}
