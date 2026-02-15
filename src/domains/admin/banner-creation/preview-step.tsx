"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Eye,
  Image,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
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
  TrendingUp
} from "lucide-react"
import { useState } from "react"

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

type BannerPlacement = "homepage-carousel" | "product-listing-carousel" | "category-banner" | "top-marquee-banner"
type ActionType = "collection" | "category" | "product" | "external"

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
  placement?: BannerPlacement
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
  actionType?: ActionType
  actionTarget: string
  actionName: string
}

interface PreviewStepProps {
  formData: BannerFormData
}

const getPlacementLabel = (placement: BannerPlacement): string => {
  switch (placement) {
    case "homepage-carousel": return "Homepage Carousel"
    case "product-listing-carousel": return "Product Listing Carousel"
    case "category-banner": return "Category Banner"
    case "top-marquee-banner": return "Top Marquee Banner"
  }
}

const getActionLabel = (actionType: ActionType): string => {
  switch (actionType) {
    case "collection": return "Link to Collection"
    case "category": return "Link to Category"
    case "product": return "Link to Product"
    case "external": return "External URL"
  }
}

export function PreviewStep({ formData }: PreviewStepProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const isCarousel = formData.placement === "homepage-carousel"
  const isMarqueeBanner = formData.placement === "top-marquee-banner"
  const imageSettings = isCarousel ? formData.imageSettings : (formData.bannerImage ? [{ file: formData.bannerImage, actionType: formData.actionType, actionTarget: formData.actionTarget, actionName: formData.actionName }] : [])
  const currentImageSetting = imageSettings?.[currentImageIndex]

  const nextImage = () => {
    if (imageSettings && imageSettings.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % imageSettings.length)
    }
  }

  const prevImage = () => {
    if (imageSettings && imageSettings.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + imageSettings.length) % imageSettings.length)
    }
  }

  const getAspectRatio = () => {
    switch (formData.placement) {
      case "homepage-carousel":
        return "aspect-[16/6]"
      default:
        return "aspect-[16/6]"
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-xl font-bold text-gray-900">
            <Eye className="h-5 w-5" />
            <span>Live Preview</span>
          </CardTitle>
          <CardDescription className="text-gray-600">
            Exactly how your banner will appear to customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Live Banner Preview */}
            <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-200">
              <p className="text-xs text-gray-500 mb-3 text-center">
                {formData.placement && getPlacementLabel(formData.placement)} Preview
              </p>

              {/* Marquee Banner Preview */}
              {isMarqueeBanner ? (
                <div className="space-y-4">
                  {/* Top of page preview */}
                  <div className="bg-gray-900 text-white py-2 px-4 rounded-lg overflow-hidden">
                    <p className="text-xs text-gray-400 mb-2">Top of page preview:</p>
                    <div className="relative">
                      <div className="flex animate-marquee whitespace-nowrap">
                        {formData.marqueeItems && formData.marqueeItems.length > 0 ? (
                          formData.marqueeItems.map((item, index) => (
                            <span key={item.id} className="text-white text-sm mx-8 flex items-center">
                              {item.icon && ICON_COMPONENTS[item.icon] && (
                                <div className="mr-2">
                                  {(() => {
                                    const IconComponent = ICON_COMPONENTS[item.icon]
                                    return <IconComponent className="w-4 h-4 text-white" />
                                  })()}
                                </div>
                              )}
                              {item.text}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">No marquee messages added</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Browser-like preview */}
                  <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                    <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                      <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-gray-600">
                        https://yourstore.com
                      </div>
                    </div>

                    {/* Marquee at top of browser */}
                    <div className="bg-gray-900 text-white py-2 overflow-hidden">
                      <div className="flex animate-marquee whitespace-nowrap">
                        {formData.marqueeItems && formData.marqueeItems.length > 0 ? (
                          formData.marqueeItems.map((item, index) => (
                            <span key={item.id} className="text-white text-xs mx-6 flex items-center">
                              {item.icon && ICON_COMPONENTS[item.icon] && (
                                <div className="mr-2">
                                  {(() => {
                                    const IconComponent = ICON_COMPONENTS[item.icon]
                                    return <IconComponent className="w-3 h-3 text-white" />
                                  })()}
                                </div>
                              )}
                              {item.text}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">Add marquee messages to see preview</span>
                        )}
                      </div>
                    </div>

                    {/* Fake website content */}
                    <div className="p-6 bg-white">
                      <div className="text-center">
                        <div className="h-8 bg-gray-200 rounded mb-4 w-48 mx-auto"></div>
                        <div className="h-4 bg-gray-100 rounded mb-2 w-64 mx-auto"></div>
                        <div className="h-4 bg-gray-100 rounded w-56 mx-auto"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : currentImageSetting ? (
                <div className="relative group">
                  {/* Banner Image - Clickable */}
                  <div
                    className={`relative ${getAspectRatio()} w-full bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-95 transition-opacity`}
                    onClick={() => {
                      // Simulate click action
                      alert(`Banner clicked! Would redirect to: ${currentImageSetting.actionTarget}`)
                    }}
                  >
                    <img
                      src={URL.createObjectURL(currentImageSetting.file)}
                      alt={`Banner ${currentImageIndex + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {/* Category Banner Text Overlay - Center Bottom */}

                    {/* Carousel Banner Text Overlay */}
                    {currentImageSetting.titleText && (
                      <div className="absolute top-4 left-4 bg-black/70 text-white px-4 py-2 rounded-lg">
                        <h3 className="text-lg font-bold">{currentImageSetting.titleText}</h3>
                      </div>
                    )}

                    {/* CTA Button for Carousel */}
                    {currentImageSetting.ctaText && (
                      <div className="absolute bottom-4 left-4">
                        <Button className="bg-red-600 hover:bg-red-700 text-white shadow-lg">
                          {currentImageSetting.ctaText}
                        </Button>
                      </div>
                    )}

                    {/* Click indicator overlay */}
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="bg-white/90 px-3 py-2 rounded-lg shadow-lg flex items-center space-x-2">
                        <ExternalLink className="w-4 h-4 text-gray-700" />
                        <span className="text-sm font-medium text-gray-700">
                          Click to visit: {currentImageSetting.actionName || currentImageSetting.actionTarget}
                        </span>
                      </div>
                    </div>

                    {/* Carousel Navigation */}
                    {isCarousel && imageSettings && imageSettings.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            prevImage()
                          }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronLeft className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            nextImage()
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronRight className="w-4 h-4 text-gray-700" />
                        </button>

                        {/* Carousel Dots */}
                        <div className="absolute bottom-4 right-4 flex space-x-2">
                          {imageSettings.map((_, index) => (
                            <button
                              key={index}
                              onClick={(e) => {
                                e.stopPropagation()
                                setCurrentImageIndex(index)
                              }}
                              className={`w-2 h-2 rounded-full transition-all ${index === currentImageIndex
                                ? 'bg-white shadow-lg'
                                : 'bg-white/60 hover:bg-white/80'
                                }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Image Counter for Carousel */}
                  {isCarousel && imageSettings && imageSettings.length > 1 && (
                    <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      {currentImageIndex + 1} / {imageSettings.length}
                    </div>
                  )}
                </div>
              ) : (
                <div className={`${getAspectRatio()} w-full bg-gray-200 rounded-lg flex items-center justify-center`}>
                  <div className="text-center">
                    <Image className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">No image uploaded</p>
                  </div>
                </div>
              )}

              {/* Action Info */}
              {currentImageSetting?.actionType && currentImageSetting?.actionTarget && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <ExternalLink className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Clicking this {isCarousel ? 'slide' : 'banner'} will {getActionLabel(currentImageSetting.actionType as ActionType).toLowerCase()}:
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1 font-mono bg-blue-100 px-2 py-1 rounded">
                    {currentImageSetting.actionTarget}
                  </p>
                  {isCarousel && imageSettings && imageSettings.length > 1 && (
                    <p className="text-xs text-blue-600 mt-2">
                      Use the navigation arrows above to preview other slides and their actions.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Enhanced Summary Cards */}
            <div className="grid gap-6 lg:grid-cols-2 w-full">
              {/* Banner Details Card */}
              <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Image className="w-4 h-4 text-blue-600" />
                    </div>
                    <span>Banner Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Internal Title</span>
                      <span className="text-sm font-semibold text-gray-900 max-w-[200px] truncate">
                        {formData.internalTitle}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Placement</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                        {formData.placement && getPlacementLabel(formData.placement)}
                      </Badge>
                    </div>
                    {formData.category && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Category</span>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 capitalize">
                          {formData.category}
                        </Badge>
                      </div>
                    )}
                    {formData.bannerTitle && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Banner Title</span>
                        <span className="text-sm font-semibold text-gray-900 max-w-[200px] truncate">
                          {formData.bannerTitle}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Action & Status Card */}
              <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <ExternalLink className="w-4 h-4 text-green-600" />
                    </div>
                    <span>{isMarqueeBanner ? "Messages & Status" : "Action & Status"}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {isMarqueeBanner ? (
                      <>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">Total Messages</span>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {formData.marqueeItems?.length || 0} / 6
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">Display Location</span>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900">Top of All Pages</div>
                            <div className="text-xs text-gray-500">Scrolling marquee banner</div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">Click Action</span>
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            {formData.actionType && getActionLabel(formData.actionType)}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">Target</span>
                          <span className="text-sm font-mono text-gray-900 max-w-[200px] truncate bg-gray-100 px-2 py-1 rounded">
                            {formData.actionTarget}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-sm font-medium text-green-700">Status</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <Badge className="bg-green-100 text-green-800 border-green-300 hover:bg-green-100">
                          Ready to Publish
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}