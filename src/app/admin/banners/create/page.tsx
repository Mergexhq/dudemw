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
import { ActionStep } from "@/domains/admin/banner-creation/action-step"
import { PreviewStep } from "@/domains/admin/banner-creation/preview-step"

// Types
type BannerPlacement = "homepage-carousel" | "product-listing-carousel" | "category-banner"
type ActionType = "collection" | "category" | "product" | "external"

interface BannerFormData {
  placement?: BannerPlacement
  internalTitle: string
  bannerImage?: File
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
      if (!formData.placement || !formData.internalTitle || !formData.bannerImage || !formData.actionType || !formData.actionTarget) {
        toast.error('Please fill in all required fields')
        return
      }

      // Upload image first
      const imageUrl = await uploadImage(formData.bannerImage)

      // Create banner
      const bannerData = {
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
    switch (step) {
      case 2:
        return !!formData.placement
      case 3:
        return !!formData.placement && !!formData.internalTitle
      case 4:
        return !!formData.placement && !!formData.internalTitle && !!formData.actionType && !!formData.actionTarget
      default:
        return true
    }
  }

  const getStepTitle = (step: number): string => {
    const titles = ["Placement", "Content Section", "Action Target", "Preview & Save"]
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
              Step {currentStep} of 4: {getStepTitle(currentStep)}
            </p>
          </div>
          <div className="flex items-center space-x-3 flex-shrink-0">
            <Button variant="outline" asChild>
              <Link href="/admin/banners">Cancel</Link>
            </Button>
            {currentStep === 4 && (
              <>
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
              </>
            )}
          </div>
        </div>

        {/* Progress Steps */}
        <ProgressSteps currentStep={currentStep} totalSteps={4} />

        {/* Step Content */}
        {currentStep === 1 && (
          <PlacementStep 
            selectedPlacement={formData.placement}
            onPlacementChange={(placement) => updateFormData({ placement })}
          />
        )}

        {currentStep === 2 && formData.placement && (
          <ContentStep 
            placement={formData.placement}
            formData={formData}
            onFormDataChange={updateFormData}
          />
        )}

        {currentStep === 3 && (
          <ActionStep 
            actionType={formData.actionType}
            actionTarget={formData.actionTarget}
            actionName={formData.actionName}
            onActionTypeChange={(actionType) => updateFormData({ actionType })}
            onActionTargetChange={(actionTarget) => updateFormData({ actionTarget })}
            onActionNameChange={(actionName) => updateFormData({ actionName })}
          />
        )}

        {currentStep === 4 && (
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
          <Button 
            onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
            disabled={!canProceedToStep(currentStep + 1) || currentStep === 4}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}