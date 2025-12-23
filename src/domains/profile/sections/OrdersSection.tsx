'use client'

import { useState, useEffect } from 'react'
import { Package } from 'lucide-react'
import { useAuth } from '@/domains/auth/context'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
type OrderTab = 'active' | 'completed' | 'cancelled'

interface OrderItem {
  id: string
  product_title: string
  variant_name?: string
  quantity: number
  price: number
  thumbnail?: string
}

interface Order {
  id: string
  order_number: string
  created_at: string
  order_status: OrderStatus
  payment_status: string
  total_amount: number
  items: OrderItem[]
}

export default function OrdersSection() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<OrderTab>('active')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const supabase = createClient()

        // Fetch orders with items
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            order_number,
            created_at,
            order_status,
            payment_status,
            total_amount,
            order_items (
              id,
              quantity,
              price,
              product_variants (
                id,
                name,
                products (
                  title,
                  product_images (
                    image_url
                  )
                )
              )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching orders:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            fullError: error
          })
          setOrders([])
          return
        }

        // Transform the data
        console.log('Orders fetched successfully:', { count: data?.length || 0, data })

        const transformedOrders: Order[] = (data || []).map((order: any) => ({
          id: order.id,
          order_number: order.order_number || order.id.slice(-8).toUpperCase(),
          created_at: order.created_at,
          order_status: order.order_status as OrderStatus,
          payment_status: order.payment_status,
          total_amount: order.total_amount,
          items: (order.order_items || []).map((item: any) => ({
            id: item.id,
            product_title: item.product_variants?.products?.title || 'Product',
            variant_name: item.product_variants?.name,
            quantity: item.quantity,
            price: item.price,
            thumbnail: item.product_variants?.products?.product_images?.[0]?.image_url
          }))
        }))

        setOrders(transformedOrders)
      } catch (error) {
        console.error('Failed to fetch orders:', error)
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [user?.id])

  const getStatusColor = (status: OrderStatus) => {
    const colors = {
      pending: 'text-yellow-600',
      processing: 'text-blue-600',
      shipped: 'text-purple-600',
      delivered: 'text-green-600',
      cancelled: 'text-red-600'
    }
    return colors[status] || 'text-gray-600'
  }

  const getStatusText = (status: OrderStatus) => {
    const texts = {
      pending: 'Pending',
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    }
    return texts[status] || 'Unknown'
  }

  const filterOrders = () => {
    switch (activeTab) {
      case 'active':
        return orders.filter(o => ['pending', 'processing', 'shipped'].includes(o.order_status))
      case 'completed':
        return orders.filter(o => o.order_status === 'delivered')
      case 'cancelled':
        return orders.filter(o => o.order_status === 'cancelled')
      default:
        return orders
    }
  }

  const filteredOrders = filterOrders()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
        <p className="text-gray-600">
          Check the status of recent orders, manage returns, and discover similar products.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-3 px-1 font-medium transition-colors relative ${activeTab === 'active'
            ? 'text-red-600'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          Active
          {activeTab === 'active' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`pb-3 px-1 font-medium transition-colors relative ${activeTab === 'completed'
            ? 'text-red-600'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          Completed
          {activeTab === 'completed' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('cancelled')}
          className={`pb-3 px-1 font-medium transition-colors relative ${activeTab === 'cancelled'
            ? 'text-red-600'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          Cancelled
          {activeTab === 'cancelled' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />
          )}
        </button>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold mb-2 text-gray-900">No Orders Found</h3>
          <p className="text-gray-600 mb-6">
            {activeTab === 'active' && "You don't have any active orders"}
            {activeTab === 'completed' && "You don't have any completed orders"}
            {activeTab === 'cancelled' && "You don't have any cancelled orders"}
          </p>
          <Link
            href="/products"
            className="inline-block bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              {/* Order Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    Order #{order.order_number}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`font-semibold ${getStatusColor(order.order_status)}`}>
                    {getStatusText(order.order_status)}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    ₹{order.total_amount.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                {order.items.length > 0 ? (
                  order.items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                        {item.thumbnail ? (
                          <img
                            src={item.thumbnail}
                            alt={item.product_title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-10 h-10 text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {item.product_title}
                        </p>
                        {item.variant_name && (
                          <p className="text-sm text-gray-500">
                            Variant: {item.variant_name}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 mt-1">
                          Qty: {item.quantity} × ₹{item.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm text-center py-4">
                    Items are being processed...
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  View Details
                </Link>
                {order.order_status !== 'cancelled' && order.order_status !== 'delivered' && (
                  <Link
                    href={`/profile?section=track-order&order=${order.order_number}`}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Track Order
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
