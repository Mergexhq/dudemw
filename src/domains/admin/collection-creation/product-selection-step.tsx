"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, X, Package, Search, ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import type { Product, SelectedProductWithVariant } from './types'

interface ProductVariant {
  id: string
  name: string | null
  sku: string
  price: number
  discount_price?: number | null
  stock: number
  active: boolean | null
  product: Product
}

interface ProductSelectionStepProps {
  selectedProducts: Map<string, SelectedProductWithVariant>
  onProductsChange: (products: Map<string, SelectedProductWithVariant>) => void
}

export function ProductSelectionStep({ selectedProducts, onProductsChange }: ProductSelectionStepProps) {
  const [loading, setLoading] = useState(false)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [availableVariants, setAvailableVariants] = useState<ProductVariant[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load all products when component mounts
  useEffect(() => {
    loadAllProducts()
  }, [])

  // Update available variants when products change
  useEffect(() => {
    const variants: ProductVariant[] = []
    allProducts.forEach(product => {
      if (product.product_variants) {
        product.product_variants.forEach(variant => {
          if (variant.active && !selectedProducts.has(product.id)) {
            variants.push({ ...variant, product: product })
          }
        })
      }
    })
    variants.sort((a, b) => a.sku.localeCompare(b.sku))
    setAvailableVariants(variants)
  }, [allProducts, selectedProducts])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadAllProducts = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/products/search?limit=1000&sortBy=title&sortOrder=asc')
      const result = await res.json()

      if (result.success) {
        setAllProducts(result.data || [])
      } else {
        toast.error('Failed to load products')
      }
    } catch (error) {
      console.error('Error loading products:', error)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }


  const addProduct = (variant: ProductVariant) => {
    const product = variant.product

    if (selectedProducts.has(product.id)) {
      toast.error('This product is already selected')
      return
    }

    const newSelected = new Map(selectedProducts)
    newSelected.set(product.id, {
      product: product,
      selectedVariantId: variant.id // Set the selected variant as default
    })
    onProductsChange(newSelected)

    // Clear search, close dropdown, and show success message
    setSearchQuery("")
    setIsDropdownOpen(false)
    toast.success(`Added "${product.title}" with SKU ${variant.sku}`)
  }

  const removeSelectedProduct = (productId: string) => {
    const newSelected = new Map(selectedProducts)
    newSelected.delete(productId)
    onProductsChange(newSelected)
  }

  const updateSelectedVariant = (productId: string, variantId: string) => {
    const selectedProduct = selectedProducts.get(productId)
    if (!selectedProduct) return

    const newSelected = new Map(selectedProducts)
    newSelected.set(productId, {
      ...selectedProduct,
      selectedVariantId: variantId
    })
    onProductsChange(newSelected)

    const variant = selectedProduct.product.product_variants?.find(v => v.id === variantId)
    if (variant) {
      toast.success(`Updated main SKU to ${variant.sku}`)
    }
  }

  const toggleProductExpansion = (productId: string) => {
    const newExpanded = new Set(expandedProducts)
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId)
    } else {
      newExpanded.add(productId)
    }
    setExpandedProducts(newExpanded)
  }

  // Filter variants based on search query
  const filteredVariants = availableVariants.filter(variant => {
    const query = searchQuery.toLowerCase()
    return (
      variant.product.title.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Select Products
          </CardTitle>
          <CardDescription>
            Choose which products to include in this collection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selected Products Count */}
          {selectedProducts.size > 0 && (
            <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
              <Package className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">
                {selectedProducts.size} product{selectedProducts.size !== 1 ? 's' : ''} selected
              </span>
            </div>
          )}

          {/* Product Search Dropdown */}
          <div className="space-y-4">
            <Label>Add Products</Label>
            <div className="relative" ref={dropdownRef}>
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder={loading ? "Loading products..." : "Search products by name..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsDropdownOpen(true)}
                  disabled={loading}
                  className="pl-10 pr-10 h-12 bg-white border-gray-300 focus:border-red-500 focus:ring-red-100"
                />
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Dropdown List */}
              {isDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      <span className="ml-2 text-sm text-gray-500">Loading products...</span>
                    </div>
                  ) : filteredVariants.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">
                        {searchQuery ? 'No products match your search' : 'No available products'}
                      </p>
                    </div>
                  ) : (
                    // Group variants by product to avoid duplicates
                    Array.from(
                      new Map(
                        filteredVariants.map(variant => [variant.product.id, variant])
                      ).values()
                    ).map(variant => {
                      const primaryImage = variant.product.product_images?.find(img => img.is_primary)
                      const variantCount = variant.product.product_variants?.filter(v => v.active)?.length || 0

                      return (
                        <button
                          key={variant.product.id}
                          type="button"
                          onClick={() => addProduct(variant)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-left transition-colors"
                        >
                          {/* Product Image - Square */}
                          {primaryImage ? (
                            <img
                              src={primaryImage.image_url}
                              alt={variant.product.title}
                              className="w-12 h-12 object-cover rounded border border-gray-200 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex-shrink-0 flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {variant.product.title}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                              <span>{variantCount} variant{variantCount !== 1 ? 's' : ''} available</span>
                              {variant.product.price && (
                                <>
                                  <span>•</span>
                                  <span className="text-green-600 font-medium">
                                    From ₹{variant.product.price.toFixed(2)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Search for products by name. Click to add, then select the main SKU in the accordion below.
            </p>
          </div>

          {/* Selected Products Display */}
          {selectedProducts.size > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Selected Products ({selectedProducts.size})</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onProductsChange(new Map())}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Clear All
                </Button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
                {Array.from(selectedProducts.values()).map(selectedProductWithVariant => {
                  const { product, selectedVariantId } = selectedProductWithVariant
                  const primaryImage = product.product_images?.find(img => img.is_primary)
                  const selectedVariant = product.product_variants?.find(v => v.id === selectedVariantId)
                  const displayPrice = selectedVariant ? (selectedVariant.discount_price || selectedVariant.price) : product.price
                  const hasMultipleVariants = product.product_variants && product.product_variants.length > 1
                  const isExpanded = expandedProducts.has(product.id)

                  return (
                    <div
                      key={product.id}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                    >
                      {/* Product Header */}
                      <div className="flex items-center gap-3 p-3">
                        {primaryImage ? (
                          <img
                            src={primaryImage.image_url}
                            alt={primaryImage.alt_text || product.title}
                            className="w-12 h-12 object-cover rounded border border-gray-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex-shrink-0 flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {product.title}
                          </p>
                          {displayPrice && (
                            <p className="text-sm font-medium text-green-600">
                              ₹{displayPrice.toFixed(2)}
                            </p>
                          )}
                          {/* Current selected SKU */}
                          {selectedVariant && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-mono bg-red-100 text-red-800 px-1.5 py-0.5 rounded">
                                {selectedVariant.sku}
                              </span>
                              <span className="text-xs text-red-700 font-medium">MAIN</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Accordion Toggle Button */}
                          {hasMultipleVariants && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleProductExpansion(product.id)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          )}

                          {/* Remove Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSelectedProduct(product.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Accordion Content - Variant Selection */}
                      {hasMultipleVariants && isExpanded && (
                        <div className="border-t border-gray-200 p-3 bg-gray-50">
                          <Label className="text-xs font-medium text-gray-600 mb-2 block">
                            Select main SKU to display on product card:
                          </Label>
                          <div className="space-y-2">
                            {product.product_variants
                              ?.filter(variant => variant.active)
                              .map(variant => {
                                const variantPrice = variant.discount_price || variant.price
                                const isSelected = variant.id === selectedVariantId

                                return (
                                  <button
                                    key={variant.id}
                                    type="button"
                                    onClick={() => updateSelectedVariant(product.id, variant.id)}
                                    className={`flex items-center justify-between w-full p-2 rounded border text-left transition-colors ${isSelected
                                        ? 'border-red-500 bg-red-50 text-red-900'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-white'
                                      }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${isSelected ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {variant.sku}
                                      </span>
                                      <span className="text-sm">
                                        {variant.name || 'Default'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                      <span className="font-medium text-green-600">
                                        ₹{variantPrice.toFixed(2)}
                                      </span>
                                      <span>Stock: {variant.stock}</span>
                                      {isSelected && (
                                        <span className="text-red-600 font-medium">MAIN</span>
                                      )}
                                    </div>
                                  </button>
                                )
                              })}
                          </div>
                        </div>
                      )}

                      {/* Single variant info */}
                      {!hasMultipleVariants && selectedVariant && (
                        <div className="border-t border-gray-200 p-3 bg-gray-50">
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>Single variant product</span>
                            <span>Stock: {selectedVariant.stock}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {selectedProducts.size === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products selected</h3>
              <p className="text-gray-600 mb-4">Use the search above to browse and add products</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
