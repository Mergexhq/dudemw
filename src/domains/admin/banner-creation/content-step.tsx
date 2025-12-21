"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Upload,
  CheckCircle,
  Images,
  Plus,
  Smile,
  Truck,
  DollarSign,
  Zap,
  Target,
  Flame,
  Sparkles,
  PartyPopper,
  Trophy,
  Star,
  Package,
  Gem,
  Rocket,
  Gift,
  Percent,
  Bell,
  Rainbow,
  Heart,
  Calendar,
  Tag,
  CreditCard,
  ShoppingBag,
  Clock,
  Shield,
  Award,
  Megaphone,
  TrendingUp,
  ExternalLink,
  Layers,
  FolderTree,
  AlertCircle
} from "lucide-react"
import { IconPickerDialog } from "./icon-picker-dialog"
import { createClient } from "@/lib/supabase/client"
import { useEffect } from "react"

// Icon mapping for displaying selected icons
const ICON_COMPONENTS: Record<string, React.ComponentType<any>> = {
  "truck": Truck,
  "dollar-sign": DollarSign,
  "zap": Zap,
  "target": Target,
  "flame": Flame,
  "sparkles": Sparkles,
  "party-popper": PartyPopper,
  "trophy": Trophy,
  "star": Star,
  "package": Package,
  "gem": Gem,
  "rocket": Rocket,
  "gift": Gift,
  "percent": Percent,
  "bell": Bell,
  "rainbow": Rainbow,
  "heart": Heart,
  "calendar": Calendar,
  "tag": Tag,
  "credit-card": CreditCard,
  "shopping-bag": ShoppingBag,
  "clock": Clock,
  "shield": Shield,
  "award": Award,
  "megaphone": Megaphone,
  "trending-up": TrendingUp
}

// Action Options Configuration
interface ActionOption {
  id: "collection" | "category" | "product" | "external"
  title: string
  icon: any
}

const ACTION_OPTIONS: ActionOption[] = [
  { id: "collection", title: "Link to Collection", icon: Layers },
  { id: "category", title: "Link to Category", icon: Tag },
  { id: "product", title: "Link to Product", icon: Package },
  { id: "external", title: "External URL", icon: ExternalLink }
]

interface Category {
  id: string
  name: string
  slug: string
}

interface Collection {
  id: string
  title: string
  slug: string
}

interface Product {
  id: string
  title: string
  slug: string
}

type BannerPlacement = "homepage-carousel" | "product-listing-carousel" | "category-banner" | "top-marquee-banner"

interface BannerImageSettings {
  file: File
  titleText?: string
  ctaText?: string
  actionType?: string
  actionTarget?: string
  actionName?: string
}

interface MarqueeItem {
  id: string
  text: string
  icon?: string
}

interface BannerFormData {
  internalTitle: string
  bannerImage?: File
  bannerImages?: File[]
  bannerTitle?: string
  bannerSubtitle?: string
  bannerDescription?: string
  marqueeItems?: MarqueeItem[]
  imageSettings?: BannerImageSettings[]
  ctaText?: string
  position?: number
  category?: string
  startDate?: string
  endDate?: string
  actionType?: "collection" | "category" | "product" | "external"
  actionTarget?: string
  actionName?: string
}

interface ContentStepProps {
  placement: BannerPlacement
  formData: BannerFormData
  onFormDataChange: (updates: Partial<BannerFormData>) => void
}

interface MarqueeMessageFormProps {
  onAdd: (text: string, icon: string) => void
}

function MarqueeMessageForm({ onAdd }: MarqueeMessageFormProps) {
  const [messageText, setMessageText] = useState("")
  const [selectedIcon, setSelectedIcon] = useState("")

  const handleAdd = () => {
    if (messageText.trim()) {
      onAdd(messageText, selectedIcon)
      setMessageText("")
      setSelectedIcon("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <div className="flex items-end space-x-3">
        <div className="flex-1 space-y-2">
          <Label htmlFor="messageText" className="text-sm font-medium text-gray-700">
            Message Text *
          </Label>
          <Input
            id="messageText"
            placeholder="e.g., FREE SHIPPING ON ORDERS ABOVE ₹999"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Icon</Label>
          <IconPickerDialog
            selectedIcon={selectedIcon}
            onIconSelect={setSelectedIcon}
          >
            <Button
              variant="outline"
              className="h-10 w-10 p-0 border-2 hover:border-red-300 hover:bg-red-50"
              type="button"
            >
              {selectedIcon && ICON_COMPONENTS[selectedIcon] ? (
                (() => {
                  const IconComponent = ICON_COMPONENTS[selectedIcon]
                  return <IconComponent className="h-4 w-4 text-red-600" />
                })()
              ) : (
                <Smile className="h-4 w-4 text-gray-400" />
              )}
            </Button>
          </IconPickerDialog>
        </div>
      </div>
      <Button
        type="button"
        onClick={handleAdd}
        disabled={!messageText.trim()}
        className="w-full bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Message
      </Button>
    </div>
  )
}

export function ContentStep({ placement, formData, onFormDataChange }: ContentStepProps) {
  const isMarqueeBanner = placement === "top-marquee-banner"
  const isCategoryBanner = placement === "category-banner"
  const isCarousel = placement === "homepage-carousel" || placement === "product-listing-carousel"

  const [categories, setCategories] = useState<Category[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [isLoadingCollections, setIsLoadingCollections] = useState(false)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

  // Fetch categories for selection
  useEffect(() => {
    const fetchData = async () => {
      // Only fetch if needed
      if (isMarqueeBanner) return

      const supabase = createClient()

      // Fetch Categories
      setIsLoadingCategories(true)
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, slug')
          .order('name')

        if (error) throw error
        setCategories(data || [])
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setIsLoadingCategories(false)
      }

      // Fetch Collections
      setIsLoadingCollections(true)
      try {
        const { data, error } = await supabase
          .from('collections')
          .select('id, title, slug')
          .order('title')

        if (error) throw error
        const validCollections = (data || []).filter(item => item.slug) as Collection[]
        setCollections(validCollections)
      } catch (error) {
        console.error('Error fetching collections:', error)
      } finally {
        setIsLoadingCollections(false)
      }

      // Fetch Products
      setIsLoadingProducts(true)
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, title, slug')
          .order('title')

        console.log('Products fetched:', data?.length, data)

        if (error) throw error
        // Use all products that have an id (slug might be null for some)
        const validProducts = (data || []).map(item => ({
          id: item.id,
          title: item.title,
          slug: item.slug || item.id
        })) as Product[]
        setProducts(validProducts)
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setIsLoadingProducts(false)
      }
    }

    fetchData()
  }, [isMarqueeBanner])

  const getAspectRatio = (placement: BannerPlacement): string => {
    switch (placement) {
      case "homepage-carousel":
      case "product-listing-carousel":
        return "16:6 or 16:7"
      case "category-banner":
        return "16:4"
      case "top-marquee-banner":
        return "Full width scrolling"
    }
  }

  const addMarqueeItem = () => {
    const newItem: MarqueeItem = {
      id: Date.now().toString(),
      text: "",
      icon: ""
    }
    const currentItems = formData.marqueeItems || []
    onFormDataChange({ marqueeItems: [...currentItems, newItem] })
  }

  const updateMarqueeItem = (id: string, updates: Partial<MarqueeItem>) => {
    const currentItems = formData.marqueeItems || []
    const updatedItems = currentItems.map(item =>
      item.id === id ? { ...item, ...updates } : item
    )
    onFormDataChange({ marqueeItems: updatedItems })
  }

  const removeMarqueeItem = (id: string) => {
    const currentItems = formData.marqueeItems || []
    const filteredItems = currentItems.filter(item => item.id !== id)
    onFormDataChange({ marqueeItems: filteredItems })
  }

  return (
    <div className="space-y-6">
      {/* Marquee Banner - Only Internal Title */}
      {isMarqueeBanner ? (
        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Marquee Banner Setup</CardTitle>
            <CardDescription className="text-gray-600">
              Basic information for your marquee banner
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="internalTitle">Internal Title *</Label>
              <Input
                id="internalTitle"
                placeholder="e.g., Holiday Promotions Marquee"
                value={formData.internalTitle}
                onChange={(e) => onFormDataChange({ internalTitle: e.target.value })}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Used only in admin - not visible to customers
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Other Banner Types - Common Fields */
        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Banner Content</CardTitle>
            <CardDescription className="text-gray-600">
              Essential banner details and image
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="internalTitle">Internal Title *</Label>
              <Input
                id="internalTitle"
                placeholder="e.g., Winter Sale – Main Banner"
                value={formData.internalTitle}
                onChange={(e) => onFormDataChange({ internalTitle: e.target.value })}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Used only in admin - not visible to customers
              </p>
            </div>

            <div className="space-y-2">
              <Label>
                {(placement === "homepage-carousel" || placement === "product-listing-carousel")
                  ? "Carousel Images *"
                  : "Banner Image *"}
              </Label>

              {/* Multiple images for carousel placements */}
              {(placement === "homepage-carousel" || placement === "product-listing-carousel") ? (
                <div className="space-y-6">
                  {/* Upload area */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <div className="space-y-2">
                      <Button variant="outline" onClick={() => document.getElementById('carousel-upload')?.click()}>
                        {formData.imageSettings && formData.imageSettings.length > 0 ? 'Add More Images' : 'Upload Carousel Images'}
                      </Button>
                      <input
                        id="carousel-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || [])
                          if (files.length > 0) {
                            const existingSettings = formData.imageSettings || []
                            const newSettings = files.map(file => ({ file }))
                            onFormDataChange({
                              imageSettings: [...existingSettings, ...newSettings],
                              bannerImages: [...(formData.bannerImages || []), ...files]
                            })
                          }
                        }}
                      />
                      <p className="text-sm text-gray-500">
                        Recommended: {getAspectRatio(placement)} aspect ratio
                      </p>
                      <p className="text-xs text-gray-400">PNG, JPG up to 10MB each. Select multiple images for carousel.</p>
                    </div>
                  </div>

                  {/* Individual Image Settings */}
                  {formData.imageSettings && formData.imageSettings.length > 0 && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-green-800">
                              {formData.imageSettings.length} image{formData.imageSettings.length > 1 ? 's' : ''} ready for carousel
                            </p>
                            <p className="text-xs text-green-600 flex items-center mt-1">
                              <Images className="w-3 h-3 mr-1" />
                              Configure each image below
                            </p>
                          </div>
                        </div>
                      </div>

                      {formData.imageSettings.map((imageSetting, index) => (
                        <Card key={index} className="border-2 border-gray-200 hover:border-gray-300 transition-colors">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg font-semibold text-gray-900">
                                Image {index + 1} Settings
                              </CardTitle>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newSettings = formData.imageSettings?.filter((_, i) => i !== index)
                                  const newImages = formData.bannerImages?.filter((_, i) => i !== index)
                                  onFormDataChange({
                                    imageSettings: newSettings,
                                    bannerImages: newImages
                                  })
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                Remove
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Image Preview */}
                            <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                              <img
                                src={URL.createObjectURL(imageSetting.file)}
                                alt={`Carousel image ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Text Settings */}
                            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor={`titleText-${index}`}>Title Text (Optional)</Label>
                                <Input
                                  id={`titleText-${index}`}
                                  placeholder="e.g., Winter Sale 50% Off"
                                  value={imageSetting.titleText || ""}
                                  onChange={(e) => {
                                    const newSettings = [...(formData.imageSettings || [])]
                                    newSettings[index] = { ...newSettings[index], titleText: e.target.value }
                                    onFormDataChange({ imageSettings: newSettings })
                                  }}
                                  className="w-full"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`ctaText-${index}`}>CTA Button Text (Optional)</Label>
                                <Input
                                  id={`ctaText-${index}`}
                                  placeholder="e.g., Shop Now, Explore, Learn More"
                                  value={imageSetting.ctaText || ""}
                                  onChange={(e) => {
                                    const newSettings = [...(formData.imageSettings || [])]
                                    newSettings[index] = { ...newSettings[index], ctaText: e.target.value }
                                    onFormDataChange({ imageSettings: newSettings })
                                  }}
                                  className="w-full"
                                />
                              </div>
                            </div>

                            {/* Action Settings */}
                            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <h4 className="font-medium text-blue-900">Where does this image go when clicked?</h4>
                              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                                <div className="space-y-2">
                                  <Label htmlFor={`actionType-${index}`}>Action Type</Label>
                                  <Select
                                    value={imageSetting.actionType || ""}
                                    onValueChange={(value) => {
                                      const newSettings = [...(formData.imageSettings || [])]
                                      newSettings[index] = { ...newSettings[index], actionType: value, actionTarget: "", actionName: "" }
                                      onFormDataChange({ imageSettings: newSettings })
                                    }}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select action type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="collection">Link to Collection</SelectItem>
                                      <SelectItem value="category">Link to Category</SelectItem>
                                      <SelectItem value="product">Link to Product</SelectItem>
                                      <SelectItem value="external">External URL</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`actionTarget-${index}`}>
                                    {imageSetting.actionType === "external" ? "URL" : "Target"}
                                  </Label>

                                  {imageSetting.actionType === "collection" && (
                                    <Select
                                      value={imageSetting.actionTarget || ""}
                                      onValueChange={(value) => {
                                        if (value === "_loading" || value === "_empty") return
                                        const selectedCollection = collections.find(c => c.slug === value)
                                        const newSettings = [...(formData.imageSettings || [])]
                                        newSettings[index] = {
                                          ...newSettings[index],
                                          actionTarget: value,
                                          actionName: selectedCollection?.title || value
                                        }
                                        onFormDataChange({ imageSettings: newSettings })
                                      }}
                                      disabled={isLoadingCollections}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder={isLoadingCollections ? "Loading..." : "Select Collection"} />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {collections.length > 0 ? (
                                          collections.map((col) => (
                                            <SelectItem key={col.id} value={col.slug}>
                                              {col.title}
                                            </SelectItem>
                                          ))
                                        ) : (
                                          <SelectItem value={isLoadingCollections ? "_loading" : "_empty"}>
                                            {isLoadingCollections ? "Loading..." : "No collections found"}
                                          </SelectItem>
                                        )}
                                      </SelectContent>
                                    </Select>
                                  )}

                                  {imageSetting.actionType === "category" && (
                                    <Select
                                      value={imageSetting.actionTarget || ""}
                                      onValueChange={(value) => {
                                        const selectedCategory = categories.find(c => c.slug === value)
                                        const newSettings = [...(formData.imageSettings || [])]
                                        newSettings[index] = {
                                          ...newSettings[index],
                                          actionTarget: value,
                                          actionName: selectedCategory?.name || value
                                        }
                                        onFormDataChange({ imageSettings: newSettings })
                                      }}
                                      disabled={isLoadingCategories}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder={isLoadingCategories ? "Loading..." : "Select Category"} />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {categories.map((cat) => (
                                          <SelectItem key={cat.id} value={cat.slug}>
                                            {cat.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}

                                  {imageSetting.actionType === "product" && (
                                    <Select
                                      value={imageSetting.actionTarget || ""}
                                      onValueChange={(value) => {
                                        if (value === "_loading" || value === "_empty") return
                                        const selectedProduct = products.find(p => p.slug === value)
                                        const newSettings = [...(formData.imageSettings || [])]
                                        newSettings[index] = {
                                          ...newSettings[index],
                                          actionTarget: value,
                                          actionName: selectedProduct?.title || value
                                        }
                                        onFormDataChange({ imageSettings: newSettings })
                                      }}
                                      disabled={isLoadingProducts}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder={isLoadingProducts ? "Loading..." : "Select Product"} />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {products.length > 0 ? (
                                          products.map((prod) => (
                                            <SelectItem key={prod.id} value={prod.slug}>
                                              {prod.title}
                                            </SelectItem>
                                          ))
                                        ) : (
                                          <SelectItem value={isLoadingProducts ? "_loading" : "_empty"}>
                                            {isLoadingProducts ? "Loading..." : "No products found"}
                                          </SelectItem>
                                        )}
                                      </SelectContent>
                                    </Select>
                                  )}

                                  {(!imageSetting.actionType || imageSetting.actionType === "external") && (
                                    <Input
                                      id={`actionTarget-${index}`}
                                      placeholder="https://example.com"
                                      value={imageSetting.actionTarget || ""}
                                      onChange={(e) => {
                                        const newSettings = [...(formData.imageSettings || [])]
                                        newSettings[index] = {
                                          ...newSettings[index],
                                          actionTarget: e.target.value,
                                          actionName: e.target.value
                                        }
                                        onFormDataChange({ imageSettings: newSettings })
                                      }}
                                      className="w-full"
                                    />
                                  )}
                                </div>
                              </div>
                              {imageSetting.actionType && imageSetting.actionTarget && (
                                <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
                                  <strong>Preview:</strong> Clicking this image will redirect to: {imageSetting.actionTarget}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Single image for other placements */
                <div>
                  {formData.bannerImage ? (
                    <div className="space-y-4">
                      <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={URL.createObjectURL(formData.bannerImage)}
                          alt="Banner preview"
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onFormDataChange({ bannerImage: undefined })}
                            className="bg-white/90 hover:bg-white"
                          >
                            Change Image
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-green-800">
                              ✓ {formData.bannerImage.name} selected
                            </p>
                            <p className="text-xs text-green-600 flex items-center mt-1">
                              <Images className="w-3 h-3 mr-1" />
                              Banner image ready for upload
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <div className="space-y-2">
                        <Button variant="outline" onClick={() => document.getElementById('banner-upload')?.click()}>
                          Upload Banner Image
                        </Button>
                        <input
                          id="banner-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) onFormDataChange({ bannerImage: file })
                          }}
                        />
                        <p className="text-sm text-gray-500">
                          Recommended: {getAspectRatio(placement)} aspect ratio
                        </p>
                        <p className="text-xs text-gray-400">PNG, JPG up to 10MB</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Marquee Content Section */}
      {isMarqueeBanner && (
        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Marquee Content</CardTitle>
            <CardDescription className="text-gray-600">
              Add promotional messages with icons (Maximum 6 messages)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Marquee Items - Horizontal List */}
            {formData.marqueeItems && formData.marqueeItems.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-700">
                    Current Messages ({formData.marqueeItems.length}/6)
                  </Label>
                  <div className="text-xs text-gray-500">
                    Click × to remove a message
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {formData.marqueeItems.map((item, index) => (
                    <div key={item.id} className="group relative flex items-center space-x-3 bg-white border-2 border-gray-200 rounded-lg px-4 py-3 shadow-sm hover:shadow-md hover:border-red-300 transition-all duration-200">
                      <div className="flex-shrink-0">
                        {item.icon && ICON_COMPONENTS[item.icon] ? (
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            {(() => {
                              const IconComponent = ICON_COMPONENTS[item.icon]
                              return <IconComponent className="w-4 h-4 text-red-600" />
                            })()}
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-xs text-gray-400">?</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate" title={item.text}>
                          {item.text}
                        </p>
                        <p className="text-xs text-gray-500">Message {index + 1}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMarqueeItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Message Form */}
            {(!formData.marqueeItems || formData.marqueeItems.length < 6) && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gradient-to-br from-gray-50 to-white hover:border-red-300 transition-colors duration-200">
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto">
                      <Plus className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Add New Marquee Message</h4>
                      <p className="text-sm text-gray-600">Create engaging promotional messages with icons</p>
                    </div>

                    <MarqueeMessageForm
                      onAdd={(text: string, icon: string) => {
                        const newItem: MarqueeItem = {
                          id: Date.now().toString(),
                          text: text.trim(),
                          icon: icon
                        }
                        const currentItems = formData.marqueeItems || []
                        onFormDataChange({ marqueeItems: [...currentItems, newItem] })
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Maximum reached message */}
            {formData.marqueeItems && formData.marqueeItems.length >= 6 && (
              <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                      <span className="text-amber-600 font-bold">!</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      Maximum limit reached
                    </p>
                    <p className="text-xs text-amber-700">
                      You can have up to 6 marquee messages. Remove a message to add a new one.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {placement === "category-banner" && (
        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Category Banner Content</CardTitle>
            <CardDescription className="text-gray-600">
              Add title and description for your category banner
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 w-full">
              <div className="space-y-2 min-w-0">
                <Label htmlFor="bannerTitle">Banner Title *</Label>
                <Input
                  id="bannerTitle"
                  placeholder="e.g., New Winter Collection"
                  value={formData.bannerTitle || ""}
                  onChange={(e) => onFormDataChange({ bannerTitle: e.target.value })}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Main heading displayed on the banner
                </p>
              </div>
              <div className="space-y-2 min-w-0">
                <Label htmlFor="bannerSubtitle">Banner Subtitle</Label>
                <Input
                  id="bannerSubtitle"
                  placeholder="e.g., Up to 50% Off"
                  value={formData.bannerSubtitle || ""}
                  onChange={(e) => onFormDataChange({ bannerSubtitle: e.target.value })}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Optional subtitle or promotional text
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bannerDescription">Banner Description</Label>
              <textarea
                id="bannerDescription"
                placeholder="e.g., Discover our latest winter styles with premium quality and comfort..."
                value={formData.bannerDescription || ""}
                onChange={(e) => onFormDataChange({ bannerDescription: e.target.value })}
                className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={3}
              />
              <p className="text-xs text-gray-500">
                Detailed description displayed on the banner (optional)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action / Category Selection Section */}
      {!isMarqueeBanner && !isCarousel && (
        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-xl font-bold text-gray-900">
              {isCategoryBanner ? <FolderTree className="h-5 w-5" /> : <ExternalLink className="h-5 w-5" />}
              <span>{isCategoryBanner ? "Category Selection" : "Action Target"}</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              {isCategoryBanner
                ? "Select which category page this banner will appear on"
                : "Define what happens when users click the banner"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Category Selection for Category Banners */}
            {isCategoryBanner ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => {
                      if (value !== "loading") {
                        onFormDataChange({ category: value })
                      }
                    }}
                    disabled={isLoadingCategories}
                  >
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
                        <SelectItem value="loading">
                          {isLoadingCategories ? "Loading..." : "No categories found"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    The banner will appear at the top of the selected category page
                  </p>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Important Note</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Only one active banner per category is allowed. If there's already an active banner for this category, it will be replaced.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Action Selection for Single Banners */
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 w-full">
                  {ACTION_OPTIONS.map((option) => {
                    const Icon = option.icon
                    const actionType = formData.actionType as string | undefined
                    return (
                      <div
                        key={option.id}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${actionType === option.id
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                          }`}
                        onClick={() => {
                          onFormDataChange({
                            actionType: option.id,
                            actionTarget: "",
                            actionName: ""
                          })
                        }}
                      >
                        <div className="text-center">
                          <div className={`inline-flex p-3 rounded-lg mb-3 ${actionType === option.id ? "bg-red-100" : "bg-gray-100"
                            }`}>
                            <Icon className={`h-6 w-6 ${actionType === option.id ? "text-red-600" : "text-gray-600"
                              }`} />
                          </div>
                          <h3 className="font-medium text-gray-900 text-sm">{option.title}</h3>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {formData.actionType && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    {formData.actionType === "collection" && (
                      <div className="space-y-2">
                        <Label htmlFor="collectionTarget">Select Collection *</Label>
                        <Select
                          value={formData.actionTarget}
                          onValueChange={(value) => {
                            const selectedCollection = collections.find(c => c.slug === value)
                            onFormDataChange({
                              actionTarget: value,
                              actionName: selectedCollection?.title || value
                            })
                          }}
                          disabled={isLoadingCollections}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={isLoadingCollections ? "Loading..." : "Choose a collection"} />
                          </SelectTrigger>
                          <SelectContent>
                            {collections.map((col) => (
                              <SelectItem key={col.id} value={col.slug}>
                                {col.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {formData.actionType === "category" && (
                      <div className="space-y-2">
                        <Label htmlFor="categoryTarget">Select Category *</Label>
                        <Select
                          value={formData.actionTarget}
                          onValueChange={(value) => {
                            if (value === "loading") return
                            const selectedCategory = categories.find(cat => cat.slug === value)
                            onFormDataChange({
                              actionTarget: value,
                              actionName: selectedCategory?.name || value
                            })
                          }}
                          disabled={isLoadingCategories}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={isLoadingCategories ? "Loading..." : "Choose a category"} />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.length > 0 ? (
                              categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.slug}>
                                  {cat.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="loading">
                                {isLoadingCategories ? "Loading..." : "No categories found"}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {formData.actionType === "product" && (
                      <div className="space-y-2">
                        <Label htmlFor="productTarget">Select Product *</Label>
                        <Select
                          value={formData.actionTarget}
                          onValueChange={(value) => {
                            const selectedProduct = products.find(p => p.slug === value)
                            onFormDataChange({
                              actionTarget: value,
                              actionName: selectedProduct?.title || value
                            })
                          }}
                          disabled={isLoadingProducts}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={isLoadingProducts ? "Loading..." : "Choose a product"} />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((prod) => (
                              <SelectItem key={prod.id} value={prod.slug}>
                                {prod.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {formData.actionType === "external" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="urlTarget">External URL *</Label>
                          <Input
                            id="urlTarget"
                            placeholder="https://example.com"
                            value={formData.actionTarget || ""}
                            onChange={(e) => onFormDataChange({ actionTarget: e.target.value })}
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="linkName">Link Name *</Label>
                          <Input
                            id="linkName"
                            placeholder="e.g., Learn More"
                            value={formData.actionName || ""}
                            onChange={(e) => onFormDataChange({ actionName: e.target.value })}
                            className="w-full"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Scheduling Section - Only for non-marquee banners */}
      {!isMarqueeBanner && (
        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Schedule (Optional)</CardTitle>
            <CardDescription className="text-gray-600">
              Set when this banner should be active
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 w-full">
              <div className="space-y-2 min-w-0">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate || ""}
                  onChange={(e) => onFormDataChange({ startDate: e.target.value })}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">Leave empty to start immediately</p>
              </div>
              <div className="space-y-2 min-w-0">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={formData.endDate || ""}
                  onChange={(e) => onFormDataChange({ endDate: e.target.value })}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">Leave empty for no expiration</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}