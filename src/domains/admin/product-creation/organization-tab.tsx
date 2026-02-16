"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { getCategories, getCollections } from "@/lib/actions/products"
import { ProductSiblingLinker, LinkedProduct } from "@/domains/admin/components/ProductSiblingLinker"
import { ProductSearchResult } from "@/lib/actions/search-products"

interface OrganizationData {
  categories: string[]
  collections: string[]
  tags: string[]
}

interface OrganizationTabProps {
  organizationData: OrganizationData
  onOrganizationDataChange: (updates: Partial<OrganizationData>) => void
  linkedSiblingProducts: LinkedProduct[]
  onLinkedSiblingsChange: (products: LinkedProduct[]) => void
}

interface Category {
  id: string
  name: string
  slug: string
}

interface Collection {
  id: string
  title: string
  slug: string
  type: string
}

export function OrganizationTab({
  organizationData,
  onOrganizationDataChange,
  linkedSiblingProducts,
  onLinkedSiblingsChange
}: OrganizationTabProps) {
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
      {/* Product Sibling Linker */}
      <ProductSiblingLinker
        linkedSiblings={linkedSiblingProducts}
        onSiblingsChange={onLinkedSiblingsChange}
      />

      {/* Categories */}
      <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">Categories</CardTitle>
          <CardDescription className="text-gray-600">
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
                  className={`p-3 text-left rounded-lg border-2 transition-all ${organizationData.categories.includes(category.id)
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-200 hover:border-gray-300"
                    }`}
                >
                  <div className="font-medium">{category.name}</div>
                </button>
              ))}
            </div>
          )}

          {organizationData.categories.length > 0 && (
            <div className="p-3 bg-gray-50 rounded-lg">
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
      <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">Collections</CardTitle>
          <CardDescription className="text-gray-600">
            Used for homepage sections and campaigns - select multiple
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading collections...</div>
          ) : availableCollections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No collections available</div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {availableCollections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => toggleCollection(collection.id)}
                  className={`p-3 text-left rounded-lg border-2 transition-all ${organizationData.collections.includes(collection.id)
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-200 hover:border-gray-300"
                    }`}
                >
                  <div className="font-medium">{collection.title}</div>
                </button>
              ))}
            </div>
          )}

          {organizationData.collections.length > 0 && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-2">Selected Collections:</p>
              <div className="flex flex-wrap gap-2">
                {organizationData.collections.map((collectionId) => {
                  const collection = availableCollections.find(c => c.id === collectionId)
                  return collection ? (
                    <Badge key={collectionId} variant="secondary">
                      {collection.title}
                    </Badge>
                  ) : null
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tags */}
      <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">Tags</CardTitle>
          <CardDescription className="text-gray-600">
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
            <p className="text-xs text-gray-500">
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


        </CardContent>
      </Card>
    </div>
  )
}