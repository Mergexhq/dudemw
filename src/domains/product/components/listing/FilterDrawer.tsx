"use client"

import { useState } from "react"
import { X, SlidersHorizontal, ChevronDown } from "lucide-react"
import { useFilters } from "../../hooks/FilterContext"
import { useFilterOptions, FilterOption } from "../../hooks/useFilterOptions"

interface FilterDrawerProps {
    isOpen: boolean
    onClose: () => void
    totalProducts: number
    categorySlug?: string
    collectionSlug?: string
}

const sortOptions = ["Newest First", "Price: Low to High", "Price: High to Low", "Bestsellers"]
const MIN_PRICE = 299
const MAX_PRICE = 1999

export default function FilterDrawer({
    isOpen,
    onClose,
    totalProducts,
    categorySlug,
    collectionSlug,
}: FilterDrawerProps) {
    const [sortDropdownOpen, setSortDropdownOpen] = useState(false)
    const [minInput, setMinInput] = useState("")
    const [maxInput, setMaxInput] = useState("")
    const { sizes, colors, loading } = useFilterOptions(categorySlug, collectionSlug)

    const {
        selectedSizes,
        selectedColors,
        priceRange,
        sortBy,
        toggleSize,
        toggleColor,
        setPriceRange,
        setSortBy,
        clearAll,
    } = useFilters()

    const handlePriceUpdate = () => {
        const min = minInput ? Number(minInput) : MIN_PRICE
        const max = maxInput ? Number(maxInput) : MAX_PRICE
        if (min >= MIN_PRICE && max <= MAX_PRICE && min < max) {
            setPriceRange([min, max])
        }
    }

    const activeFiltersCount = selectedSizes.length + selectedColors.length +
        (priceRange[0] !== MIN_PRICE || priceRange[1] !== MAX_PRICE ? 1 : 0)

    if (!isOpen) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/50 transition-opacity"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300 ease-out">
                <div className="flex h-full flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                            <X className="h-5 w-5" />
                        </button>
                        <h2 className="text-sm font-semibold uppercase tracking-wider">Filters</h2>
                        <div className="w-9" /> {/* Spacer for alignment */}
                    </div>

                    {/* Filter Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-6">
                        {loading ? (
                            <div className="space-y-6">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="animate-pulse">
                                        <div className="h-4 w-20 bg-gray-200 rounded mb-3" />
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4].map(j => (
                                                <div key={j} className="h-10 w-14 bg-gray-200 rounded" />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Sort By */}
                                <div>
                                    <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-gray-700">
                                        Sort By
                                    </label>
                                    <div className="relative">
                                        <button
                                            onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                                            className="flex w-full items-center justify-between rounded-lg border-2 border-gray-300 px-4 py-3 text-sm hover:border-gray-400"
                                        >
                                            <span>{sortBy}</span>
                                            <ChevronDown className={`h-4 w-4 transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        {sortDropdownOpen && (
                                            <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg">
                                                {sortOptions.map(option => (
                                                    <button
                                                        key={option}
                                                        onClick={() => {
                                                            setSortBy(option)
                                                            setSortDropdownOpen(false)
                                                        }}
                                                        className={`block w-full px-4 py-3 text-left text-sm hover:bg-gray-50 ${sortBy === option ? 'bg-gray-100 font-medium' : ''
                                                            }`}
                                                    >
                                                        {option}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Price Range */}
                                <div>
                                    <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-gray-700">
                                        Price Range
                                    </label>
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => setPriceRange([MIN_PRICE, 900])}
                                            className={`w-full rounded-lg border-2 px-4 py-3 text-left text-sm transition-all ${priceRange[1] === 900 ? 'border-red-600 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                                                }`}
                                        >
                                            Under ₹900
                                        </button>
                                        <button
                                            onClick={() => setPriceRange([900, MAX_PRICE])}
                                            className={`w-full rounded-lg border-2 px-4 py-3 text-left text-sm transition-all ${priceRange[0] === 900 ? 'border-red-600 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                                                }`}
                                        >
                                            Over ₹900
                                        </button>
                                        <div className="flex items-center gap-2 pt-2">
                                            <input
                                                type="number"
                                                placeholder="₹ Min"
                                                value={minInput}
                                                onChange={(e) => setMinInput(e.target.value)}
                                                className="w-full rounded-lg border-2 border-gray-300 px-3 py-2 text-sm focus:border-red-600 focus:outline-none"
                                            />
                                            <span className="text-gray-400">-</span>
                                            <input
                                                type="number"
                                                placeholder="₹ Max"
                                                value={maxInput}
                                                onChange={(e) => setMaxInput(e.target.value)}
                                                className="w-full rounded-lg border-2 border-gray-300 px-3 py-2 text-sm focus:border-red-600 focus:outline-none"
                                            />
                                            <button
                                                onClick={handlePriceUpdate}
                                                className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
                                            >
                                                Go
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Sizes */}
                                {sizes.length > 0 && (
                                    <div>
                                        <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-gray-700">
                                            Size
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {sizes.map((size) => (
                                                <button
                                                    key={size.name}
                                                    onClick={() => toggleSize(size.name)}
                                                    className={`min-w-[3rem] rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all ${selectedSizes.includes(size.name)
                                                            ? 'border-red-600 bg-red-600 text-white'
                                                            : 'border-gray-300 hover:border-red-600'
                                                        }`}
                                                >
                                                    {size.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Colors */}
                                {colors.length > 0 && (
                                    <div>
                                        <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-gray-700">
                                            Color
                                        </label>
                                        <div className="space-y-2">
                                            {colors.map((color) => (
                                                <label
                                                    key={color.name}
                                                    className="flex cursor-pointer items-center justify-between rounded-lg border-2 border-gray-200 px-4 py-3 transition-colors hover:border-gray-400"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedColors.includes(color.name)}
                                                            onChange={() => toggleColor(color.name)}
                                                            className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-600"
                                                        />
                                                        <span className="text-sm">{color.name}</span>
                                                    </div>
                                                    <div
                                                        className="h-5 w-5 rounded-full border border-gray-300"
                                                        style={{ backgroundColor: color.hexColor || '#888888' }}
                                                    />
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t border-gray-200 px-6 py-4">
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    clearAll()
                                    setMinInput("")
                                    setMaxInput("")
                                }}
                                className="flex-1 rounded-lg border-2 border-gray-300 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-red-600 hover:text-red-600"
                            >
                                CLEAR
                            </button>
                            <button
                                onClick={onClose}
                                className="flex-1 rounded-lg bg-gray-900 py-3 text-sm font-medium text-white transition-colors hover:bg-red-600"
                            >
                                VIEW [{totalProducts}]
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
