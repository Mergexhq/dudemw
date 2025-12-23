'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { useAuth } from '@/domains/auth/context'

export default function OrderConfirmedPage() {
  const params = useParams()
  const { user } = useAuth()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true)

        // Get guest ID from local storage if available (must match key in guest-session.ts)
        const guestId = typeof window !== 'undefined' ? localStorage.getItem('dude_guest_session_id') : null

        // Fetch order securely via server action
        // Pass user ID from client for authorization (fixes server action auth issue)
        const { getOrderForConfirmation } = await import('@/lib/actions/orders')
        const result = await getOrderForConfirmation(params.id as string, guestId, user?.id || null)

        if (!result.success || !result.order) {
          console.error('Error fetching order:', result.error)
          setOrder(null)
          return
        }

        const orderData = result.order as any

        // Use shipping_address JSONB directly from the order
        const shippingAddress = orderData.shipping_address;
        const transformedOrder = {
          id: orderData.id,
          display_id: orderData.id?.slice(-8).toUpperCase() || orderData.id,
          status: orderData.order_status || 'pending',
          payment_status: orderData.payment_status,
          payment_method: orderData.payment_method,
          created_at: orderData.created_at,
          items: orderData.order_items?.map((item: any) => ({
            id: item.id,
            title: item.product_variants?.products?.title || 'Product',
            quantity: item.quantity,
            unit_price: item.price, // Use 'price' column, already in rupees
            thumbnail: item.product_variants?.products?.product_images?.[0]?.image_url || '/images/placeholder.jpg'
          })) || [],
          subtotal: orderData.subtotal_amount,
          shipping: orderData.shipping_amount,
          tax: orderData.tax_amount,
          total: orderData.total_amount, // Already in rupees
          shipping_address: shippingAddress ? {
            first_name: shippingAddress.firstName || '',
            last_name: shippingAddress.lastName || '',
            address_1: shippingAddress.address,
            city: shippingAddress.city,
            province: shippingAddress.state,
            postal_code: shippingAddress.postalCode,
            phone: shippingAddress.phone
          } : null
        }

        setOrder(transformedOrder)
      } catch (error) {
        console.error('Failed to fetch order:', error)
        setOrder(null)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchOrder()
    }
  }, [params.id, user?.id])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-6">We couldn't find the order you're looking for.</p>
          <Link
            href="/"
            className="inline-block bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800"
          >
            Return Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
          <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-gray-600">
            Thank you for your order. We'll send you a confirmation email shortly.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Order Details</h2>

          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="font-medium">Order ID:</span>
              <span>#{order.display_id}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Status:</span>
              <span className="text-green-600 font-medium">{order.status}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Date:</span>
              <span>{new Date(order.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold mb-2">Items</h3>
            {order.items.length > 0 ? order.items.map((item: any) => (
              <div key={item.id} className="flex justify-between py-1">
                <span>{item.title} x {item.quantity}</span>
                <span>₹{item.unit_price?.toFixed(2)}</span>
              </div>
            )) : (
              <p className="text-gray-500 text-sm">Items are being processed...</p>
            )}
          </div>

          <div className="border-t pt-4 mt-4 space-y-2">
            {order.subtotal && (
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₹{Number(order.subtotal).toFixed(2)}</span>
              </div>
            )}
            {order.shipping && (
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>₹{Number(order.shipping).toFixed(2)}</span>
              </div>
            )}
            {order.tax && (
              <div className="flex justify-between text-sm">
                <span>Tax (GST)</span>
                <span>₹{Number(order.tax).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span>₹{Number(order.total).toFixed(2)}</span>
            </div>
          </div>

          {order.shipping_address && (
            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-2">Shipping Address</h3>
              <p className="text-gray-600">
                {order.shipping_address.first_name} {order.shipping_address.last_name}<br />
                {order.shipping_address.address_1}<br />
                {order.shipping_address.city}, {order.shipping_address.province} {order.shipping_address.postal_code}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <Link
            href="/profile?section=track-order"
            className="flex-1 bg-black text-white text-center py-3 rounded-lg font-semibold hover:bg-gray-800"
          >
            Track Order
          </Link>
          <Link
            href="/products"
            className="flex-1 bg-gray-200 text-gray-800 text-center py-3 rounded-lg font-semibold hover:bg-gray-300"
          >
            Continue Shopping
          </Link>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-600 text-sm">
            You will receive an email confirmation shortly with tracking information.
          </p>
        </div>
      </div>
    </div>
  )
}