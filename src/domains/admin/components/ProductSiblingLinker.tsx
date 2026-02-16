'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { searchProducts, ProductSearchResult } from '@/lib/actions/search-products'

export interface LinkedProduct extends ProductSearchResult {
    siblingName?: string
}

interface ProductSiblingLinkerProps {
    currentProductId?: string
    linkedSiblings: LinkedProduct[]
    onSiblingsChange: (siblings: LinkedProduct[]) => void
}

export function ProductSiblingLinker({
    currentProductId,
    linkedSiblings,
    onSiblingsChange
}: ProductSiblingLinkerProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Debounced search
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
        }

        if (searchQuery.trim().length === 0) {
            setSearchResults([])
            setShowDropdown(false)
            return
        }

        setIsSearching(true)
        searchTimeoutRef.current = setTimeout(async () => {
            const result = await searchProducts(searchQuery, currentProductId)
            if (result.success && result.data) {
                setSearchResults(result.data)
                setShowDropdown(true)
            }
            setIsSearching(false)
        }, 300) // 300ms debounce

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current)
            }
        }
    }, [searchQuery, currentProductId])

    // Handler for selecting a sibling
    const handleSelectSibling = (product: ProductSearchResult) => {
        // Prevent duplicates
        if (linkedSiblings.some(s => s.id === product.id)) {
            setSearchQuery('')
            setSearchResults([])
            setShowDropdown(false)
            return
        }

        onSiblingsChange([...linkedSiblings, product])
        setSearchQuery('')
        setSearchResults([])
        setShowDropdown(false)
    }

    const handleRemoveSibling = (productId: string) => {
        onSiblingsChange(linkedSiblings.filter(s => s.id !== productId))
    }

    // Filter out already linked products
    const filteredResults = searchResults.filter(result =>
        !linkedSiblings.some(sibling => sibling.id === result.id)
    )

    const handleSiblingNameChange = (id: string, name: string) => {
        onSiblingsChange(linkedSiblings.map(s =>
            s.id === id ? { ...s, siblingName: name } : s
        ))
    }

    return (
        <div className="space-y-3">
            <div>
                <Label htmlFor="sibling-search" className="text-sm font-medium text-gray-900">
                    Link to Existing Product Family
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                    Search and select a product to link this as a color variant or related product
                </p>
            </div>

            {linkedSiblings.length > 0 && (
                <div className="space-y-2">
                    <Label className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                        Linked Products ({linkedSiblings.length})
                    </Label>
                    <div className="space-y-2">
                        {linkedSiblings.map((sibling) => (
                            <div key={sibling.id} className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between gap-3">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-green-900 truncate">
                                        {sibling.title}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Input
                                            placeholder="Sibling Name (e.g. Red)"
                                            value={sibling.siblingName || ''}
                                            onChange={(e) => handleSiblingNameChange(sibling.id, e.target.value)}
                                            className="h-8 text-xs bg-white/50 border-green-200 focus:border-green-400 focus:ring-green-400/20"
                                        />
                                    </div>
                                    {sibling.product_family_id ? (
                                        <p className="text-[10px] text-green-600 mt-1 truncate">
                                            Family ID: {sibling.product_family_id}
                                        </p>
                                    ) : (
                                        <p className="text-[10px] text-blue-600 mt-1 truncate">
                                            Will join family
                                        </p>
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveSibling(sibling.id)}
                                    className="text-red-600 hover:bg-red-50 hover:text-red-700 h-8 w-8 p-0 flex-shrink-0"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="relative" ref={dropdownRef}>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        id="sibling-search"
                        type="text"
                        placeholder="Search products by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => searchQuery.length > 0 && setShowDropdown(true)}
                        className="pl-10 bg-white/60"
                    />
                </div>

                {showDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {isSearching ? (
                            <div className="p-3 text-sm text-gray-500 text-center">
                                Searching...
                            </div>
                        ) : filteredResults.length > 0 ? (
                            <div className="py-1">
                                {filteredResults.map((product) => (
                                    <button
                                        key={product.id}
                                        type="button"
                                        onClick={() => handleSelectSibling(product)}
                                        className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                                    >
                                        <p className="text-sm font-medium text-gray-900">
                                            {product.title}
                                        </p>
                                        {product.product_family_id ? (
                                            <p className="text-xs text-green-600 mt-0.5">
                                                ✓ In family: {product.product_family_id}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                No family (will create new group)
                                            </p>
                                        )}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="p-3 text-sm text-gray-500 text-center">
                                No products found
                            </div>
                        )}
                    </div>
                )}
            </div>

            {linkedSiblings.length === 0 && (
                <p className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded p-2">
                    <strong>💡 Tip:</strong> Search and select products. You can link multiple products to create a family.
                </p>
            )}
        </div>
    )
}
