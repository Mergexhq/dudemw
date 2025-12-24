"use client"

import { useState } from "react"
import { SlidersHorizontal, X, ChevronDown } from "lucide-react"
import { useFilters } from "../../hooks/FilterContext"
import { useFilterOptions } from "../../hooks/useFilterOptions"

const sortOptions = ["Newest First", "Price: Low to High", "Price: High to Low", "Bestsellers"]
const MIN_PRICE = 299
const MAX_PRICE = 1999

export default function MobileFilterButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false)
  const [minInput, setMinInput] = useState("")
  const [maxInput, setMaxInput] = useState("")
  const { sizes, colors } = useFilterOptions()

  const {
    selectedSizes,
    selectedColors,
    selectedFits,
    priceRange,
    sortBy,
    toggleSize,
    toggleColor,
    toggleFit,
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

  const activeFiltersCount =
    selectedSizes.length + selectedColors.length + selectedFits.length

  return (
    <>
      {/* Mobile Filter Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-gray-300 bg-white px-4 py-3 font-body text-sm font-medium text-gray-700 transition-colors hover:border-red-600 hover:text-red-600 lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" />
        <span>Filters & Sort</span>
        {activeFiltersCount > 0 && (
          <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-white lg:hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-gray-200 p-4">
            <h3 className="font-heading text-xl font-bold tracking-wide">FILTERS</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-2 transition-colors hover:bg-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="h-[calc(100vh-140px)] overflow-y-auto p-4">
            <div className="space-y-6">
              {/* Sort By */}
              <div className="relative">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Sort By
                </label>
                <button
                  onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                  className="flex w-full items-center justify-between rounded-lg border-2 border-gray-300 px-4 py-3 text-sm font-medium transition-colors hover:border-red-600"
                >
                  <span>{sortBy}</span>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${sortDropdownOpen ? "rotate-180" : ""
                      }`}
                  />
                </button>
                {sortDropdownOpen && (
                  <div className="absolute z-10 mt-2 w-full rounded-lg border-2 border-gray-200 bg-white shadow-xl">
                    {sortOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setSortBy(option)
                          setSortDropdownOpen(false)
                        }}
                        className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-gray-50 ${sortBy === option ? "bg-red-50 text-red-600" : ""
                          }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Range */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Price Range
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setPriceRange([MIN_PRICE, 900])
                      setMinInput("")
                      setMaxInput("")
                    }}
                    className={`w-full rounded-lg border-2 px-4 py-3 text-left text-sm font-medium transition-colors ${priceRange[1] === 900 && priceRange[0] === MIN_PRICE
                      ? "border-red-600 bg-red-50 text-red-600"
                      : "border-gray-300 hover:border-red-600"
                      }`}
                  >
                    Under ₹900
                  </button>
                  <button
                    onClick={() => {
                      setPriceRange([900, MAX_PRICE])
                      setMinInput("")
                      setMaxInput("")
                    }}
                    className={`w-full rounded-lg border-2 px-4 py-3 text-left text-sm font-medium transition-colors ${priceRange[0] === 900 && priceRange[1] === MAX_PRICE
                      ? "border-red-600 bg-red-50 text-red-600"
                      : "border-gray-300 hover:border-red-600"
                      }`}
                  >
                    Over ₹900
                  </button>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minInput}
                      onChange={(e) => setMinInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handlePriceUpdate()}
                      className="w-20 rounded-lg border-2 border-gray-300 px-2 py-2 text-xs focus:border-red-600 focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxInput}
                      onChange={(e) => setMaxInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handlePriceUpdate()}
                      className="w-20 rounded-lg border-2 border-gray-300 px-2 py-2 text-xs focus:border-red-600 focus:outline-none"
                    />
                    <button
                      onClick={handlePriceUpdate}
                      className="flex-1 rounded-lg bg-gray-800 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-red-600"
                    >
                      Go
                    </button>
                  </div>
                </div>
              </div>

              {/* Size */}
              {sizes.length > 0 && (
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Size
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {sizes.map((size) => (
                      <button
                        key={size.name}
                        onClick={() => toggleSize(size.name)}
                        className={`rounded-lg border-2 py-3 text-sm font-bold transition-all ${selectedSizes.includes(size.name)
                          ? "border-red-600 bg-red-600 text-white"
                          : "border-gray-300 hover:border-red-600"
                          }`}
                      >
                        {size.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color */}
              {colors.length > 0 && (
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {colors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => toggleColor(color.name)}
                        className={`h-10 w-10 rounded-full border-2 transition-all ${selectedColors.includes(color.name)
                          ? "border-red-600 ring-2 ring-red-600 ring-offset-2"
                          : "border-gray-300 hover:border-red-600"
                          }`}
                        style={{ backgroundColor: color.hexColor || "#888888" }}
                        title={color.name}
                        aria-label={color.name}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fixed Bottom Actions */}
          <div className="fixed bottom-0 left-0 right-0 flex gap-3 border-t-2 border-gray-200 bg-white p-4">
            <button
              onClick={() => {
                clearAll()
                setIsOpen(false)
              }}
              className="flex-1 rounded-lg border-2 border-gray-300 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-red-600 hover:text-red-600"
            >
              Clear All
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 rounded-lg bg-red-600 py-3 font-heading text-sm font-bold tracking-wider text-white transition-colors hover:bg-black"
            >
              APPLY FILTERS
            </button>
          </div>
        </div>
      )}
    </>
  )
}
