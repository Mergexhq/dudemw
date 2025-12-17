"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { getCategories, getCollections } from "@/lib/actions/products"

interface OrganizationData {
  categories: string[]
  collections: string[]
  tags: string[]
}

interface OrganizationTabProps {
  organizationData: OrganizationData
  onOrganizationDataChange: (updates: Partial<OrganizationData>) => void
}

interface Category {
  id: string
  name: string
  slug: string
  parent_id: string | null
}

interface Collection {
  id: string
  title: string
  slug: string
  type: string
}

export function OrganizationTab({ organizationData, onOrganizationDataChange }: OrganizationTabProps) {
  const [availableCategories, setAvailableCategories] = useState<Category[]>([])
  const [availableCollections, setAvailableCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [categoriesResult, collectionsResult] = await Promise.all([
          getCategories(),
          getCollections()
        ])

        if (categoriesResult.success && categoriesResult.data) {
          setAvailableCategories(categoriesResult.data)
        }

        if (collectionsResult.success && collectionsResult.data) {
          setAvailableCollections(collectionsResult.data)
        }
      } catch (error) {
        console.error('Error loading categories and collections:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])
  const toggleCategory = (categoryId: string) => {
    const isSelected = organizationData.categories.includes(categoryId)
    const newCategories = isSelected
      ? organizationData.categories.filter(c => c !== categoryId)
      : [...organizationData.categories, categoryId]
    
    onOrganizationDataChange({ categories: newCategories })
  }

  const toggleCollection = (collectionId: string) => {
    const isSelected = organizationData.collections.includes(collectionId)
    const newCollections = isSelected
      ? organizationData.collections.filter(c => c !== collectionId)
      : [...organizationData.collections, collectionId]
    
    onOrganizationDataChange({ collections: newCollections })
  }

  const addTag = (tag: string) => {
    if (tag.trim() && !organizationData.tags.includes(tag.trim())) {
      onOrganizationDataChange({
        tags: [...organizationData.tags, tag.trim()]
      })
    }
  }

  const removeTag = (tagToRemove: string) => {
    onOrganizationDataChange({
      tags: organizationData.tags.filter(tag => tag !== tagToRemove)
    })
  }

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const input = e.target as HTMLInputElement
      addTag(input.value)
      input.value = ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Categories */}
      <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 dark:from-gray-900 dark:to-red-950/20 border-red-100/50 dark:border-red-900/20 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Categories</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Used for navigation and category pages - select multiple
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading categories...</div>
          ) : availableCategories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No categories available</div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {availableCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={`p-3 text-left rounded-lg border-2 transition-all ${
                    organizationData.categories.includes(category.id)
                      ? "border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="font-medium">{category.name}</div>
                </button>
              ))}
            </div>
          )}
          
          {organizationData.categories.length > 0 && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-sm font-medium mb-2">Selected Categories:</p>
              <div className="flex flex-wrap gap-2">
                {organizationData.categories.map((categoryId) => {
                  const category = availableCategories.find(c => c.id === categoryId)
                  return category ? (
                    <Badge key={categoryId} variant="secondary">
                      {category.name}
                    </Badge>
                  ) : null
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Collections */}
      <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 dark:from-gray-900 dark:to-red-950/20 border-red-100/50 dark:border-red-900/20 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Collections</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Used for homepage sections and campaigns - select multiple
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {availableCollections.map((collection) => (
              <button
                key={collection}
                onClick={() => toggleCollection(collection)}
                className={`p-3 text-left rounded-lg border-2 transition-all ${
                  organizationData.collections.includes(collection)
                    ? "border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <div className="font-medium">{collection}</div>
              </button>
            ))}
          </div>
          
          {organizationData.collections.length > 0 && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-sm font-medium mb-2">Selected Collections:</p>
              <div className="flex flex-wrap gap-2">
                {organizationData.collections.map((collection) => (
                  <Badge key={collection} variant="secondary">
                    {collection}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tags */}
      <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 dark:from-gray-900 dark:to-red-950/20 border-red-100/50 dark:border-red-900/20 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Tags</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Free text tags used for search and filters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tags">Add Tags</Label>
            <Input
              id="tags"
              placeholder="Type a tag and press Enter or comma"
              onKeyDown={handleTagInput}
              className="w-full"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Press Enter or comma to add tags. Use tags like: cotton, casual, winter, premium
            </p>
          </div>

          {organizationData.tags.length > 0 && (
            <div className="space-y-2">
              <Label>Current Tags ({organizationData.tags.length})</Label>
              <div className="flex flex-wrap gap-2">
                {organizationData.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="flex items-center space-x-1">
                    <span>{tag}</span>
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tag Suggestions */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Tag Usage</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• <strong>Material:</strong> cotton, polyester, wool, silk</li>
              <li>• <strong>Style:</strong> casual, formal, vintage, modern</li>
              <li>• <strong>Season:</strong> summer, winter, spring, fall</li>
              <li>• <strong>Occasion:</strong> work, party, gym, travel</li>
              <li>• <strong>Features:</strong> waterproof, breathable, stretch</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
