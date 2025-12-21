"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ProgressSteps } from "@/domains/admin/banner-creation/progress-steps"
import { PlacementStep } from "@/domains/admin/banner-creation/placement-step"
import { ContentStep } from "@/domains/admin/banner-creation/content-step"
import { PreviewStep } from "@/domains/admin/banner-creation/preview-step"

// Types
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
  imageUrl?: string
  ctaText?: string
  position?: number
  category?: string
  actionType?: ActionType
  actionTarget: string
  actionName: string
  startDate?: string
  endDate?: string
}

export default function CreateBannerPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<BannerFormData>({
    internalTitle: "",
    actionTarget: "",
    actionName: ""
  })

  const isCategoryBanner = formData.placement === "category-banner"
  const isMarqueeBanner = formData.placement === "top-marquee-banner"
  // Consolidated flow: Placement -> Content (includes Action) -> Preview
  const totalSteps = 3

  const updateFormData = (updates: Partial<BannerFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/admin/banners/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to upload image')
    }

    const data = await response.json()
    return data.url
  }

  const handleSubmit = async (isDraft = false) => {
    try {
      setIsLoading(true)

      // Validate required fields
      const isCarousel = formData.placement === "homepage-carousel" || formData.placement === "product-listing-carousel"

      if (!formData.placement || !formData.internalTitle) {
        toast.error('Please fill in all required fields')
        return
      }

      // Validate marquee banners
      if (isMarqueeBanner) {
        if (!formData.marqueeItems || formData.marqueeItems.length === 0) {
          toast.error('Please add at least one marquee message')
          return
        }
        const hasEmptyMessages = formData.marqueeItems.some(item => !item.text.trim())
        if (hasEmptyMessages) {
          toast.error('All marquee messages must have text')
          return
        }
      } else {
        // Validate image banners
        const hasRequiredImages = isCarousel
          ? (formData.imageSettings && formData.imageSettings.length > 0)
          : formData.bannerImage

        if (!hasRequiredImages) {
          toast.error('Please upload banner image(s)')
          return
        }

        // Validate carousel images have action targets
        if (isCarousel && formData.imageSettings) {
          const missingActions = formData.imageSettings.some(setting => !setting.actionType || !setting.actionTarget)
          if (missingActions) {
            toast.error('Please set action targets for all carousel images')
            return
          }
        } else if (!isCarousel && !isCategoryBanner && (!formData.actionType || !formData.actionTarget)) {
          toast.error('Please set the banner action target')
          return
        } else if (isCategoryBanner && !formData.category) {
          toast.error('Please select a category for the banner')
          return
        }
      }

      // Upload images and prepare data
      let bannerData: any

      if (isMarqueeBanner) {
        // For marquee banner, no images to upload
        bannerData = {
          internal_title: formData.internalTitle,
          placement: formData.placement,
          marquee_data: JSON.stringify(formData.marqueeItems),
          status: isDraft ? 'disabled' : 'active',
        }
      } else if (isCarousel && formData.imageSettings) {
        // For carousel, upload all images and store complete settings
        const carouselData = await Promise.all(
          formData.imageSettings.map(async (setting) => ({
            image_url: await uploadImage(setting.file),
            title_text: setting.titleText || null,
            cta_text: setting.ctaText || null,
            action_type: setting.actionType,
            action_target: setting.actionTarget,
            action_name: setting.actionName || setting.actionTarget
          }))
        )

        bannerData = {
          internal_title: formData.internalTitle,
          placement: formData.placement,
          carousel_data: JSON.stringify(carouselData),
          start_date: formData.startDate,
          end_date: formData.endDate,
          category: formData.category,
          status: isDraft ? 'disabled' : 'active',
        }
      } else if (formData.bannerImage) {
        // For single banner, upload single image
        const imageUrl = await uploadImage(formData.bannerImage)

        bannerData = {
          internal_title: formData.internalTitle,
          image_url: imageUrl,
          placement: formData.placement,
          action_type: formData.actionType,
          action_target: formData.actionTarget,
          action_name: formData.actionName || formData.actionTarget,
          start_date: formData.startDate,
          end_date: formData.endDate,
          position: formData.position,
          category: formData.category,
          cta_text: formData.ctaText,
          status: isDraft ? 'disabled' : 'active',
        }
      } else if (!isMarqueeBanner) {
        throw new Error('No images to upload')
      }

      // Create banner
      const response = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bannerData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create banner')
      }

      toast.success(isDraft ? 'Banner saved as draft' : 'Banner published successfully!')
      router.push('/admin/banners')
    } catch (error) {
      console.error('Error creating banner:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create banner')
    } finally {
      setIsLoading(false)
    }
  }

  const canProceedToStep = (step: number): boolean => {
    const isCarousel = formData.placement === "homepage-carousel" || formData.placement === "product-listing-carousel"
    const hasImages = isCarousel
      ? (formData.bannerImages && formData.bannerImages.length > 0)
      : !!formData.bannerImage

    // Check if actions are set (based on placement type)
    const hasActions = isCarousel
      ? (formData.imageSettings && formData.imageSettings.every(s => s.actionType && s.actionTarget))
      : isCategoryBanner
        ? !!formData.category
        : (!!formData.actionType && !!formData.actionTarget)

    if (isMarqueeBanner) {
      // Marquee flow: Placement -> Content -> Preview
      switch (step) {
        case 2: return !!formData.placement
        case 3: return !!(formData.placement && formData.internalTitle && formData.marqueeItems && formData.marqueeItems.length > 0)
        default: return true
      }
    } else {
      // Standard flow: Placement -> Content (w/ Action) -> Preview
      switch (step) {
        case 2: return !!formData.placement
        case 3: return !!(formData.placement && formData.internalTitle && hasImages && hasActions)
        default: return true
      }
    }
  }

  const getStepTitle = (step: number): string => {
    const titles = ["Placement", "Banner Content", "Preview & Save"]
    return titles[step - 1] || ""
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 truncate">
              Create Banner
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2 truncate">
              Step {currentStep} of {totalSteps}: {getStepTitle(currentStep)}
            </p>
          </div>
          <div className="flex items-center space-x-3 flex-shrink-0">
            <Button variant="outline" asChild>
              <Link href="/admin/banners">Cancel</Link>
            </Button>
          </div>
        </div>

        {/* Progress Steps */}
        <ProgressSteps
          currentStep={currentStep}
          totalSteps={totalSteps}
          bannerType={
            isMarqueeBanner ? "marquee" :
              isCategoryBanner ? "category" :
                "carousel"
          }
        />

        {/* Step Content */}
        {currentStep === 1 && (
          <PlacementStep
            selectedPlacement={formData.placement}
            onPlacementChange={(placement) => updateFormData({ placement })}
          />
        )}

        {/* Content Step */}
        {currentStep === 2 && formData.placement && (
          <ContentStep
            placement={formData.placement}
            formData={formData}
            onFormDataChange={updateFormData}
          />
        )}

        {/* Action Step - REMOVED (Merged into ContentStep) */}

        {/* Preview Step */}
        {currentStep === 3 && (
          <PreviewStep formData={formData} />
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            Previous
          </Button>

          {/* Show publish buttons on final step, otherwise show Next button */}
          {currentStep === totalSteps ? (
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => handleSubmit(true)}
                disabled={isLoading}
              >
                Save as Draft
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25"
                onClick={() => handleSubmit(false)}
                disabled={isLoading}
              >
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "Publishing..." : "Publish Banner"}
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
              disabled={!canProceedToStep(currentStep + 1)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}