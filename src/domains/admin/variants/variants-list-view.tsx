"use client"

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
  Plus,
  Search,
  Edit,
  Package,
  IndianRupee,
  Warehouse,
  Eye,
  MoreHorizontal,
  Trash2,
  Copy,
  Check,
  X
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState(filters.search || '')
  const [statusFilter, setStatusFilter] = useState(filters.status || 'all')
  const [stockFilter, setStockFilter] = useState(filters.stock || 'all')

  // Filter variants based on current filters
  const filteredVariants = product.product_variants?.filter((variant: any) => {
    if (searchQuery && !variant.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !variant.sku.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'active' && !variant.active) return false
      if (statusFilter === 'inactive' && variant.active) return false
    }

    if (stockFilter !== 'all') {
      const stock = variant.stock || 0
      if (stockFilter === 'in_stock' && stock === 0) return false
      if (stockFilter === 'low_stock' && (stock === 0 || stock >= 10)) return false
      if (stockFilter === 'out_of_stock' && stock > 0) return false
    }

    return true
  }) || []

  // Handle stock update
  const handleStockUpdate = async (variantId: string, newStock: number) => {
    startTransition(async () => {
      try {
        const { error } = await supabase
          .from('product_variants')
          .update({ stock: newStock })
          .eq('id', variantId)

        if (!error) {
          toast.success('Stock updated')
          router.refresh()
        } else {
          toast.error('Failed to update stock')
        }
      } catch (error) {
        toast.error('Failed to update stock')
      }
    })
  }

  // Handle status toggle
  const handleStatusToggle = async (variantId: string, active: boolean) => {
    startTransition(async () => {
      try {
        const { error } = await supabase
          .from('product_variants')
          .update({ active })
          .eq('id', variantId)

        if (!error) {
          toast.success(active ? 'Variant activated' : 'Variant deactivated')
          router.refresh()
        } else {
          toast.error('Failed to update status')
        }
      } catch (error) {
        toast.error('Failed to update status')
      }
    })
  }

  // Stock badge
  const getStockBadge = (stock: number) => {
    if (stock === 0) return <Badge className="bg-red-100 text-red-700 border-red-200">Out of Stock</Badge>
    if (stock < 10) return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Low Stock</Badge>
    return <Badge className="bg-green-100 text-green-700 border-green-200">In Stock</Badge>
  }

  // Get variant display name
  const getVariantName = (variant: any) => {
    const options = variant.variant_option_values?.map((vov: any) =>
      vov.product_option_values?.name
    ).filter(Boolean) || []

    return options.length > 0 ? options.join(' / ') : variant.name || 'Default'
  }

  // Get option chips
  const getOptionChips = (variant: any) => {
    return variant.variant_option_values?.map((vov: any) => ({
      name: vov.product_option_values?.product_options?.name,
      value: vov.product_option_values?.name,
      color: vov.product_option_values?.hex_color,
    })) || []
  }

  // Calculate totals
  const totalStock = filteredVariants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0)
  const activeCount = filteredVariants.filter((v: any) => v.active).length
  const lowStockCount = filteredVariants.filter((v: any) => v.stock > 0 && v.stock < 10).length

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-50 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {product.title} - Variants
              </h1>
              <p className="text-gray-500">
                {filteredVariants.length} of {product.product_variants?.length || 0} variants
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" className="bg-white border-gray-200 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200" asChild>
            <Link href={`/admin/products/${product.id}`}>
              ← Back to Product
            </Link>
          </Button>
          <Button className="bg-red-600 hover:bg-red-700 text-white" asChild>
            <Link href={`/admin/products/${product.id}/variants/create`}>
              <Plus className="w-4 h-4 mr-2" />
              Add Variant
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Variants</p>
            <p className="text-2xl font-bold text-gray-900">{filteredVariants.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-white">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Stock</p>
            <p className="text-2xl font-bold text-gray-900">{totalStock} units</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Active</p>
            <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-white">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Low Stock</p>
            <p className="text-2xl font-bold text-gray-900">{lowStockCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search variants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-white border-gray-200 focus:border-red-300 focus:ring-red-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px] h-9 bg-white border-gray-200">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {/* Stock Filter */}
        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="w-[130px] h-9 bg-white border-gray-200">
            <SelectValue placeholder="Stock" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stock</SelectItem>
            <SelectItem value="in_stock">In Stock</SelectItem>
            <SelectItem value="low_stock">Low Stock</SelectItem>
            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {(searchQuery || statusFilter !== 'all' || stockFilter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery('')
              setStatusFilter('all')
              setStockFilter('all')
            }}
            className="h-9 text-gray-500 hover:text-red-600 hover:bg-red-50"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Variants Table */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <Package className="w-5 h-5 mr-2 text-red-600" />
            Product Variants
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          {filteredVariants.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="font-semibold text-gray-700">Variant</TableHead>
                  <TableHead className="font-semibold text-gray-700">SKU</TableHead>
                  <TableHead className="font-semibold text-gray-700">Price</TableHead>
                  <TableHead className="font-semibold text-gray-700">Stock</TableHead>
                  <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVariants.map((variant: any) => {
                  const options = getOptionChips(variant)

                  return (
                    <TableRow key={variant.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Variant Name & Options */}
                      <TableCell>
                        <Link
                          href={`/admin/products/${product.id}/variants/${variant.id}`}
                          className="block group"
                        >
                          <p className="font-medium text-gray-900 group-hover:text-red-600 transition-colors">
                            {getVariantName(variant)}
                          </p>
                          {options.length > 0 && (
                            <div className="flex items-center gap-2 mt-1">
                              {options.map((opt: any, idx: number) => (
                                <span key={idx} className="inline-flex items-center space-x-1 text-xs text-gray-500">
                                  {opt.color && (
                                    <span
                                      className="w-3 h-3 rounded-full border border-gray-300"
                                      style={{ backgroundColor: opt.color }}
                                    />
                                  )}
                                  <span>{opt.value}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </Link>
                      </TableCell>

                      {/* SKU */}
                      <TableCell>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono text-gray-600">
                          {variant.sku}
                        </code>
                      </TableCell>

                      {/* Price */}
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <span className="text-gray-400">₹</span>
                          <span className="font-semibold text-gray-900">
                            {variant.price?.toLocaleString() || 0}
                          </span>
                        </div>
                      </TableCell>

                      {/* Stock */}
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <InlineStockEdit
                            value={variant.stock || 0}
                            onSave={(value) => handleStockUpdate(variant.id, value)}
                            disabled={isPending}
                          />
                          {getStockBadge(variant.stock || 0)}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Switch
                          checked={variant.active}
                          onCheckedChange={(checked) => handleStatusToggle(variant.id, checked)}
                          disabled={isPending}
                        />
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button variant="outline" size="sm" className="border-gray-200 hover:border-red-200 hover:text-red-600" asChild>
                            <Link href={`/admin/products/${product.id}/variants/${variant.id}`}>
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/products/${product.id}/variants/${variant.id}`}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="w-4 h-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No variants found
              </h3>
              <p className="text-gray-500 mb-4">
                {product.product_variants?.length === 0
                  ? "This product doesn't have any variants yet."
                  : "No variants match your current filters."
                }
              </p>
              {product.product_variants?.length === 0 && (
                <Button className="bg-red-600 hover:bg-red-700 text-white" asChild>
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

// Inline Stock Editor Component
interface InlineStockEditProps {
  value: number
  onSave: (value: number) => void
  disabled?: boolean
}

function InlineStockEdit({ value, onSave, disabled }: InlineStockEditProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value.toString())

  const handleSave = () => {
    const numValue = parseInt(editValue)
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
      <div className="flex items-center space-x-1">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') handleCancel()
          }}
          className="w-20 h-8 text-sm"
          type="number"
          min="0"
          autoFocus
          disabled={disabled}
        />
        <Button size="sm" variant="ghost" onClick={handleSave} disabled={disabled} className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50">
          <Check className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={handleCancel} disabled={disabled} className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="flex items-center space-x-1 hover:bg-gray-100 px-2 py-1 rounded transition-colors text-left"
      disabled={disabled}
    >
      <Warehouse className="w-4 h-4 text-gray-400" />
      <span className="font-medium text-gray-900">{value}</span>
    </button>
  )
}