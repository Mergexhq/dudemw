"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ProgressSteps, BasicInfoStep, MediaStep, BannerStep, PreviewStep, ProductSelectionStep } from "@/domains/admin/category-creation"
import { CategoryService } from '@/lib/services/categories'
import { BannerService } from '@/lib/services/banners'
import { createCategoryAction } from '@/lib/actions/categories'
import type { SelectedProduct } from "@/domains/admin/category-creation/types"

interface BannerOption {
  id: string
  internal_title: string
  image_url: string | null
  placement: string
  status: string
}

interface CategoryFormData {
  name: string
  slug: string
  description: string
  parent_id: string
  // Homepage category display
  homepage_thumbnail_url: string
  homepage_video_url: string
  // PLP square category lite thumbnail
  plp_square_thumbnail_url: string
  // File objects (stored temporarily, uploaded on publish)
  homepage_thumbnail_file?: File
  homepage_video_file?: File
  plp_square_thumbnail_file?: File
  // Banner options
  banner_source: 'none' | 'existing' | 'create'
  selected_banner_id: string
  // SEO
  meta_title: string
  meta_description: string
  status: 'active' | 'inactive'
  display_order: number
}

export default function CreateCategoryPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [availableBanners, setAvailableBanners] = useState<BannerOption[]>([])
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    slug: "",
    description: "",
    parent_id: "",
    homepage_thumbnail_url: "",
    homepage_video_url: "",
    plp_square_thumbnail_url: "",
    banner_source: 'none',
    selected_banner_id: "",
    meta_title: "",
    meta_description: "",
    status: 'active',
    display_order: 0
  })

  const [selectedProducts, setSelectedProducts] = useState<Map<string, SelectedProduct>>(new Map())

  const totalSteps = 5

  // Load available banners
  useEffect(() => {
    const loadBanners = async () => {
      try {
        const result = await BannerService.getBanners({
          placement: 'category-banner',
          status: 'active'
        })
        if (result.success && result.data) {
          setAvailableBanners(result.data || [])
        }
      } catch (error) {
        console.error('Error loading banners:', error)
      }
    }
    loadBanners()
  }, [])

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

  const handleCreateBanner = () => {
    // Navigate to banner creation with category context
    router.push('/admin/banners/create?context=category&category_name=' + encodeURIComponent(formData.name))
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

      if (!formData.description.trim()) {
        toast.error('Please enter a category description')
        return
      }

      // Check if we have either uploaded URLs or files to upload
      const hasHomepageThumbnail = formData.homepage_thumbnail_url || formData.homepage_thumbnail_file
      const hasPlpSquareThumbnail = formData.plp_square_thumbnail_url || formData.plp_square_thumbnail_file

      if (!hasHomepageThumbnail) {
        toast.error('Please upload a homepage thumbnail')
        return
      }

      if (!hasPlpSquareThumbnail) {
        toast.error('Please upload a PLP square thumbnail')
        return
      }

      // Upload files if they exist
      let homepage_thumbnail_url = formData.homepage_thumbnail_url
      let homepage_video_url = formData.homepage_video_url
      let plp_square_thumbnail_url = formData.plp_square_thumbnail_url

      // Upload homepage thumbnail if file exists
      if (formData.homepage_thumbnail_file) {
        toast.info('Uploading homepage thumbnail...')
        const result = await CategoryService.uploadImage(formData.homepage_thumbnail_file, 'image')
        if (result.success && result.url) {
          homepage_thumbnail_url = result.url
        } else {
          toast.error(result.error || 'Failed to upload homepage thumbnail')
          return
        }
      }

      // Upload homepage video if file exists
      if (formData.homepage_video_file) {
        toast.info('Uploading homepage video...')
        const result = await CategoryService.uploadImage(formData.homepage_video_file, 'image')
        if (result.success && result.url) {
          homepage_video_url = result.url
        } else {
          toast.error(result.error || 'Failed to upload homepage video')
          return
        }
      }

      // Upload PLP square thumbnail if file exists
      if (formData.plp_square_thumbnail_file) {
        toast.info('Uploading PLP square thumbnail...')
        const result = await CategoryService.uploadImage(formData.plp_square_thumbnail_file, 'image')
        if (result.success && result.url) {
          plp_square_thumbnail_url = result.url
        } else {
          toast.error(result.error || 'Failed to upload PLP square thumbnail')
          return
        }
      }

      const categoryData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        parent_id: formData.parent_id || null,
        homepage_thumbnail_url: homepage_thumbnail_url || null,
        homepage_video_url: homepage_video_url || null,
        plp_square_thumbnail_url: plp_square_thumbnail_url || null,
        selected_banner_id: formData.banner_source === 'existing' ? formData.selected_banner_id : null,
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
        return !!formData.name.trim() && !!formData.description.trim()
      case 3:
        const hasHomepageThumbnail = !!formData.homepage_thumbnail_url || !!formData.homepage_thumbnail_file
        const hasPlpSquareThumbnail = !!formData.plp_square_thumbnail_url || !!formData.plp_square_thumbnail_file
        return !!formData.name.trim() && !!formData.description.trim() &&
          hasHomepageThumbnail && hasPlpSquareThumbnail
      case 4:
        return true // Product selection is optional
      case 5:
        const hasHomepageThumbnail3 = !!formData.homepage_thumbnail_url || !!formData.homepage_thumbnail_file
        const hasPlpSquareThumbnail3 = !!formData.plp_square_thumbnail_url || !!formData.plp_square_thumbnail_file
        return !!formData.name.trim() && !!formData.description.trim() &&
          hasHomepageThumbnail3 && hasPlpSquareThumbnail3
      default:
        return true
    }
  }

  const getStepTitle = (step: number): string => {
    const titles = ["Basic Information", "Media Assets", "Banner Settings", "Select Products", "Preview & Save"]
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
          <BannerStep
            formData={formData}
            availableBanners={availableBanners}
            onFormDataChange={updateFormData}
            onCreateBanner={handleCreateBanner}
          />
        )}

        {currentStep === 4 && (
          <ProductSelectionStep
            selectedProducts={selectedProducts}
            onProductsChange={handleProductsChange}
          />
        )}

        {currentStep === 5 && (
          <PreviewStep
            formData={formData}
            availableBanners={availableBanners}
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