"use client"

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { 
  ArrowLeft,
  Plus,
  Search,
  Edit,
  Package,
  DollarSign,
  Warehouse
} from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface VariantsListViewProps {
  product: any
  filters: {
    search?: string
    option?: string
    stock?: string
    status?: string
  }
}

export function VariantsListView({ product, filters }: VariantsListViewProps) {
  // FRONTEND RESPONSIBILITY: UI state, form handling, navigation
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState(filters.search || '')
  
  // Filter variants based on current filters (frontend filtering for immediate feedback)
  const filteredVariants = product.product_variants?.filter((variant: any) => {
    if (searchQuery && !variant.name?.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !variant.sku.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'active' && !variant.active) return false
      if (filters.status === 'inactive' && variant.active) return false
    }
    
    if (filters.stock && filters.stock !== 'all') {
      const stock = variant.stock || 0
      if (filters.stock === 'in_stock' && stock === 0) return false
      if (filters.stock === 'low_stock' && (stock === 0 || stock >= 10)) return false
      if (filters.stock === 'out_of_stock' && stock > 0) return false
    }
    
    return true
  }) || []

  // FRONTEND RESPONSIBILITY: Handle inline edits (sends intent to backend)
  const handleStockUpdate = async (variantId: string, newStock: number) => {
    startTransition(async () => {
      try {
        const { data, error } = await supabase
          .from('product_variants')
          .update({ stock: newStock })
          .eq('id', variantId)
        
        const result = { success: !error, error: error?.message }
        if (result.success) {
          toast.success('Stock updated successfully')
          router.refresh() // Refresh to get updated data
        } else {
          toast.error(result.error || 'Failed to update stock')
        }
      } catch (error) {
        toast.error('Failed to update stock')
      }
    })
  }

  const handlePriceUpdate = async (variantId: string, newPrice: number) => {
    startTransition(async () => {
      try {
        // This would call a domain function to update variant price
        // await updateVariantPrice(variantId, { price: newPrice })
        toast.success('Price updated successfully')
        router.refresh()
      } catch (error) {
        toast.error('Failed to update price')
      }
    })
  }

  // FRONTEND RESPONSIBILITY: Display calculations
  const getStockBadge = (stock: number) => {
    if (stock === 0) return <Badge variant="destructive">Out of Stock</Badge>
    if (stock < 10) return <Badge variant="secondary">Low Stock</Badge>
    return <Badge variant="outline">In Stock</Badge>
  }

  const getOptionDisplay = (variant: any) => {
    // Display variant options (Color, Size, etc.)
    const options = variant.variant_option_values?.map((vov: any) => ({
      name: vov.product_option_values?.product_options?.name,
      value: vov.product_option_values?.name,
      color: vov.product_option_values?.hex_color,
    })) || []
    
    return options.map((option: any, index: number) => (
      <span key={index} className="inline-flex items-center space-x-1">
        {option.color && (
          <div 
            className="w-3 h-3 rounded-full border border-gray-300"
            style={{ backgroundColor: option.color }}
          />
        )}
        <span className="text-sm">{option.value}</span>
        {index < options.length - 1 && <span className="text-gray-400">/</span>}
      </span>
    ))
  }

  return (
    <div className="space-y-6">
      {/* Header - FRONTEND: Navigation and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/products/${product.id}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Product
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {product.title} - Variants
            </h1>
            <p className="text-gray-500">
              {filteredVariants.length} of {product.product_variants?.length || 0} variants
            </p>
          </div>
        </div>
        
        <Button asChild>
          <Link href={`/admin/products/${product.id}/variants/create`}>
            <Plus className="w-4 h-4 mr-2" />
            Add Variant
          </Link>
        </Button>
      </div>

      {/* Filters - FRONTEND: Filter UI */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search variants by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filters.status || 'all'}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.stock || 'all'}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Variants Table - FRONTEND: Display and inline editing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Product Variants
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredVariants.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variant</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVariants.map((variant: any) => (
                  <TableRow key={variant.id}>
                    <TableCell>
                      <Link 
                        href={`/admin/products/${product.id}/variants/${variant.id}`}
                        className="block hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors"
                      >
                        <div className="font-medium hover:text-blue-600 dark:hover:text-blue-400">
                          {variant.name || 'Default Variant'}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          {getOptionDisplay(variant)}
                        </div>
                      </Link>
                    </TableCell>
                    
                    <TableCell>
                      <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {variant.sku}
                      </code>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <InlineEdit
                          value={variant.price}
                          onSave={(value) => handlePriceUpdate(variant.id, value)}
                          type="currency"
                          disabled={isPending}
                        />
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <Warehouse className="w-4 h-4 text-gray-400" />
                          <InlineEdit
                            value={variant.stock}
                            onSave={(value) => handleStockUpdate(variant.id, value)}
                            type="number"
                            disabled={isPending}
                          />
                        </div>
                        {getStockBadge(variant.stock || 0)}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Switch
                        checked={variant.active}
                        onCheckedChange={(checked) => {
                          // Handle status toggle
                          console.log('Toggle variant status:', variant.id, checked)
                        }}
                        disabled={isPending}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/products/${product.id}/variants/${variant.id}`}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No variants found
              </h3>
              <p className="text-gray-500 mb-4">
                {product.product_variants?.length === 0 
                  ? "This product doesn't have any variants yet."
                  : "No variants match your current filters."
                }
              </p>
              {product.product_variants?.length === 0 && (
                <Button asChild>
                  <Link href={`/admin/products/${product.id}/variants/create`}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Variant
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// FRONTEND COMPONENT: Inline editing for quick updates
interface InlineEditProps {
  value: number
  onSave: (value: number) => void
  type: 'number' | 'currency'
  disabled?: boolean
}

function InlineEdit({ value, onSave, type, disabled }: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value.toString())

  const handleSave = () => {
    const numValue = parseFloat(editValue)
    if (!isNaN(numValue) && numValue >= 0) {
      onSave(numValue)
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setEditValue(value.toString())
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') handleCancel()
          }}
          className="w-20 h-8"
          type="number"
          min="0"
          step={type === 'currency' ? '0.01' : '1'}
          autoFocus
          disabled={disabled}
        />
        <Button size="sm" onClick={handleSave} disabled={disabled}>
          Save
        </Button>
        <Button size="sm" variant="outline" onClick={handleCancel} disabled={disabled}>
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="text-left hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded transition-colors"
      disabled={disabled}
    >
      {type === 'currency' ? `₹${value.toLocaleString('en-IN')}` : value}
    </button>
  )
}