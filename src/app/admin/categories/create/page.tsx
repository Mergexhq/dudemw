'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CategoryService } from '@/lib/services/categories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { ArrowLeft, Upload, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function CreateCategoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingIcon, setUploadingIcon] = useState(false)

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'icon') => {
    const file = e.target.files?.[0]
    if (!file) return

    if (type === 'image') {
      setUploadingImage(true)
    } else {
      setUploadingIcon(true)
    }

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
      if (type === 'image') {
        setUploadingImage(false)
      } else {
        setUploadingIcon(false)
      }
    }
  }

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: CategoryService.generateSlug(name)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await CategoryService.createCategory({
        ...formData,
        parent_id: formData.parent_id || null
      })

      if (result.success) {
        toast.success('Category created successfully')
        router.push('/admin/categories')
      } else {
        toast.error(result.error || 'Failed to create category')
      }
    } catch (error) {
      console.error('Error creating category:', error)
      toast.error('Failed to create category')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/admin/categories">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Create Category</h1>
          <p className="text-lg text-gray-600 mt-2">Add a new category to your store</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., T-Shirts"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="slug">URL Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="e.g., t-shirts"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-generated from name, but you can customize it</p>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this category..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* SEO Settings */}
            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="meta_title">Meta Title</Label>
                  <Input
                    id="meta_title"
                    value={formData.meta_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                    placeholder="SEO title for this category"
                    maxLength={60}
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.meta_title.length}/60 characters</p>
                </div>

                <div>
                  <Label htmlFor="meta_description">Meta Description</Label>
                  <Textarea
                    id="meta_description"
                    value={formData.meta_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                    placeholder="SEO description for this category"
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.meta_description.length}/160 characters</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="status">Active</Label>
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

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle>Category Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="image">Main Image</Label>
                  <div className="mt-2">
                    {formData.image_url ? (
                      <div className="relative">
                        <img src={formData.image_url} alt="Category" className="w-full h-48 object-cover rounded-lg" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <Label htmlFor="image-upload" className="cursor-pointer">
                            <span className="text-red-600 hover:text-red-700">Upload an image</span>
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
                        {uploadingImage && <Loader2 className="mx-auto h-6 w-6 animate-spin mt-2" />}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Display Order */}
            <Card>
              <CardHeader>
                <CardTitle>Display Order</CardTitle>
              </CardHeader>
              <CardContent>
                <Label htmlFor="display_order">Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  min={0}
                />
                <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end space-x-4">
          <Link href="/admin/categories">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Category
          </Button>
        </div>
      </form>
    </div>
  )
}
