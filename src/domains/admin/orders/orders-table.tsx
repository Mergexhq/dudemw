"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Eye, MoreHorizontal, Package, Truck, X, Edit } from "lucide-react"
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
}

const statusColors = {
  pending: "destructive",
  processing: "secondary",
  shipped: "default",
  delivered: "outline",
  cancelled: "destructive",
  completed: "outline",
} as const

const paymentStatusColors = {
  paid: "outline",
  pending: "secondary",
  failed: "destructive",
  refunded: "secondary",
} as const

export function OrdersTable({ orders, onRefresh }: OrdersTableProps) {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
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

  const toggleOrder = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    )
  }

  const toggleAll = () => {
    setSelectedOrders(prev =>
      prev.length === orders.length ? [] : orders.map(order => order.id)
    )
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
    <div className="space-y-4">
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

      <div className="rounded-xl border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 hover:bg-gray-50/80 border-b border-gray-200/60">
              <TableHead className="w-12 font-semibold text-gray-700">
                <Checkbox
                  checked={selectedOrders.length === orders.length}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead className="font-semibold text-gray-700">Order ID</TableHead>
              <TableHead className="font-semibold text-gray-700">Customer</TableHead>
              <TableHead className="font-semibold text-gray-700">Items</TableHead>
              <TableHead className="font-semibold text-gray-700">Total</TableHead>
              <TableHead className="font-semibold text-gray-700">Status</TableHead>
              <TableHead className="font-semibold text-gray-700">Payment</TableHead>
              <TableHead className="font-semibold text-gray-700">Date</TableHead>
              <TableHead className="font-semibold text-gray-700">Address</TableHead>
              <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow
                key={order.id}
                className="hover:bg-gray-50/50 transition-colors border-b border-gray-100"
              >
                <TableCell>
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