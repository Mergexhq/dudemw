'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/domains/auth/context'
import { Package, Eye } from 'lucide-react'
import { getOrdersForUser } from '@/lib/actions/orders'

export default function OrdersPage() {
    const { user } = useAuth()
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchOrders = async () => {
            if (!user) {
                setLoading(false)
                return
            }

            try {
                setLoading(true)

                // Fetch orders using server action
                const result = await getOrdersForUser(user.id)

                if (!result.success) {
                    console.error('Error fetching orders:', result.error)
                    return
                }

                // Transform data to match expected format
                const transformedOrders = (result.orders || []).map((order: any) => ({
                    id: order.id,
                    display_id: order.id,
                    status: order.order_status || order.status,
                    created_at: order.created_at,
                    total: (order.total_amount || 0) * 100, // Convert to paise for display
                    items: (order.order_items || []).map((item: any) => ({
                        title: item.product_variants?.products?.name || item.product_variants?.products?.title || 'Product',
                        quantity: item.quantity
                    }))
                }))

                setOrders(transformedOrders)
            } catch (error) {
                console.error('Failed to fetch orders:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchOrders()
    }, [user])

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto text-center">
                    <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
                    <p className="text-gray-600 mb-6">You need to be signed in to view your orders.</p>
                    <Link
                        href="/auth/signin"
                        className="inline-block bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800"
                    >
                        Sign In
                    </Link>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-bold mb-6">My Orders</h1>
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading your orders...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">My Orders</h1>

                {orders.length === 0 ? (
                    <div className="text-center py-12">
                        <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
                        <p className="text-gray-600 mb-6">
                            When you place your first order, it will appear here.
                        </p>
                        <Link
                            href="/products"
                            className="inline-block bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800"
                        >
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-semibold text-lg">Order #{order.display_id}</h3>
                                        <p className="text-gray-600">
                                            Placed on {new Date(order.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${order.status === 'delivered'
                                            ? 'bg-green-100 text-green-800'
                                            : order.status === 'shipped'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <p className="text-gray-600">
                                        {order.items.map((item: any, index: number) => (
                                            <span key={index}>
                                                {item.title} x {item.quantity}
                                                {index < order.items.length - 1 && ', '}
                                            </span>
                                        ))}
                                    </p>
                                </div>

                                <div className="flex justify-between items-center">
                                    <div className="font-semibold text-lg">
                                        Total: ₹{(order.total / 100).toFixed(0)}
                                    </div>
                                    <Link
                                        href={`/account/orders/${order.id}`}
                                        className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800"
                                    >
                                        <Eye className="w-4 h-4" />
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="text-center mt-8">
                    <p className="text-gray-600 text-sm">
                        Your complete order history is displayed here. Contact support if you need assistance.
                    </p>
                </div>
            </div>
        </div>
    )
}
