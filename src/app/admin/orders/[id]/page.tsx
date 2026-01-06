"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  User,
  CreditCard,
  Clock,
  Phone,
  Mail,
  X,
  CheckCircle,
  AlertCircle,
  FileText,
  History,
  Send
} from "lucide-react"
import { getOrder, updateOrderStatus, addTrackingInfo, cancelOrder } from "@/lib/actions/orders"
import { OrderWithDetails, OrderStatusHistory } from "@/lib/types/orders"
import { getCustomerName, getProductTitle, getVariantName, getStatusColor, getPaymentStatusColor, getOrderNumber } from "@/lib/utils/order-helpers"
import { formatDistanceToNow, format } from "date-fns"
import { toast } from "sonner"
import Link from "next/link"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<OrderWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  // Tracking State
  const [trackingInfo, setTrackingInfo] = useState({
    trackingNumber: '',
    carrier: 'ST Courier',
    status: ''
  })

  // Cancel State
  const [cancelDialog, setCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  // Label State
  const [isDownloadingLabel, setIsDownloadingLabel] = useState(false)

  // Status Note State
  const [statusNote, setStatusNote] = useState('')

  const fetchOrder = async () => {
    try {
      setIsLoading(true)
      const result = await getOrder(orderId)

      if (result.success && result.data) {
        setOrder(result.data)
        // Initialize tracking info if it exists
        if (result.data.shipping_tracking_number) {
          setTrackingInfo({
            trackingNumber: result.data.shipping_tracking_number,
            carrier: result.data.shipping_provider || 'ST Courier',
            status: result.data.order_status || ''
          })
        }
      } else {
        toast.error(result.error || 'Failed to fetch order')
        router.push('/admin/orders')
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      toast.error('Failed to fetch order')
      router.push('/admin/orders')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  const handleStatusUpdate = async (status: string) => {
    if (!order) return

    setIsUpdating(true)
    try {
      const result = await updateOrderStatus(order.id, status, statusNote || undefined)
      if (result.success) {
        toast.success(`Order status updated to ${status} `)
        setStatusNote('')
        fetchOrder()
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

  const handleUpdateTracking = async () => {
    if (!order) return

    if (!trackingInfo.trackingNumber) {
      toast.error('Tracking number is required')
      return
    }

    setIsUpdating(true)
    try {
      // If adding tracking for the first time or updating it
      const result = await addTrackingInfo(
        order.id,
        trackingInfo.trackingNumber,
        trackingInfo.carrier
      )

      if (result.success) {
        toast.success('Tracking information updated')
        fetchOrder()
      } else {
        toast.error(result.error || 'Failed to update tracking')
      }
    } catch (error) {
      console.error('Tracking update error:', error)
      toast.error('Failed to update tracking')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!order || !cancelReason.trim()) {
      toast.error('Please provide a cancellation reason')
      return
    }

    setIsUpdating(true)
    try {
      const result = await cancelOrder(order.id, cancelReason)
      if (result.success) {
        toast.success('Order cancelled successfully')
        setCancelDialog(false)
        setCancelReason('')
        fetchOrder()
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

  const handleDownloadLabel = async () => {
    toast.info("Label generation logic would go here")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!order) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Button variant="ghost" size="sm" className="-ml-3 h-8" asChild>
              <Link href="/admin/orders">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Orders
              </Link>
            </Button>
            <span>/</span>
            <span>Order Details</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {getOrderNumber(order)}
            </h1>
            <Badge className={getStatusColor(order.order_status)}>
              {order.order_status?.toUpperCase().replace('_', ' ')}
            </Badge>
            <Badge variant="outline" className={getPaymentStatusColor(order.payment_status)}>
              Payment: {order.payment_status?.toUpperCase()}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {order.created_at ? format(new Date(order.created_at), "MMMM d, yyyy 'at' h:mm a") : 'Unknown'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {order.order_status !== 'cancelled' && order.order_status !== 'delivered' && (
            <Button variant="destructive" onClick={() => setCancelDialog(true)}>
              <X className="mr-2 h-4 w-4" /> Cancel Order
            </Button>
          )}
          <Button variant="outline" onClick={handleDownloadLabel} disabled={isDownloadingLabel}>
            <FileText className="mr-2 h-4 w-4" />
            {isDownloadingLabel ? 'Generating...' : 'Download Label'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Order Details */}
        <div className="md:col-span-2 space-y-6">

          {/* Tracking & Status Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" /> Status & Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {/* Status Timeline */}
                {order.order_status_history && order.order_status_history.length > 0 && (
                  <div className="relative pl-4 border-l-2 border-gray-100 space-y-6">
                    {order.order_status_history.map((history, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-gray-300 ring-4 ring-white" />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <p className="font-medium text-sm uppercase">{history.status.replace('_', ' ')}</p>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(history.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        {history.note && (
                          <p className="text-sm text-gray-500 mt-1 bg-gray-50 p-2 rounded">
                            {history.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <Separator />

                {/* Actions */}
                {order.order_status !== 'cancelled' && order.order_status !== 'delivered' && (
                  <div className="grid gap-4 p-4 bg-gray-50 rounded-lg border">
                    <h4 className="font-medium text-sm">Update Tracking & Status</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Courier</Label>
                        <Select
                          value={trackingInfo.carrier}
                          onValueChange={(val) => setTrackingInfo(prev => ({ ...prev, carrier: val }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select courier" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ST Courier">ST Courier</SelectItem>
                            <SelectItem value="DTDC">DTDC</SelectItem>
                            <SelectItem value="Professional">Professional</SelectItem>
                            <SelectItem value="Delhivery">Delhivery</SelectItem>
                            <SelectItem value="BlueDart">BlueDart</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Tracking Number</Label>
                        <Input
                          placeholder="Enter tracking number"
                          value={trackingInfo.trackingNumber}
                          onChange={(e) => setTrackingInfo(prev => ({ ...prev, trackingNumber: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Update Status To</Label>
                        <Select onValueChange={(val) => handleStatusUpdate(val)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Change status..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="packed">Packed</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Note (Optional)</Label>
                        <Input
                          placeholder="Add a note about this update..."
                          value={statusNote}
                          onChange={(e) => setStatusNote(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        onClick={handleUpdateTracking}
                        disabled={isUpdating}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isUpdating ? 'Updating...' : 'Update Tracking & Ship'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" /> Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex gap-4 items-start">
                    <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{getProductTitle(item)}</p>
                          <p className="text-sm text-gray-500">
                            {getVariantName(item)}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            SKU: {item.product_variants?.sku || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₹{item.price.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                          <p className="font-medium text-sm mt-1">
                            Total: ₹{(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{(order.subtotal_amount ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>{(order.shipping_amount ?? 0) > 0 ? `₹${order.shipping_amount}` : 'Free'}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                    <span>Total</span>
                    <span>₹{(order.total_amount ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Customer Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Customer</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">{order.customer_name_snapshot || getCustomerName(order)}</p>
                <p className="text-sm text-gray-500">{order.customer_email_snapshot || order.guest_email}</p>
                <p className="text-sm text-gray-500">{order.customer_phone_snapshot}</p>
              </div>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <MapPin className="h-3 w-3" /> Shipping Address
                </h4>
                {order.shipping_address ? (
                  <div className="text-sm text-gray-600">
                    <p>{order.shipping_address.firstName} {order.shipping_address.lastName}</p>
                    <p>{order.shipping_address.address}</p>
                    <p>{order.shipping_address.city}, {order.shipping_address.state}</p>
                    <p>{order.shipping_address.postalCode}</p>
                    <p>{order.shipping_address.phone}</p>
                  </div>
                ) : <p className="text-sm text-gray-500">No address provided</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4" />
                <span>Payment</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Badge className={`${getPaymentStatusColor(order.payment_status)} font-medium text-sm px-3 py-1`}>
                {order.payment_status || 'pending'}
              </Badge>
              <div className="text-sm text-gray-500">
                <p>Method: {order.payment_method?.replace('_', ' ') || 'Online'}</p>
                {order.payment_id && <p>ID: {order.payment_id}</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Order Dialog */}
      <Dialog open={cancelDialog} onOpenChange={setCancelDialog}>
        <DialogContent className="sm:max-w-[500px] bg-white border border-gray-200 shadow-lg">
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              This will cancel the order and restore inventory. Action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cancelReason">Reason for cancellation</Label>
              <Textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g., Customer request, Payment failed, Out of stock"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialog(false)}>
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