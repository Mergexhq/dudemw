"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Calendar,
  Phone,
  Mail,
  Edit,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText
} from "lucide-react"
import { getOrder, updateOrderStatus, addTrackingInfo, cancelOrder, OrderWithDetails } from "@/lib/actions/orders"
import { getCustomerName, getOrderNumber, getProductTitle, getVariantName, formatAddress, getStatusColor, getPaymentStatusColor } from "@/lib/utils/order-helpers"
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

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<OrderWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [trackingDialog, setTrackingDialog] = useState(false)
  const [cancelDialog, setCancelDialog] = useState(false)
  const [trackingInfo, setTrackingInfo] = useState({ trackingNumber: '', carrier: '' })
  const [cancelReason, setCancelReason] = useState('')
  const [isDownloadingLabel, setIsDownloadingLabel] = useState(false)

  const fetchOrder = async () => {
    try {
      setIsLoading(true)
      const result = await getOrder(orderId)

      if (result.success && result.data) {
        setOrder(result.data)
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
      const result = await updateOrderStatus(order.id, status)
      if (result.success) {
        toast.success(`Order status updated to ${status}`)
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

  const handleAddTracking = async () => {
    if (!order || !trackingInfo.trackingNumber || !trackingInfo.carrier) {
      toast.error('Please provide tracking number and carrier')
      return
    }

    setIsUpdating(true)
    try {
      const result = await addTrackingInfo(
        order.id,
        trackingInfo.trackingNumber,
        trackingInfo.carrier
      )
      if (result.success) {
        toast.success('Tracking information added')
        setTrackingDialog(false)
        setTrackingInfo({ trackingNumber: '', carrier: '' })
        fetchOrder()
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
    if (!order) return

    setIsDownloadingLabel(true)
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/label`)

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
      const filename = filenameMatch ? filenameMatch[1] : `shipping-label-${order.id.substring(0, 8)}.pdf`
      
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
      setIsDownloadingLabel(false)
    }
  }

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'processing':
        return <Package className="h-4 w-4" />
      case 'shipped':
        return <Truck className="h-4 w-4" />
      case 'delivered':
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'cancelled':
        return <X className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h2>
        <p className="text-gray-600 mb-6">The order you're looking for doesn't exist.</p>
        <Button asChild>
          <Link href="/admin/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Order {getOrderNumber(order)}
            </h1>
            <p className="text-gray-600 mt-1">
              Placed {order.created_at ? formatDistanceToNow(new Date(order.created_at), { addSuffix: true }) : 'Unknown'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleDownloadLabel}
            disabled={isDownloadingLabel}
            className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
            data-testid="download-shipping-label-btn"
          >
            <FileText className="mr-2 h-4 w-4" />
            {isDownloadingLabel ? 'Generating...' : 'Download Label'}
          </Button>
          {order.order_status === 'pending' && (
            <Button
              variant="outline"
              onClick={() => handleStatusUpdate('processing')}
              disabled={isUpdating}
            >
              <Package className="mr-2 h-4 w-4" />
              Mark as Processing
            </Button>
          )}
          {(order.order_status === 'pending' || order.order_status === 'processing') && (
            <Button
              variant="outline"
              onClick={() => setTrackingDialog(true)}
              disabled={isUpdating}
            >
              <Truck className="mr-2 h-4 w-4" />
              Add Tracking & Ship
            </Button>
          )}
          {order.order_status === 'shipped' && (
            <Button
              variant="outline"
              onClick={() => handleStatusUpdate('delivered')}
              disabled={isUpdating}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark as Delivered
            </Button>
          )}
          {order.order_status !== 'cancelled' && order.order_status !== 'delivered' && order.order_status !== 'completed' && (
            <Button
              variant="destructive"
              onClick={() => setCancelDialog(true)}
              disabled={isUpdating}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Order Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {getStatusIcon(order.order_status)}
              <span>Order Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge className={`${getStatusColor(order.order_status)} font-medium text-sm px-3 py-1`}>
              {order.order_status || 'pending'}
            </Badge>

            {order.shipping_tracking_number && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Tracking Information</p>
                <div className="text-sm text-gray-600">
                  <p><strong>Carrier:</strong> {order.shipping_provider}</p>
                  <p><strong>Tracking:</strong> {order.shipping_tracking_number}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Timeline</p>
              <div className="text-sm text-gray-600 space-y-1">
                {order.created_at && (
                  <p><strong>Created:</strong> {format(new Date(order.created_at), 'PPp')}</p>
                )}
                {order.updated_at && (
                  <p><strong>Updated:</strong> {format(new Date(order.updated_at), 'PPp')}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Customer</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium text-gray-900">
                {order.customer_name_snapshot || getCustomerName(order)}
              </p>
              <div className="text-sm text-gray-600 space-y-1 mt-2">
                {(order.customer_email_snapshot || order.guest_email) && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-3 w-3" />
                    <span>{order.customer_email_snapshot || order.guest_email}</span>
                  </div>
                )}
                {order.customer_phone_snapshot && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-3 w-3" />
                    <span>{order.customer_phone_snapshot}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
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

            <div className="space-y-2">
              {order.shipping_amount && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-medium">₹{order.shipping_amount.toLocaleString()}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>₹{(order.total_amount || 0).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.order_items?.map((item, index) => (
                <div key={item.id || index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{getProductTitle(item)}</p>
                    <p className="text-sm text-gray-600">{getVariantName(item)}</p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{(item.price || 0).toLocaleString()}</p>
                    <p className="text-sm text-gray-600">
                      Total: ₹{((item.price || 0) * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              )) || (
                  <p className="text-gray-500">No items found</p>
                )}
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Shipping Address</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {order.shipping_address ? (
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>{order.shipping_address.firstName} {order.shipping_address.lastName}</strong></p>
                <p>{order.shipping_address.address}</p>
                <p>{order.shipping_address.city}, {order.shipping_address.state}</p>
                <p>{order.shipping_address.postalCode}</p>
                <p>{order.shipping_address.phone}</p>
              </div>
            ) : (
              <p className="text-gray-500">No shipping address provided</p>
            )}
          </CardContent>
        </Card>
      </div>



      {/* Add Tracking Dialog */}
      <Dialog open={trackingDialog} onOpenChange={setTrackingDialog}>
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
                onChange={(e) => setTrackingInfo({ ...trackingInfo, trackingNumber: e.target.value })}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrackingDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTracking} disabled={isUpdating}>
              {isUpdating ? 'Adding...' : 'Add Tracking & Ship'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Order Dialog */}
      <Dialog open={cancelDialog} onOpenChange={setCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              This will cancel the order and restore inventory. Please provide a reason for cancellation.
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