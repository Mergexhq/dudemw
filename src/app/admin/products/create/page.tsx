"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"
import Link from "next/link"
import { createProduct } from "@/lib/actions/products"
import { ProductTabs } from "@/domains/admin/product-creation/product-tabs"
import { ProductPreview } from "@/domains/admin/product-creation/product-preview"
import { toast } from "sonner"

// Import the tab components with correct names
import { GeneralTab } from "@/domains/admin/product-creation/general-tab"
import { MediaTab } from "@/domains/admin/product-creation/media-tab"
import { PricingTab } from "@/domains/admin/product-creation/pricing-tab"
import { VariantsTab } from "@/domains/admin/product-creation/variants-tab"
import { InventoryTab } from "@/domains/admin/product-creation/inventory-tab"
import { OrganizationTab } from "@/domains/admin/product-creation/organization-tab"
import { SEOTab } from "@/domains/admin/product-creation/seo-tab"

// Types
interface ProductImage {
  id: string
  url: string
  alt: string
  isPrimary: boolean
}

interface VariantOption {
  id: string
  name: string
  type: 'color' | 'size' | 'custom'
  values: {
    id: string
    name: string
    hexColor?: string
    sizeType?: 'numbers' | 'letters' | 'custom'
  }[]
}

interface ProductVariant {
  id: string
  name: string
  sku: string
  price: string
  mrp: string
  stock: string
  active: boolean
  combinations: { [optionId: string]: string }
}

type VariantMode = 'single' | 'variants'

interface ProductFormData {
  // General
  name: string
  subtitle: string
  description: string
  highlights: string[]
  status: "draft" | "published" | "archived"

  // Media
  images: ProductImage[]

  // Variant Mode
  variantMode: VariantMode

  // Pricing
  price: string
  comparePrice: string
  taxable: boolean

  // Variants
  options: VariantOption[]
  variants: ProductVariant[]

  // Inventory
  trackInventory: boolean
  allowBackorders: boolean
  lowStockThreshold: string
  globalStock: string

  // Organization
  categories: string[]
  collections: string[]
  tags: string[]

  // SEO
  metaTitle: string
  metaDescription: string
  urlHandle: string
}

export default function CreateProductPage() {
  const [activeTab, setActiveTab] = useState("general")
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<ProductFormData>({
    // General
    name: "",
    subtitle: "",
    description: "",
    highlights: [],
    status: "draft",

    // Media
    images: [],

    // Variant Mode
    variantMode: "single",

    // Pricing
    price: "",
    comparePrice: "",
    taxable: false,

    // Variants
    options: [],
    variants: [],

    // Inventory
    trackInventory: true,
    allowBackorders: false,
    lowStockThreshold: "5",
    globalStock: "0",

    // Organization
    categories: [],
    collections: [],
    tags: [],

    // SEO
    metaTitle: "",
    metaDescription: "",
    urlHandle: ""
  })

  const updateFormData = (updates: Partial<ProductFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const handleSubmit = async (isDraft = false) => {
    setIsLoading(true)
    try {
      // Helper function to parse float or return undefined
      const parseNumberValue = (value: string): number | undefined => {
        if (!value || value.trim() === '') return undefined
        const parsed = parseFloat(value)
        return !isNaN(parsed) ? parsed : undefined
      }

      // Helper function to parse integer or return undefined  
      const parseIntValue = (value: string): number | undefined => {
        if (!value || value.trim() === '') return undefined
        const parsed = Number.parseInt(value, 10)
        return !isNaN(parsed) ? parsed : undefined
      }

      const productData = {
        // General
        title: formData.name,
        subtitle: formData.subtitle,
        description: formData.description,
        highlights: formData.highlights,
        status: isDraft ? 'draft' as const : 'published' as const,

        // Pricing - Only include if in single mode AND has valid value
        price: formData.variantMode === 'single' ? parseNumberValue(formData.price) : undefined,
        compare_price: formData.variantMode === 'single' ? parseNumberValue(formData.comparePrice) : undefined,
        taxable: formData.taxable,

        // Inventory
        track_inventory: formData.trackInventory,
        allow_backorders: formData.allowBackorders,
        low_stock_threshold: parseIntValue(formData.lowStockThreshold) || 5,
        global_stock: formData.variantMode === 'single' ? (parseIntValue(formData.globalStock) ?? 0) : undefined,

        // SEO
        meta_title: formData.metaTitle,
        meta_description: formData.metaDescription,
        url_handle: formData.urlHandle,

        // Images
        images: formData.images.map(img => ({
          url: img.url,
          alt: img.alt,
          isPrimary: img.isPrimary
        })),

        // Options and Variants
        options: formData.options.map(option => ({
          name: option.name,
          values: option.values.map(value => ({
            name: value.name,
            hexColor: value.hexColor
          }))
        })),
        variants: formData.variants.map(variant => ({
          name: variant.name,
          sku: variant.sku,
          price: parseFloat(variant.price) || 0,
          comparePrice: parseFloat(variant.mrp) || undefined,
          stock: parseInt(variant.stock) || 0,
          active: variant.active,
          combinations: variant.combinations
        })),

        // Organization
        categoryIds: formData.categories,
        collectionIds: formData.collections,
        tags: formData.tags
      }

      console.log('=== Submitting Product Data ===')
      console.log('Mode:', formData.variantMode)
      console.log('Price:', productData.price)
      console.log('Global Stock:', productData.global_stock)
      console.log('Full data:', productData)

      const result = await createProduct(productData)
      if (result.success) {
        toast.success('Product created successfully!', {
          description: 'Redirecting to products list...'
        })
        // Redirect to products list or show success message
        setTimeout(() => {
          window.location.href = '/admin/products'
        }, 1000)
      } else {
        console.error('Failed to create product:', result.error)
        toast.error('Failed to create product', {
          description: result.error || 'Please check all fields and try again.'
        })
      }
    } catch (error) {
      console.error('Error creating product:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      toast.error('Error creating product', {
        description: errorMessage
      })
    } finally {
      setIsLoading(false)
    }
  }

  const canPublish = () => {
    // Validate all required fields and show specific error messages
    if (!formData.name || formData.name.trim().length < 3) {
      return false
    }
    if (!formData.description || formData.description.trim().length < 10) {
      return false
    }
    if (formData.images.length === 0) {
      return false
    }
    // Check pricing based on mode
    if (formData.variantMode === 'single') {
      if (!formData.price || parseFloat(formData.price) <= 0) {
        return false
      }
    } else {
      if (formData.variants.length === 0) {
        return false
      }
    }
    return true
  }

  const getPublishErrorMessage = () => {
    if (!formData.name || formData.name.trim().length < 3) {
      return 'Product name must be at least 3 characters'
    }
    if (!formData.description || formData.description.trim().length < 10) {
      return 'Description must be at least 10 characters'
    }
    if (formData.images.length === 0) {
      return 'At least one product image is required'
    }
    if (formData.variantMode === 'single' && (!formData.price || parseFloat(formData.price) <= 0)) {
      return 'Valid price is required'
    }
    if (formData.variantMode === 'variants' && formData.variants.length === 0) {
      return 'At least one variant is required'
    }
    return null
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">
              Add Product
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2">
              Create a new product for your store
            </p>
          </div>
          <div className="flex items-center space-x-3 flex-shrink-0">
            <Button variant="outline" asChild>
              <Link href="/admin/products">Cancel</Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSubmit(true)}
              disabled={isLoading}
            >
              Save as Draft
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25"
              onClick={() => {
                const errorMsg = getPublishErrorMessage()
                if (errorMsg) {
                  toast.error('Cannot publish product', {
                    description: errorMsg
                  })
                } else {
                  handleSubmit(false)
                }
              }}
              disabled={isLoading || !canPublish()}
            >
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <ProductTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main Content */}
        <div className="grid gap-6 lg:gap-8 lg:grid-cols-4 w-full">
          <div className="lg:col-span-3 min-w-0 w-full">
            {activeTab === "general" && (
              <GeneralTab
                formData={{
                  name: formData.name,
                  subtitle: formData.subtitle,
                  description: formData.description,
                  highlights: formData.highlights,
                  status: formData.status
                }}
                onFormDataChange={(updates: Partial<ProductFormData>) => updateFormData(updates)}
              />
            )}

            {activeTab === "media" && (
              <MediaTab
                images={formData.images}
                onImagesChange={(images: ProductImage[]) => updateFormData({ images })}
              />
            )}

            {activeTab === "pricing" && (
              <PricingTab
                pricingData={{
                  price: formData.price,
                  comparePrice: formData.comparePrice,
                  taxable: formData.taxable
                }}
                onPricingDataChange={(updates) => updateFormData(updates)}
                hasVariants={formData.variants.length > 0}
                variantCount={formData.variants.length}
              />
            )}

            {activeTab === "variants" && (
              <VariantsTab
                options={formData.options}
                variants={formData.variants}
                variantMode={formData.variantMode}
                onOptionsChange={(options) => updateFormData({ options })}
                onVariantsChange={(variants) => updateFormData({ variants })}
                onVariantModeChange={(variantMode) => updateFormData({ variantMode })}
              />
            )}

            {activeTab === "inventory" && (
              <InventoryTab
                inventoryData={{
                  trackInventory: formData.trackInventory,
                  allowBackorders: formData.allowBackorders,
                  lowStockThreshold: formData.lowStockThreshold,
                  globalStock: formData.globalStock
                }}
                onInventoryDataChange={(updates) => updateFormData(updates)}
                hasVariants={formData.variants.length > 0}
                variantCount={formData.variants.length}
              />
            )}

            {activeTab === "organization" && (
              <OrganizationTab
                organizationData={{
                  categories: formData.categories,
                  collections: formData.collections,
                  tags: formData.tags
                }}
                onOrganizationDataChange={(updates) => updateFormData(updates)}
              />
            )}

            {activeTab === "seo" && (
              <SEOTab
                seoData={{
                  metaTitle: formData.metaTitle,
                  metaDescription: formData.metaDescription,
                  urlHandle: formData.urlHandle
                }}
                onSEODataChange={(updates) => updateFormData(updates)}
                productName={formData.name}
                productDescription={formData.description}
              />
            )}
          </div>

          {/* Product Preview - Always Visible */}
          <div className="lg:col-span-1 min-w-0 w-full">
            <ProductPreview
              productName={formData.name}
              productSubtitle={formData.subtitle}
              price={formData.price}
              comparePrice={formData.comparePrice}
              images={formData.images}
              status={formData.status}
              hasVariants={formData.variants.length > 0}
              variantCount={formData.variants.length}
            />
          </div>
        </div>
      </div>
    </div>
  )
}