"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, X, Package, Search, ShoppingBag, ChevronDown } from 'lucide-react'
import { ProductService } from '@/lib/services/products'
import { toast } from 'sonner'
import type { Product, SelectedProduct } from './types'

interface ProductSelectionStepProps {
    selectedProducts: Map<string, SelectedProduct>
    onProductsChange: (products: Map<string, SelectedProduct>) => void
}

export function ProductSelectionStep({ selectedProducts, onProductsChange }: ProductSelectionStepProps) {
    const [loading, setLoading] = useState(false)
    const [allProducts, setAllProducts] = useState<Product[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Load all products when component mounts
    useEffect(() => {
        loadAllProducts()
    }, [])

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
            const result = await ProductService.getProducts({
                limit: 1000,
                sortBy: 'title',
                sortOrder: 'asc'
            })

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

    const addProduct = (product: Product) => {
        if (selectedProducts.has(product.id)) {
            toast.error('This product is already selected')
            return
        }

        const newSelected = new Map(selectedProducts)
        newSelected.set(product.id, {
            product: product
        })
        onProductsChange(newSelected)

        // Clear search, close dropdown, and show success message
        setSearchQuery("")
        setIsDropdownOpen(false)
        toast.success(`Added "${product.title}"`)
    }

    const removeSelectedProduct = (productId: string) => {
        const newSelected = new Map(selectedProducts)
        newSelected.delete(productId)
        onProductsChange(newSelected)
    }

    // Filter products based on search query
    const filteredProducts = allProducts.filter(product => {
        const query = searchQuery.toLowerCase()
        return (
            product.title.toLowerCase().includes(query)
        )
    })

    return (
        <div className="space-y-6">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                        <ShoppingBag className="h-5 w-5" />
                        Select Products
                    </CardTitle>
                    <CardDescription>
                        Choose which products to include in this category
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
                                    ) : filteredProducts.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                            <p className="text-sm">
                                                {searchQuery ? 'No products match your search' : 'No available products'}
                                            </p>
                                        </div>
                                    ) : (
                                        filteredProducts.map(product => {
                                            const primaryImage = product.product_images?.find(img => img.is_primary)
                                            const isSelected = selectedProducts.has(product.id)

                                            return (
                                                <button
                                                    key={product.id}
                                                    type="button"
                                                    onClick={() => !isSelected && addProduct(product)}
                                                    disabled={isSelected}
                                                    className={`w-full flex items-center gap-3 p-3 border-b border-gray-100 last:border-b-0 text-left transition-colors ${isSelected ? 'bg-gray-50 opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {/* Product Image - Square */}
                                                    {primaryImage ? (
                                                        <img
                                                            src={primaryImage.image_url}
                                                            alt={product.title}
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
                                                            {product.title}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                            {product.price && (
                                                                <span className="text-green-600 font-medium">
                                                                    ₹{product.price.toFixed(2)}
                                                                </span>
                                                            )}
                                                            {isSelected && <span className="text-red-600 font-medium ml-2">Selected</span>}
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
                            Search for products by name to add them to this category.
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
                                {Array.from(selectedProducts.values()).map(({ product }) => {
                                    const primaryImage = product.product_images?.find(img => img.is_primary)

                                    return (
                                        <div
                                            key={product.id}
                                            className="bg-white border border-gray-200 rounded-lg overflow-hidden flex items-center gap-3 p-3"
                                        >
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
                                                {product.price && (
                                                    <p className="text-sm font-medium text-green-600">
                                                        ₹{product.price.toFixed(2)}
                                                    </p>
                                                )}
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeSelectedProduct(product.id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
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
