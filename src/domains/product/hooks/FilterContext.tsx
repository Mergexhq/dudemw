"use client"

import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useTransition } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

export type FilterType = "size" | "color" | "price" | "sort" | "fit"

export interface FilterChip {
  type: FilterType
  label: string
  value: string
}

interface FilterContextType {
  selectedSizes: string[]
  selectedColors: string[]
  selectedFits: string[]
  priceRange: [number, number]
  sortBy: string
  toggleSize: (size: string) => void
  toggleColor: (color: string) => void
  toggleFit: (fit: string) => void
  setPriceRange: (range: [number, number]) => void
  setSortBy: (sort: string) => void
  clearAll: () => void
  removeFilter: (type: FilterType, value: string) => void
  getAppliedFilters: () => FilterChip[]
  isPending: boolean
}

const FilterContext = createContext<FilterContextType | undefined>(undefined)

const MIN_PRICE = 299
const MAX_PRICE = 1999

export function FilterProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  // Initialize state from URL params
  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    searchParams.getAll("size").length > 0 ? searchParams.getAll("size")[0].split(',') : []
  )
  const [selectedColors, setSelectedColors] = useState<string[]>(
    searchParams.getAll("color").length > 0 ? searchParams.getAll("color")[0].split(',') : []
  )
  const [selectedFits, setSelectedFits] = useState<string[]>(
    searchParams.getAll("fit").length > 0 ? searchParams.getAll("fit")[0].split(',') : []
  )

  const minPriceParam = searchParams.get("min_price")
  const maxPriceParam = searchParams.get("max_price")
  const [priceRange, setPriceRangeState] = useState<[number, number]>([
    minPriceParam ? Number(minPriceParam) : MIN_PRICE,
    maxPriceParam ? Number(maxPriceParam) : MAX_PRICE
  ])

  const [sortBy, setSortByState] = useState(searchParams.get("sort") || "Newest First")

  // Helper to update URL
  const updateURL = useCallback((updates: Partial<{
    size: string[],
    color: string[],
    fit: string[],
    price: [number, number],
    sort: string
  }>) => {
    const params = new URLSearchParams(searchParams.toString())

    // Updates
    const sizes = updates.size !== undefined ? updates.size : selectedSizes
    const colors = updates.color !== undefined ? updates.color : selectedColors
    const fits = updates.fit !== undefined ? updates.fit : selectedFits
    const price = updates.price !== undefined ? updates.price : priceRange
    const sort = updates.sort !== undefined ? updates.sort : sortBy

    // Set params
    if (sizes.length > 0) params.set("size", sizes.join(','))
    else params.delete("size")

    if (colors.length > 0) params.set("color", colors.join(','))
    else params.delete("color")

    if (fits.length > 0) params.set("fit", fits.join(','))
    else params.delete("fit")

    if (price[0] !== MIN_PRICE) params.set("min_price", price[0].toString())
    else params.delete("min_price")

    if (price[1] !== MAX_PRICE) params.set("max_price", price[1].toString())
    else params.delete("max_price")

    if (sort !== "Newest First" && sort !== "newest") params.set("sort", sort)
    else params.delete("sort")

    // Reset page on filter change
    params.delete("page")

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }, [searchParams, pathname, router, selectedSizes, selectedColors, selectedFits, priceRange, sortBy])

  // Handlers wrap updateURL
  const toggleSize = (size: string) => {
    const newSizes = selectedSizes.includes(size)
      ? selectedSizes.filter(s => s !== size)
      : [...selectedSizes, size]
    setSelectedSizes(newSizes)
    updateURL({ size: newSizes })
  }

  const toggleColor = (color: string) => {
    const newColors = selectedColors.includes(color)
      ? selectedColors.filter(c => c !== color)
      : [...selectedColors, color]
    setSelectedColors(newColors)
    updateURL({ color: newColors })
  }

  const toggleFit = (fit: string) => {
    const newFits = selectedFits.includes(fit)
      ? selectedFits.filter(f => f !== fit)
      : [...selectedFits, fit]
    setSelectedFits(newFits)
    updateURL({ fit: newFits })
  }

  const setPriceRange = (range: [number, number]) => {
    setPriceRangeState(range)
    updateURL({ price: range })
  }

  const setSortBy = (sort: string) => {
    setSortByState(sort)
    updateURL({ sort })
  }

  const clearAll = () => {
    setSelectedSizes([])
    setSelectedColors([])
    setSelectedFits([])
    setPriceRangeState([MIN_PRICE, MAX_PRICE])
    setSortByState("Newest First")

    // Clear URL
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete("size")
      params.delete("color")
      params.delete("fit")
      params.delete("min_price")
      params.delete("max_price")
      params.delete("sort")
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  const removeFilter = (type: FilterType, value: string) => {
    if (type === 'price') {
      setPriceRange([MIN_PRICE, MAX_PRICE])
    } else if (type === 'sort') {
      setSortBy("Newest First")
    } else {
      // reuse toggles
      if (type === 'size') toggleSize(value)
      if (type === 'color') toggleColor(value)
      if (type === 'fit') toggleFit(value)
    }
  }

  const getAppliedFilters = (): FilterChip[] => {
    const filters: FilterChip[] = []
    selectedSizes.forEach((s) => filters.push({ type: "size", label: s, value: s }))
    selectedColors.forEach((c) => filters.push({ type: "color", label: c, value: c }))
    selectedFits.forEach((f) => filters.push({ type: "fit", label: f, value: f }))
    if (priceRange[0] !== MIN_PRICE || priceRange[1] !== MAX_PRICE) {
      filters.push({ type: "price", label: `₹${priceRange[0]}–₹${priceRange[1]}`, value: `${priceRange[0]}-${priceRange[1]}` })
    }
    if (sortBy !== "Newest First" && sortBy !== "newest") {
      filters.push({ type: "sort", label: sortBy, value: sortBy })
    }
    return filters
  }

  return (
    <FilterContext.Provider
      value={{
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
        removeFilter,
        getAppliedFilters,
        isPending
      }}
    >
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters() {
  const context = useContext(FilterContext)
  if (context === undefined) {
    throw new Error("useFilters must be used within a FilterProvider")
  }
  return context
}
