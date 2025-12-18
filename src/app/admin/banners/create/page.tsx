"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"
import Link from "next/link"
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
  ctaText?: string
  position?: number
  category?: string
  actionType?: ActionType
  actionTarget: string
}

export default function CreateBannerPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<BannerFormData>({
    internalTitle: "",
    actionTarget: ""
  })

  const updateFormData = (updates: Partial<BannerFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const handleSubmit = async (isDraft = false) => {
    setIsLoading(true)
    // TODO: Implement banner creation
    console.log("Creating banner:", { ...formData, isDraft })
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsLoading(false)
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
            onActionTypeChange={(actionType) => updateFormData({ actionType })}
            onActionTargetChange={(actionTarget) => updateFormData({ actionTarget })}
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