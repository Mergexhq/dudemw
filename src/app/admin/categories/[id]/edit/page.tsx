'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CategoryService } from '@/lib/services/categories'
import { getCategoryAction, updateCategoryAction } from '@/lib/actions/categories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ArrowLeft, Upload, Loader2, Save, FolderTree, Settings, Image as ImageIcon } from 'lucide-react'

export default function EditCategoryPage() {
  const router = useRouter()
  const params = useParams()
  const categoryId = params.id as string

  const [loading, setLoading] = useState(false)
  const [fetchingCategory, setFetchingCategory] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parent_id: '',
    image_url: '',
    icon_url: '',
    meta_title: '',
    meta_description: '',
    status: 'active' as 'active' | 'inactive',
    display_order: 0
  })

  useEffect(() => {
    fetchCategory()
  }, [categoryId])

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
          image_url: categoryData.image || '',
          icon_url: '',
          meta_title: '',
          meta_description: '',
          status: 'active',
          display_order: 0
        })
      }
    } catch (error) {
      toast.error('Failed to fetch category')
      router.push('/admin/categories')
    } finally {
      setFetchingCategory(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'icon') => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)

    try {
      const result = await CategoryService.uploadImage(file, type)
      if (result.success && result.url) {
        setFormData(prev => ({
          ...prev,
          [type === 'image' ? 'image_url' : 'icon_url']: result.url
        }))
        toast.success(`${type === 'image' ? 'Image' : 'Icon'} uploaded successfully`)
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
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        parent_id: formData.parent_id || null,
        status: formData.status,
        display_order: formData.display_order
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
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/categories/${categoryId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Category
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Edit Category
            </h1>
            <p className="text-gray-500">{formData.name}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/categories/${categoryId}`}>
              Cancel
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
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <Settings className="w-5 h-5 mr-2 text-red-600" />
                  SEO Settings
                </CardTitle>
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

            {/* Category Image */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <ImageIcon className="w-5 h-5 mr-2 text-red-600" />
                  Category Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                {formData.image_url ? (
                  <div className="space-y-3">
                    <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
                      <Image
                        src={formData.image_url}
                        alt="Category"
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
                      onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                    >
                      Remove Image
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                    <Upload className="mx-auto h-10 w-10 text-gray-300" />
                    <div className="mt-4">
                      <Label htmlFor="image-upload" className="cursor-pointer">
                        <span className="text-red-600 hover:text-red-700 font-medium">Upload an image</span>
                        <input
                          id="image-upload"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'image')}
                          disabled={uploadingImage}
                        />
                      </Label>
                    </div>
                    {uploadingImage && <Loader2 className="mx-auto h-5 w-5 animate-spin mt-3 text-gray-400" />}
                  </div>
                )}
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
    </div>
  )
}
