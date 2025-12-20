"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw } from "lucide-react"

interface SEOData {
  metaTitle: string
  metaDescription: string
  urlHandle: string
}

interface SEOTabProps {
  seoData: SEOData
  onSEODataChange: (updates: Partial<SEOData>) => void
  productName: string
  productDescription: string
}

export function SEOTab({ seoData, onSEODataChange, productName, productDescription }: SEOTabProps) {
  const generateDefaults = () => {
    const title = productName || "Product Name"
    const description = productDescription
      ? productDescription.substring(0, 150) + (productDescription.length > 150 ? "..." : "")
      : "Product description"
    const handle = (productName || "product")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()

    onSEODataChange({
      metaTitle: title,
      metaDescription: description,
      urlHandle: handle
    })
  }

  const getCharacterCount = (text: string, limit: number) => {
    const count = text.length
    const isOverLimit = count > limit
    return { count, isOverLimit }
  }

  const titleCount = getCharacterCount(seoData.metaTitle, 60)
  const descriptionCount = getCharacterCount(seoData.metaDescription, 160)

  return (
    <div className="space-y-6">
      {/* SEO Settings */}
      <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">SEO Settings</CardTitle>
          <CardDescription className="text-gray-600">
            Optimize how your product appears in search engines and social media
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Auto-generate SEO defaults from product information
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={generateDefaults}
              disabled={!productName}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Generate Defaults
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metaTitle">Meta Title</Label>
            <Input
              id="metaTitle"
              placeholder="e.g., Oversized Cotton Hoodie - Premium Winter Wear"
              value={seoData.metaTitle}
              onChange={(e) => onSEODataChange({ metaTitle: e.target.value })}
              className="w-full"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                Appears as the clickable headline in search results
              </p>
              <Badge
                variant={titleCount.isOverLimit ? "destructive" : "secondary"}
                className="text-xs"
              >
                {titleCount.count}/60
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metaDescription">Meta Description</Label>
            <Textarea
              id="metaDescription"
              placeholder="e.g., Comfortable oversized hoodie made from 100% cotton. Perfect for winter, featuring a relaxed fit and premium quality fabric."
              value={seoData.metaDescription}
              onChange={(e) => onSEODataChange({ metaDescription: e.target.value })}
              rows={3}
              className="w-full"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                Brief description shown in search results
              </p>
              <Badge
                variant={descriptionCount.isOverLimit ? "destructive" : "secondary"}
                className="text-xs"
              >
                {descriptionCount.count}/160
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="urlHandle">URL Handle (Slug)</Label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">yourstore.com/products/</span>
              <Input
                id="urlHandle"
                placeholder="oversized-cotton-hoodie"
                value={seoData.urlHandle}
                onChange={(e) => onSEODataChange({ urlHandle: e.target.value })}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-gray-500">
              URL-friendly version of the product name (lowercase, hyphens only)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* SEO Preview */}
      <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">Search Preview</CardTitle>
          <CardDescription className="text-gray-600">
            How your product will appear in Google search results
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border border-gray-200 rounded-lg bg-white">
            <div className="space-y-1">
              <div className="text-blue-600 text-sm">
                yourstore.com/products/{seoData.urlHandle || "product-url"}
              </div>
              <div className="text-lg text-blue-600 hover:underline cursor-pointer">
                {seoData.metaTitle || productName || "Product Title"}
              </div>
              <div className="text-sm text-gray-600">
                {seoData.metaDescription || productDescription?.substring(0, 160) || "Product description will appear here..."}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
