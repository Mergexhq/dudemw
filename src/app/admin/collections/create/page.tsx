"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ProgressSteps, BasicInfoStep, ProductSelectionStep, PreviewStep, type Product, type CollectionFormData } from "@/domains/admin/collection-creation"
import { createClient } from '@/lib/supabase/client'

export default function CreateCollectionPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<CollectionFormData>({
    title: "",
    description: "",
    is_active: true,
    selectedProducts: new Map()
  })

  const supabase = createClient()
  const totalSteps = 3

  const updateFormData = (updates: Partial<CollectionFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const handleTitleChange = (title: string) => {
    updateFormData({ title })
  }

  const handleSubmit = async (isDraft = false) => {
    try {
      setIsLoading(true)

      // Validate required fields
      if (!formData.title.trim()) {
        toast.error('Please enter a collection title')
        return
      }

      if (!formData.description.trim()) {
        toast.error('Please enter a collection description')
        return
      }

      if (formData.selectedProducts.size === 0) {
        toast.error('Please select at least one product for this collection')
        return
      }

      // Prepare products data for API
      const selectedProductsArray = Array.from(formData.selectedProducts.entries()).map(([productId, selectedProductWithVariant]) => ({
        productId: productId,
        selectedVariantId: selectedProductWithVariant.selectedVariantId
      }))

      // Create collection via API (uses supabaseAdmin to bypass RLS)
      const response = await fetch('/api/admin/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          is_active: isDraft ? false : formData.is_active,
          selectedProducts: selectedProductsArray
        })
      })

      const result = await response.json()

      if (!result.success) {
        console.error('Collection creation error:', result.error)
        throw new Error(result.error || 'Failed to create collection')
      }

      toast.success(
        isDraft
          ? `Collection saved as draft with ${formData.selectedProducts.size} products`
          : `Collection created successfully with ${formData.selectedProducts.size} products`
      )

      router.push('/admin/collections')
    } catch (error: any) {
      console.error('Error creating collection:', error)
      toast.error(error.message || 'Failed to create collection')
    } finally {
      setIsLoading(false)
    }
  }

  const canProceedToStep = (step: number): boolean => {
    switch (step) {
      case 2:
        return !!formData.title.trim() && !!formData.description.trim()
      case 3:
        return !!formData.title.trim() && !!formData.description.trim() && formData.selectedProducts.size > 0
      default:
        return true
    }
  }

  const getStepTitle = (step: number): string => {
    const titles = ["Basic Information", "Product Selection", "Preview & Save"]
    return titles[step - 1] || ""
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 truncate">
              Create Collection
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2 truncate">
              Step {currentStep} of {totalSteps}: {getStepTitle(currentStep)}
            </p>
          </div>
          <div className="flex items-center space-x-3 flex-shrink-0">
            <Button variant="outline" asChild>
              <Link href="/admin/collections">Cancel</Link>
            </Button>
          </div>
        </div>

        {/* Progress Steps */}
        <ProgressSteps
          currentStep={currentStep}
          totalSteps={totalSteps}
        />

        {/* Step Content */}
        {currentStep === 1 && (
          <BasicInfoStep
            formData={formData}
            onTitleChange={handleTitleChange}
            onFormDataChange={updateFormData}
          />
        )}

        {currentStep === 2 && (
          <ProductSelectionStep
            selectedProducts={formData.selectedProducts}
            onProductsChange={(selectedProducts) => updateFormData({ selectedProducts })}
          />
        )}

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
                {isLoading ? "Creating..." : "Create Collection"}
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