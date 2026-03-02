"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FolderTree, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { getCategoriesAction } from "@/lib/actions/categories"

interface Category {
  id: string
  name: string
  slug: string
}

interface CategorySelectionStepProps {
  selectedCategory?: string
  onCategoryChange: (category: string) => void
}

export function CategorySelectionStep({ selectedCategory, onCategoryChange }: CategorySelectionStepProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true)
      try {
        const result = await getCategoriesAction()
        if (result.success && (result as any).data) {
          setCategories(((result as any).data as any[]).map((c: any) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
          })))
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setIsLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-xl font-bold text-gray-900">
          <FolderTree className="h-5 w-5" />
          <span>Where does the banner go?</span>
        </CardTitle>
        <CardDescription className="text-gray-600">
          Select which category page this banner will appear on
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select value={selectedCategory} onValueChange={onCategoryChange} disabled={isLoadingCategories}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={isLoadingCategories ? "Loading categories..." : "Select a category"} />
            </SelectTrigger>
            <SelectContent>
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.slug}>
                    {cat.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="loading" disabled={true}>
                  {isLoadingCategories ? "Loading..." : "No categories found"}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            The banner will appear at the top of the selected category page
          </p>
        </div>


      </CardContent>
    </Card>
  )
}