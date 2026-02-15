"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ProgressSteps, BasicInfoStep, MediaStep, PreviewStep, ProductSelectionStep } from "@/domains/admin/category-creation"
import { CategoryService } from '@/lib/services/categories'
import { createCategoryAction } from '@/lib/actions/categories'
import type { SelectedProduct } from "@/domains/admin/category-creation/types"

interface CategoryFormData {
  name: string
  slug: string
  image_url: string
  image_file?: File
  meta_title: string
  meta_description: string
  status: 'active' | 'inactive'
  display_order: number
}

export default function CreateCategoryPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    slug: "",
    image_url: "",
    meta_title: "",
    meta_description: "",
    status: 'active',
    display_order: 0
  })

  const [selectedProducts, setSelectedProducts] = useState<Map<string, SelectedProduct>>(new Map())

  const totalSteps = 4

  const updateFormData = (updates: Partial<CategoryFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleNameChange = (name: string) => {
    updateFormData({
      name,
      slug: generateSlug(name)
    })
  }

  const handleProductsChange = (products: Map<string, SelectedProduct>) => {
    setSelectedProducts(products)
  }

  const handleSubmit = async (isDraft = false) => {
    try {
      setIsLoading(true)

      // Validate required fields
      if (!formData.name.trim()) {
        toast.error('Please enter a category name')
        return
      }

      // Check if we have either uploaded URL or file to upload
      const hasImage = formData.image_url || formData.image_file

      if (!hasImage) {
        toast.error('Please upload a category image')
        return
      }

      // Upload file if it exists
      let image_url = formData.image_url

      if (formData.image_file) {
        toast.info('Uploading category image...')
        const result = await CategoryService.uploadImage(formData.image_file, 'image')
        if (result.success && result.url) {
          image_url = result.url
        } else {
          toast.error(result.error || 'Failed to upload category image')
          return
        }
      }

      const categoryData = {
        name: formData.name,
        slug: formData.slug,
        image_url: image_url || null,
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
        status: isDraft ? 'inactive' : formData.status,
        display_order: formData.display_order,
        product_ids: Array.from(selectedProducts.keys())
      }

      const result = await createCategoryAction(categoryData)

      if (result.success) {
        toast.success(
          isDraft
            ? 'Category saved as draft'
            : 'Category created successfully'
        )
        router.push('/admin/categories')
      } else {
        toast.error(result.error || 'Failed to create category')
      }
    } catch (error: any) {
      console.error('Error creating category:', error)
      toast.error(error.message || 'Failed to create category')
    } finally {
      setIsLoading(false)
    }
  }

  const canProceedToStep = (step: number): boolean => {
    switch (step) {
      case 2:
        return !!formData.name.trim()
      case 3:
        const hasImage = !!formData.image_url || !!formData.image_file
        return !!formData.name.trim() && hasImage
      case 4:
        const hasImage2 = !!formData.image_url || !!formData.image_file
        return !!formData.name.trim() && hasImage2
      default:
        return true
    }
  }

  const getStepTitle = (step: number): string => {
    const titles = ["Basic Information", "Media Assets", "Select Products", "Preview & Save"]
    return titles[step - 1] || ""
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 truncate">
              Create Category
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2 truncate">
              Step {currentStep} of {totalSteps}: {getStepTitle(currentStep)}
            </p>
          </div>
          <div className="flex items-center space-x-3 flex-shrink-0">
            <Button variant="outline" asChild>
              <Link href="/admin/categories">Cancel</Link>
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
            onNameChange={handleNameChange}
            onFormDataChange={updateFormData}
          />
        )}

        {currentStep === 2 && (
          <MediaStep
            formData={formData}
            onFormDataChange={updateFormData}
          />
        )}

        {currentStep === 3 && (
          <ProductSelectionStep
            selectedProducts={selectedProducts}
            onProductsChange={handleProductsChange}
          />
        )}

        {currentStep === 4 && (
          <PreviewStep
            formData={formData}
          />
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
                {isLoading ? "Creating..." : "Create Category"}
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