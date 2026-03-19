'use client'

import { useState, useEffect, useCallback } from 'react'
import { useListData } from 'react-stately'
import { searchProducts, ProductSearchResult } from '@/lib/actions/search-products'
import { SelectItemType } from '@/components/base/select/select'
import { MultiSelect } from '@/components/base/select/multi-select'
import { SelectItem } from '@/components/base/select/select-item'
import { toast } from 'sonner'

interface ProductMultiSelectorProps {
  selectedIds: string[]
  onChange: (ids: string[]) => void
  label?: string
  placeholder?: string
}

export function ProductMultiSelector({
  selectedIds,
  onChange,
  label = 'Select Products',
  placeholder = 'Search products...'
}: ProductMultiSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([])
  const [loading, setLoading] = useState(false)

  const selectedItems = useListData<SelectItemType>({
    initialItems: []
  })

  useEffect(() => {
    const loadSelectedProducts = async () => {
      if (selectedIds.length > 0) {
        for (const id of selectedIds) {
          const result = await searchProducts('', undefined)
          if (result.success && result.data) {
            const product = result.data.find(p => p.id === id)
            if (product && !selectedItems.items.find(i => i.id === product.id)) {
              selectedItems.append({
                id: product.id,
                label: product.title
              })
            }
          }
        }
      }
    }
    loadSelectedProducts()
  }, [])

  useEffect(() => {
    const selected = selectedItems.items.map(item => item.id)
    if (JSON.stringify(selected) !== JSON.stringify(selectedIds)) {
      onChange(selected)
    }
  }, [selectedItems.items, onChange, selectedIds])

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      const result = await searchProducts(query)
      if (result.success && result.data) {
        setSearchResults(result.data)
      } else {
        toast.error(result.error || 'Failed to search products')
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Failed to search products')
    } finally {
      setLoading(false)
    }
  }, [])

  const items: SelectItemType[] = searchResults
    .filter(p => !selectedItems.items.find(s => s.id === p.id))
    .map(p => ({
      id: p.id,
      label: p.title
    }))

  return (
    <MultiSelect
      label={label}
      placeholder={placeholder}
      selectedItems={selectedItems}
      onInputChange={handleSearch}
      items={items}
      renderEmptyState={() => (
        <div className="p-4 text-center text-gray-500 text-sm">
          {searchQuery.length < 2 ? 'Type at least 2 characters to search' : 'No products found'}
        </div>
      )}
    >
      {(item: SelectItemType) => (
        <SelectItem key={item.id} id={item.id} label={item.label}>
          {item.label}
        </SelectItem>
      )}
    </MultiSelect>
  )
}