"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface CategoryFormData {
  name: string
  slug: string
  description: string
  parent_id: string
  status: 'active' | 'inactive'
  display_order: number
  meta_title: string
  meta_description: string
}

interface BasicInfoStepProps {
  formData: CategoryFormData
  onNameChange: (name: string) => void
  onFormDataChange: (updates: Partial<CategoryFormData>) => void
}

export function BasicInfoStep({ formData, onNameChange, onFormDataChange }: BasicInfoStepProps) {
  const generateSEO = () => {
    const title = formData.name || "Category Name"
    const description = formData.description
      ? formData.description.substring(0, 155)
      : "Category description"

    onFormDataChange({
      meta_title: title,
      meta_description: description
    })
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gray-900">Category Details</CardTitle>
          <p className="text-sm text-gray-600">Enter the basic information for your category</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Category Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Enter category name"
                className="h-11"
                required
              />
              <p className="text-xs text-gray-500">This will be displayed to customers</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug" className="text-sm font-medium text-gray-700">
                URL Slug *
              </Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => onFormDataChange({ slug: e.target.value })}
                placeholder="category-url-slug"
                className="h-11"
                required
              />
              <p className="text-xs text-gray-500">Used in the category URL</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              Description *
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => onFormDataChange({ description: e.target.value })}
              placeholder="Enter category description"
              rows={4}
              className="resize-none"
              required
            />
            <p className="text-xs text-gray-500">Describe what products belong in this category</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Status</Label>
              <div className="flex items-center space-x-3 h-11">
                <Switch
                  id="status"
                  checked={formData.status === 'active'}
                  onCheckedChange={(checked) =>
                    onFormDataChange({ status: checked ? 'active' : 'inactive' })
                  }
                />
                <Label htmlFor="status" className="text-sm font-medium">
                  {formData.status === 'active' ? 'Active' : 'Inactive'}
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_order" className="text-sm font-medium text-gray-700">
                Display Order
              </Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => onFormDataChange({ display_order: parseInt(e.target.value) || 0 })}
                placeholder="0"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent_id" className="text-sm font-medium text-gray-700">
                Parent Category
              </Label>
              <Select
                value={formData.parent_id || "none"}
                onValueChange={(value) => onFormDataChange({ parent_id: value === "none" ? "" : value })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select parent (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent (root category)</SelectItem>
                  {/* TODO: Load actual parent categories */}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEO Settings */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900">SEO Settings</CardTitle>
              <p className="text-sm text-gray-600">Optimize your category for search engines</p>
            </div>
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
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="meta_title" className="text-sm font-medium text-gray-700">
              Meta Title
            </Label>
            <Input
              id="meta_title"
              value={formData.meta_title}
              onChange={(e) => onFormDataChange({ meta_title: e.target.value })}
              placeholder="SEO title for this category"
              className="h-11"
            />
            <p className="text-xs text-gray-500">Recommended: 50-60 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meta_description" className="text-sm font-medium text-gray-700">
              Meta Description
            </Label>
            <Textarea
              id="meta_description"
              value={formData.meta_description}
              onChange={(e) => onFormDataChange({ meta_description: e.target.value })}
              placeholder="SEO description for this category"
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">Recommended: 150-160 characters</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}