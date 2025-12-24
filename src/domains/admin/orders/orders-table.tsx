"use client"

import React, { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Eye, MoreHorizontal, Package, Truck, X, Edit, ShoppingCart, FileText } from "lucide-react"
import {
  OrderWithDetails,
  updateOrderStatus,
  bulkUpdateOrderStatus,
  addTrackingInfo,
  cancelOrder
} from "@/lib/actions/orders"
import {
  getCustomerName,
  getOrderNumber,
  getItemsCount,
  formatAddress,
  getStatusColor,
  getPaymentStatusColor
} from "@/lib/utils/order-helpers"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import Link from "next/link"

interface OrdersTableProps {
  orders: OrderWithDetails[]
  onRefresh: () => void
  selectedOrders?: string[]
  onSelectionChange?: (selected: string[]) => void
}

export function OrdersTable({ orders, onRefresh, selectedOrders: externalSelectedOrders, onSelectionChange }: OrdersTableProps) {
  const [selectedOrders, setSelectedOrders] = useState<string[]>(externalSelectedOrders || [])
  const [isUpdating, setIsUpdating] = useState(false)
  const [trackingDialog, setTrackingDialog] = useState<{ open: boolean; orderId: string }>({
    open: false,
    orderId: ''
  })
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; orderId: string }>({
    open: false,
    orderId: ''
  })
  const [trackingInfo, setTrackingInfo] = useState({
    trackingNumber: '',
    carrier: '',
    trackingUrl: ''
  })
  const [cancelReason, setCancelReason] = useState('')
  const [isDownloadingLabel, setIsDownloadingLabel] = useState<string | null>(null)

  // Sync with external selection if provided
  React.useEffect(() => {
    if (externalSelectedOrders) {
      setSelectedOrders(externalSelectedOrders)
    }
  }, [externalSelectedOrders])

  const toggleOrder = (orderId: string) => {
    const newSelection = selectedOrders.includes(orderId)
      ? selectedOrders.filter(id => id !== orderId)
      : [...selectedOrders, orderId]
    
    setSelectedOrders(newSelection)
    onSelectionChange?.(newSelection)
  }

  const toggleAll = () => {
    const newSelection = selectedOrders.length === orders.length ? [] : orders.map(order => order.id)
    setSelectedOrders(newSelection)
    onSelectionChange?.(newSelection)
  }

  const handleDownloadLabel = async (orderId: string) => {
    setIsDownloadingLabel(orderId)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/label`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate label')
      }

      // Download the PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      // Get filename from Content-Disposition header if available
      const contentDisposition = response.headers.get('Content-Disposition')
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch ? filenameMatch[1] : `shipping-label-${orderId.substring(0, 8)}.pdf`
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Shipping label downloaded successfully')
    } catch (error) {
      console.error('Download label error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to download label')
    } finally {
      setIsDownloadingLabel(null)
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedOrders.length === 0) return

    setIsUpdating(true)
    try {
      const result = await bulkUpdateOrderStatus(selectedOrders, action)
      if (result.success) {
        toast.success(`${result.updated} orders updated to ${action}`)
        setSelectedOrders([])
        onRefresh()
      } else {
        toast.error(result.error || 'Failed to update orders')
      }
    } catch (error) {
      console.error('Bulk action error:', error)
      toast.error('Failed to update orders')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleStatusUpdate = async (orderId: string, status: string) => {
    setIsUpdating(true)
    try {
      const result = await updateOrderStatus(orderId, status)
      if (result.success) {
        toast.success(`Order status updated to ${status}`)
        onRefresh()
      } else {
        toast.error(result.error || 'Failed to update order status')
      }
    } catch (error) {
      console.error('Status update error:', error)
      toast.error('Failed to update order status')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAddTracking = async () => {
    if (!trackingInfo.trackingNumber || !trackingInfo.carrier) {
      toast.error('Please provide tracking number and carrier')
      return
    }

    setIsUpdating(true)
    try {
      const result = await addTrackingInfo(
        trackingDialog.orderId,
        trackingInfo.trackingNumber,
        trackingInfo.carrier
      )

      if (result.success) {
        toast.success('Tracking information added')
        setTrackingDialog({ open: false, orderId: '' })
        setTrackingInfo({ trackingNumber: '', carrier: '', trackingUrl: '' })
        onRefresh()
      } else {
        toast.error(result.error || 'Failed to add tracking information')
      }
    } catch (error) {
      console.error('Add tracking error:', error)
      toast.error('Failed to add tracking information')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a cancellation reason')
      return
    }

    setIsUpdating(true)
    try {
      const result = await cancelOrder(cancelDialog.orderId, cancelReason)
      if (result.success) {
        toast.success('Order cancelled successfully')
        setCancelDialog({ open: false, orderId: '' })
        setCancelReason('')
        onRefresh()
      } else {
        toast.error(result.error || 'Failed to cancel order')
      }
    } catch (error) {
      console.error('Cancel order error:', error)
      toast.error('Failed to cancel order')
    } finally {
      setIsUpdating(false)
    }
  }

  if (orders.length === 0) {
    return null
  }

  return (
    <div className="space-y-4" data-testid="orders-table">
      {selectedOrders.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-red-50/50 rounded-xl border border-red-200/50">
          <span className="text-sm font-semibold text-gray-900">
            {selectedOrders.length} order(s) selected
          </span>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
              onClick={() => handleBulkAction('processing')}
            >
              <Package className="mr-2 h-4 w-4" />
              Mark as Processing
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
              onClick={() => handleBulkAction('shipped')}
            >
              <Truck className="mr-2 h-4 w-4" />
              Mark as Shipped
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
              onClick={() => handleBulkAction('cancelled')}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel Orders
            </Button>
          </div>
        </div>
      )}

      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50" data-testid="orders-table-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-red-600" />
              Orders ({orders.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="w-12">
                      <Checkbox
                        checked={selectedOrders.includes(order.id)}
                        onCheckedChange={() => toggleOrder(order.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono font-semibold text-gray-900">
                      {getOrderNumber(order)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-semibold text-gray-900">{getCustomerName(order)}</div>
                        <div className="text-sm text-gray-600">{order.guest_email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-700">{getItemsCount(order)}</TableCell>
                    <TableCell className="font-semibold text-gray-900">
                      ₹{(order.total_amount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={`font-medium ${getStatusColor(order.order_status)}`}>
                        {order.order_status || 'pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                        {order.payment_status || 'pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {order.created_at
                        ? formatDistanceToNow(new Date(order.created_at), { addSuffix: true })
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-gray-600 max-w-32 truncate">
                      {formatAddress(order.shipping_address)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                            disabled={isUpdating}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/orders/${order.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDownloadLabel(order.id)}
                            disabled={isDownloadingLabel === order.id}
                            data-testid="download-label-menu-item"
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            {isDownloadingLabel === order.id ? 'Downloading...' : 'Download Label'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {order.order_status === 'pending' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(order.id, 'processing')}
                            >
                              <Package className="mr-2 h-4 w-4" />
                              Mark as Processing
                            </DropdownMenuItem>
                          )}
                          {(order.order_status === 'pending' || order.order_status === 'processing') && (
                            <DropdownMenuItem
                              onClick={() => setTrackingDialog({ open: true, orderId: order.id })}
                            >
                              <Truck className="mr-2 h-4 w-4" />
                              Add Tracking & Ship
                            </DropdownMenuItem>
                          )}
                          {order.order_status === 'shipped' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(order.id, 'delivered')}
                            >
                              <Package className="mr-2 h-4 w-4" />
                              Mark as Delivered
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => setTrackingDialog({ open: true, orderId: order.id })}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Tracking
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {order.order_status !== 'cancelled' && order.order_status !== 'delivered' && (
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => setCancelDialog({ open: true, orderId: order.id })}
                            >
                              <X className="mr-2 h-4 w-4" />
                              Cancel Order
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Tracking Dialog */}
      <Dialog
        open={trackingDialog.open}
        onOpenChange={(open) => setTrackingDialog({ open, orderId: '' })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tracking Information</DialogTitle>
            <DialogDescription>
              Add tracking details to mark this order as shipped and notify the customer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="trackingNumber">Tracking Number *</Label>
              <Input
                id="trackingNumber"
                value={trackingInfo.trackingNumber}
                onChange={(e) =>
                  setTrackingInfo({ ...trackingInfo, trackingNumber: e.target.value })
                }
                placeholder="Enter tracking number"
              />
            </div>
            <div>
              <Label htmlFor="carrier">Shipping Carrier *</Label>
              <Input
                id="carrier"
                value={trackingInfo.carrier}
                onChange={(e) => setTrackingInfo({ ...trackingInfo, carrier: e.target.value })}
                placeholder="e.g., FedEx, UPS, DHL, India Post"
              />
            </div>
            <div>
              <Label htmlFor="trackingUrl">Tracking URL (Optional)</Label>
              <Input
                id="trackingUrl"
                value={trackingInfo.trackingUrl}
                onChange={(e) =>
                  setTrackingInfo({ ...trackingInfo, trackingUrl: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTrackingDialog({ open: false, orderId: '' })}
            >
              Cancel
            </Button>
            <Button onClick={handleAddTracking} disabled={isUpdating}>
              {isUpdating ? 'Adding...' : 'Add Tracking & Ship'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Order Dialog */}
      <Dialog
        open={cancelDialog.open}
        onOpenChange={(open) => setCancelDialog({ open, orderId: '' })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              This will cancel the order and restore inventory. Please provide a reason for
              cancellation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cancelReason">Cancellation Reason *</Label>
              <Textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g., Customer requested cancellation, Out of stock, Payment failed"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialog({ open: false, orderId: '' })}
            >
              Keep Order
            </Button>
            <Button variant="destructive" onClick={handleCancelOrder} disabled={isUpdating}>
              {isUpdating ? 'Cancelling...' : 'Cancel Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
