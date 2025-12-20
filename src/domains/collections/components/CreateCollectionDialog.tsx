'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Search, X, Package, Plus } from 'lucide-react'
import { ProductService } from '@/lib/services/products'

interface CreateCollectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface Product {
  id: string
  title: string
  handle: string
  price?: number
  product_images?: Array<{
    id: string
    image_url: string
    alt_text?: string
    is_primary: boolean
  }>
}

export default function CreateCollectionDialog({ open, onOpenChange, onSuccess }: CreateCollectionDialogProps) {
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<Map<string, Product>>(new Map())
  const [showProductPopover, setShowProductPopover] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    type: 'manual' as 'manual' | 'rule',
    is_active: true
  })

  const supabase = createClient()

  // Load products when searching
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const debounceTimer = setTimeout(() => {
        loadProducts(searchQuery.trim())
        setShowProductPopover(true)
      }, 300)

      return () => clearTimeout(debounceTimer)
    } else {
      setProducts([])
      setShowProductPopover(false)
    }
  }, [searchQuery])

  const loadProducts = async (search: string) => {
    try {
      setSearchLoading(true)
      const result = await ProductService.getProducts({
        search,
        limit: 20,
        sortBy: 'title',
        sortOrder: 'asc'
      })

      if (result.success) {
        // Filter out already selected products
        const filteredProducts = (result.data || []).filter(
          product => !selectedProducts.has(product.id)
        )
        setProducts(filteredProducts)
      } else {
        toast.error('Failed to load products')
      }
    } catch (error) {
      console.error('Error loading products:', error)
      toast.error('Failed to load products')
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
  }

  const addProduct = (product: Product) => {
    const newSelected = new Map(selectedProducts)
    newSelected.set(product.id, product)
    setSelectedProducts(newSelected)

    // Clear search and close popover
    setSearchQuery('')
    setShowProductPopover(false)
    setProducts([])
  }

  const removeSelectedProduct = (productId: string) => {
    const newSelected = new Map(selectedProducts)
    newSelected.delete(productId)
    setSelectedProducts(newSelected)
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }))
  }



  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a collection title')
      return
    }

    if (!formData.description.trim()) {
      toast.error('Please enter a collection description')
      return
    }

    if (selectedProducts.size === 0) {
      toast.error('Please select at least one product for this collection')
      return
    }

    try {
      setLoading(true)

      // Create collection
      const { data: collection, error: collectionError } = await supabase
        .from('collections')
        .insert({
          title: formData.title,
          slug: formData.slug,
          description: formData.description,
          type: 'manual', // Always manual for simplified collections
          is_active: formData.is_active,
          rule_json: null
        })
        .select()
        .single()

      if (collectionError) {
        console.error('Collection creation error:', collectionError)
        throw collectionError
      }

      // Add products to collection
      const collectionProducts = Array.from(selectedProducts.keys()).map((productId, index) => ({
        collection_id: collection.id,
        product_id: productId,
        sort_order: index + 1
      }))

      const { error: productsError } = await supabase
        .from('collection_products')
        .insert(collectionProducts)

      if (productsError) {
        console.error('Error adding products to collection:', productsError)
        // Try to clean up the collection if product insertion fails
        await supabase.from('collections').delete().eq('id', collection.id)
        throw productsError
      }

      toast.success(`Collection created successfully with ${selectedProducts.size} products`)

      // Reset form
      setFormData({
        title: '',
        slug: '',
        description: '',
        type: 'manual',
        is_active: true
      })
      setSelectedProducts(new Map())
      setSearchQuery('')

      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      console.error('Error creating collection:', error)
      toast.error(error.message || 'Failed to create collection')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Collection</DialogTitle>
          <DialogDescription>
            Create a curated collection of products for your store
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Collection Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., Summer Collection"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Short description for homepage display..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={loading}
              rows={2}
            />
            <p className="text-xs text-gray-500">
              This will be shown on the homepage below the collection title
            </p>
          </div>

          {/* Product Selection */}
          <div className="space-y-2">
            <Label>
              Select Products <span className="text-red-500">*</span>
            </Label>

            {/* Selected Products Count */}
            {selectedProducts.size > 0 && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Package className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">
                  {selectedProducts.size} product{selectedProducts.size !== 1 ? 's' : ''} selected
                </span>
              </div>
            )}

            {/* Selected Products Display */}
            {selectedProducts.size > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg max-h-24 overflow-y-auto">
                {Array.from(selectedProducts.values()).map(product => (
                  <Badge
                    key={product.id}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1 text-xs"
                  >
                    <span className="truncate max-w-[120px]">{product.title}</span>
                    <button
                      type="button"
                      onClick={() => removeSelectedProduct(product.id)}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                      disabled={loading}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Search Products with Popover */}
            <div className="relative">
              <Popover open={showProductPopover} onOpenChange={setShowProductPopover}>
                <PopoverTrigger asChild>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search products to add..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      disabled={loading}
                      className="pl-9"
                    />
                  </div>
                </PopoverTrigger>

                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-0 z-50"
                  align="start"
                  side="bottom"
                  sideOffset={4}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <div className="max-h-48 overflow-y-auto">
                    {searchLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                        <span className="ml-2 text-sm text-gray-500">Searching...</span>
                      </div>
                    ) : products.length === 0 && searchQuery.trim().length >= 2 ? (
                      <div className="text-center py-6 text-gray-500">
                        <Package className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">No products found for "{searchQuery}"</p>
                      </div>
                    ) : searchQuery.trim().length < 2 ? (
                      <div className="text-center py-6 text-gray-500">
                        <Search className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">Type at least 2 characters to search</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {products.map(product => {
                          const primaryImage = product.product_images?.find(img => img.is_primary)

                          return (
                            <div
                              key={product.id}
                              className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => addProduct(product)}
                            >
                              {primaryImage && (
                                <img
                                  src={primaryImage.image_url}
                                  alt={primaryImage.alt_text || product.title}
                                  className="w-8 h-8 object-cover rounded border border-gray-200 flex-shrink-0"
                                />
                              )}

                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {product.title}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {product.handle}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 flex-shrink-0">
                                {product.price && (
                                  <span className="text-sm font-medium text-gray-900">
                                    ₹{product.price.toFixed(2)}
                                  </span>
                                )}
                                <Plus className="h-4 w-4 text-gray-400" />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <p className="text-xs text-gray-500">
              Search and click to add products to this collection. Type at least 2 characters to see results.
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_active">Active Status</Label>
              <p className="text-xs text-gray-500">
                Make this collection visible on homepage and product pages
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData(prev => ({ ...prev, is_active: checked }))
              }
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || selectedProducts.size === 0}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Collection'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
