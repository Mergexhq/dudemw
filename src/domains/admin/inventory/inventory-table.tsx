'use client'

import React, { useState } from 'react'
import { InventoryItem } from '@/lib/types/inventory'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Edit, AlertTriangle, Package, Hash } from 'lucide-react'

interface InventoryTableProps {
  inventory: InventoryItem[]
  isLoading?: boolean
  onRefresh: () => void
  onFilterChange?: (key: string, value: any) => void
  currentFilters?: any
}

interface ProductSummary {
  id: string
  product_name: string
  total_quantity: number
  total_variants: number
  low_stock_variants: number
  out_of_stock_variants: number
  variants: InventoryItem[]
}

const getStockStatus = (current: number, threshold: number) => {
  if (current <= 0)
    return { label: 'Out of Stock', color: 'destructive' as const, icon: true }
  if (current <= threshold)
    return { label: 'Low Stock', color: 'secondary' as const, icon: true }
  return { label: 'In Stock', color: 'outline' as const, icon: false }
}

export function InventoryTable({
  inventory,
  isLoading,
  onRefresh,
  onFilterChange,
  currentFilters
}: InventoryTableProps) {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [adjustQuantity, setAdjustQuantity] = useState('')
  const [adjustType, setAdjustType] = useState<'add' | 'subtract' | 'set'>('add')
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [isAdjusting, setIsAdjusting] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [viewMode, setViewMode] = useState<'product' | 'sku'>(
    currentFilters?.productId ? 'sku' : 'product'
  )

  // Update viewMode if productId filter changes
  React.useEffect(() => {
    if (currentFilters?.productId) {
      setViewMode('sku')
    }
  }, [currentFilters?.productId])

  // Aggregate inventory by product for product view
  const aggregateByProduct = (items: InventoryItem[]): ProductSummary[] => {
    const productMap = new Map<string, ProductSummary>()

    items.forEach(item => {
      const productKey = `${item.product_id}-${item.product_name}`

      if (!productMap.has(productKey)) {
        productMap.set(productKey, {
          id: item.product_id,
          product_name: item.product_name,
          total_quantity: 0,
          total_variants: 0,
          low_stock_variants: 0,
          out_of_stock_variants: 0,
          variants: []
        })
      }

      const product = productMap.get(productKey)!
      product.total_quantity += item.quantity || 0
      product.total_variants += 1
      product.variants.push(item)

      const quantity = item.quantity || 0
      const threshold = item.low_stock_threshold || 5

      if (quantity <= 0) {
        product.out_of_stock_variants += 1
      } else if (quantity <= threshold) {
        product.low_stock_variants += 1
      }
    })

    return Array.from(productMap.values()).sort((a, b) => a.product_name.localeCompare(b.product_name))
  }

  const productSummaries = aggregateByProduct(inventory)
  const displayData = viewMode === 'product' ? productSummaries : inventory

  const handleStockAdjustment = async () => {
    if (!selectedItem || !adjustQuantity || !adjustmentReason) {
      toast.error('Please fill in all fields')
      return
    }

    setIsAdjusting(true)
    try {
      const response = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variant_id: selectedItem.variant_id,
          quantity: parseInt(adjustQuantity),
          reason: adjustmentReason,
          adjust_type: adjustType,
        }),
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Stock updated successfully')
        setOpenDialog(false)
        setSelectedItem(null)
        setAdjustQuantity('')
        setAdjustmentReason('')
        setAdjustType('add')
        onRefresh()
      } else {
        toast.error(result.error || 'Failed to update stock')
      }
    } catch (error) {
      console.error('Error adjusting stock:', error)
      toast.error('Failed to update stock')
    } finally {
      setIsAdjusting(false)
    }
  }

  // Define columns for table based on view mode
  const columns = viewMode === 'product' ? [
    {
      key: 'product',
      header: 'Product',
      render: (item: ProductSummary) => (
        <TableCell>
          <div>
            <div className="font-semibold text-gray-900">
              {item.product_name}
            </div>
            <div className="text-sm text-gray-600">
              {item.total_variants} variant{item.total_variants !== 1 ? 's' : ''}
            </div>
          </div>
        </TableCell>
      ),
    },
    {
      key: 'total_stock',
      header: 'Total Stock',
      render: (item: ProductSummary) => (
        <TableCell>
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gray-900">
              {item.total_quantity}
            </span>
            {(item.low_stock_variants > 0 || item.out_of_stock_variants > 0) && (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
          </div>
        </TableCell>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: ProductSummary) => (
        <TableCell>
          <div className="flex flex-col space-y-1">
            {item.out_of_stock_variants > 0 && (
              <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                {item.out_of_stock_variants} out of stock
              </Badge>
            )}
            {item.low_stock_variants > 0 && (
              <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">
                {item.low_stock_variants} low stock
              </Badge>
            )}
            {item.out_of_stock_variants === 0 && item.low_stock_variants === 0 && (
              <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                All in stock
              </Badge>
            )}
          </div>
        </TableCell>
      ),
    },
    {
      key: 'variants',
      header: 'Variants',
      render: (item: ProductSummary) => (
        <TableCell>
          <div className="text-sm text-gray-600">
            {item.variants.slice(0, 3).map(variant => variant.variant_name || 'Default').join(', ')}
            {item.variants.length > 3 && ` +${item.variants.length - 3} more`}
          </div>
        </TableCell>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: ProductSummary) => (
        <TableCell className="text-right pr-6">
          <Button
            variant="outline"
            size="sm"
            className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
            onClick={() => {
              if (onFilterChange) {
                onFilterChange('productId', item.id)
              }
              setViewMode('sku')
            }}
          >
            View Variants
          </Button>
        </TableCell>
      ),
    },
  ] : [
    {
      key: 'variant',
      header: 'Product & Variant',
      render: (item: InventoryItem) => (
        <TableCell>
          <div>
            <div className="font-semibold text-gray-900">
              {item.product_name}
            </div>
            {item.variant_name && (
              <div className="text-sm text-gray-600">
                {item.variant_name}
              </div>
            )}
          </div>
        </TableCell>
      ),
    },
    {
      key: 'sku',
      header: 'SKU',
      render: (item: InventoryItem) => (
        <TableCell className="font-mono text-sm text-gray-700">
          {item.sku || 'N/A'}
        </TableCell>
      ),
    },
    {
      key: 'stock',
      header: 'Current Stock',
      render: (item: InventoryItem) => {
        const stockStatus = getStockStatus(
          item.quantity || 0,
          item.low_stock_threshold || 5
        )
        return (
          <TableCell>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-900">
                {item.quantity || 0}
              </span>
              {stockStatus.icon && (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
            </div>
          </TableCell>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: InventoryItem) => {
        const stockStatus = getStockStatus(
          item.quantity || 0,
          item.low_stock_threshold || 5
        )
        return (
          <TableCell>
            <Badge
              className={`font-medium ${stockStatus.color === 'destructive'
                ? 'bg-red-100 text-red-700 border-red-200'
                : stockStatus.color === 'secondary'
                  ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                  : 'bg-green-100 text-green-700 border-green-200'
                }`}
            >
              {stockStatus.label}
            </Badge>
          </TableCell>
        )
      },
    },
    {
      key: 'threshold',
      header: 'Threshold',
      render: (item: InventoryItem) => (
        <TableCell className="text-gray-700">
          {item.low_stock_threshold || 5}
        </TableCell>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: InventoryItem) => (
        <TableCell className="text-right pr-6">
          <Dialog open={openDialog && selectedItem?.id === item.id} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-gray-100"
                onClick={() => {
                  setSelectedItem(item)
                  setOpenDialog(true)
                }}
                data-testid={`adjust-stock-${item.id}`}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adjust Stock</DialogTitle>
                <DialogDescription>
                  Make manual adjustments to inventory levels for{' '}
                  {item.product_name}
                  {item.variant_name && ` (${item.variant_name})`}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Current Stock</Label>
                    <div className="text-2xl font-bold">
                      {item.quantity || 0}
                    </div>
                  </div>
                  <div>
                    <Label>Low Stock Threshold</Label>
                    <div className="text-lg">{item.low_stock_threshold || 5}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adjust-type">Adjustment Type</Label>
                  <Select
                    value={adjustType}
                    onValueChange={(value: any) => setAdjustType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="add">Add Stock</SelectItem>
                      <SelectItem value="subtract">Subtract Stock</SelectItem>
                      <SelectItem value="set">Set Stock Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adjustment">
                    {adjustType === 'set' ? 'New Stock Level' : 'Quantity'}
                  </Label>
                  <Input
                    id="adjustment"
                    type="number"
                    value={adjustQuantity}
                    onChange={(e) => setAdjustQuantity(e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                  {adjustType !== 'set' && (
                    <p className="text-sm text-muted-foreground">
                      New stock level:{' '}
                      {adjustType === 'add'
                        ? (item.quantity || 0) + (parseInt(adjustQuantity) || 0)
                        : (item.quantity || 0) - (parseInt(adjustQuantity) || 0)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Adjustment</Label>
                  <Input
                    id="reason"
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    placeholder="e.g., Damaged goods, Found stock, etc."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setOpenDialog(false)
                    setSelectedItem(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStockAdjustment}
                  disabled={isAdjusting}
                  data-testid="confirm-adjust-stock"
                >
                  {isAdjusting ? 'Updating...' : 'Update Stock'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TableCell>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'product' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setViewMode('product')
              if (onFilterChange && currentFilters?.productId) {
                onFilterChange('productId', undefined)
              }
            }}
            className={viewMode === 'product' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            <Package className="h-4 w-4 mr-2" />
            Product View
          </Button>
          <Button
            variant={viewMode === 'sku' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('sku')}
            className={viewMode === 'sku' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            <Hash className="h-4 w-4 mr-2" />
            SKU View
          </Button>
        </div>

        {currentFilters?.productId && (
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              Filtering by Product ID: {currentFilters.productId.slice(0, 8)}...
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-red-600 h-8 px-2"
              onClick={() => onFilterChange?.('productId', undefined)}
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      <Card className="border-0 shadow-sm overflow-hidden" data-testid="inventory-table">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-gray-900">
              {viewMode === 'product' ? `Products (${productSummaries.length})` : `Inventory Items (${inventory.length})`}
            </CardTitle>
            <div className="hidden sm:flex items-center space-x-3 text-sm text-gray-500">
              <span className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-1" />
                In Stock
              </span>
              <span className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1" />
                Low Stock
              </span>
              <span className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-1" />
                Out of Stock
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="animate-pulse space-y-2 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          ) : displayData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No inventory items found. Try adjusting your filters or add products first.
            </div>
          ) : (
            <div className="overflow-auto max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead key={column.key}>{column.header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayData.map((item, index) => (
                    <TableRow key={viewMode === 'product' ? (item as ProductSummary).id : (item as InventoryItem).id}>
                      {columns.map((column) => (
                        <React.Fragment key={column.key}>
                          {column.render(item as any)}
                        </React.Fragment>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
