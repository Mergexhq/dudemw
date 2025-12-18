'use client'

import { useState } from 'react'
import { InventoryItem } from '@/lib/types/inventory'
import { InventoryService } from '@/lib/services/inventory'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TableCell } from '@/components/ui/table'
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
import { toast } from 'sonner'
import { Edit, AlertTriangle } from 'lucide-react'
import { VirtualizedTable } from '@/components/common/virtualized-table'

interface InventoryTableProps {
  inventory: InventoryItem[]
  isLoading?: boolean
  onRefresh: () => void
}

const getStockStatus = (current: number, threshold: number) => {
  if (current === 0)
    return { label: 'Out of Stock', color: 'destructive' as const, icon: true }
  if (current <= threshold)
    return { label: 'Low Stock', color: 'secondary' as const, icon: true }
  return { label: 'In Stock', color: 'outline' as const, icon: false }
}

export function InventoryTable({ inventory, isLoading, onRefresh }: InventoryTableProps) {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [adjustQuantity, setAdjustQuantity] = useState('')
  const [adjustType, setAdjustType] = useState<'add' | 'subtract' | 'set'>('add')
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [isAdjusting, setIsAdjusting] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)

  const handleStockAdjustment = async () => {
    if (!selectedItem || !adjustQuantity || !adjustmentReason) {
      toast.error('Please fill in all fields')
      return
    }

    setIsAdjusting(true)
    try {
      const result = await InventoryService.adjustStock(
        {
          variant_id: selectedItem.variant_id,
          quantity: parseInt(adjustQuantity),
          reason: adjustmentReason,
          adjust_type: adjustType,
        }
      )

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

  // Define columns for virtualized table
  const columns = [
    {
      key: 'product',
      header: 'Product',
      render: (item: InventoryItem) => (
        <TableCell>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {item.product_name}
            </div>
            {item.variant_name && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
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
        <TableCell className="font-mono text-sm text-gray-700 dark:text-gray-300">
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
              <span className="font-semibold text-gray-900 dark:text-white">
                {item.quantity || 0}
              </span>
              {stockStatus.icon && (
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
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
              className={`font-medium ${
                stockStatus.color === 'destructive'
                  ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
                  : stockStatus.color === 'secondary'
                  ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800'
                  : 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
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
        <TableCell className="text-gray-700 dark:text-gray-300">
          {item.low_stock_threshold || 5}
        </TableCell>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: InventoryItem) => (
        <TableCell className="text-right">
          <Dialog open={openDialog && selectedItem?.id === item.id} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
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
    <div className="rounded-xl border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 overflow-hidden" data-testid="inventory-table">
      <VirtualizedTable
        data={inventory}
        columns={columns}
        estimatedRowHeight={80}
        isLoading={isLoading}
        emptyMessage="No inventory items found. Try adjusting your filters or add products first."
      />
    </div>
  )
}
