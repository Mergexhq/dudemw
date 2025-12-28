'use client'

import React from 'react'

interface OrderDetailsProps {
    order: any // Custom order type
}

export default function OrderDetails({ order }: OrderDetailsProps) {
    if (!order) return null

    return (
        <div className="bg-white">
            <div className="space-y-6">
                <div>
                    <h3 className="font-semibold text-lg mb-4">Order Items</h3>
                    <div className="space-y-4">
                        {order.items.map((item: any) => (
                            <div key={item.id} className="flex gap-4 border-b pb-4 last:border-0 last:pb-0">
                                <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden relative">
                                    {item.thumbnail ? (
                                        <img
                                            src={item.thumbnail}
                                            alt={item.title}
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400">No img</div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <h4 className="font-medium">{item.title}</h4>
                                        <p className="font-semibold">₹{(item.total / 100).toFixed(0)}</p>
                                    </div>
                                    <p className="text-sm text-gray-600">{item.variant?.title}</p>
                                    <p className="text-sm text-gray-500 mt-1">Quantity: {item.quantity}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 pt-6 border-t">
                    <div>
                        <h3 className="font-semibold text-lg mb-2">Shipping Address</h3>
                        <div className="text-gray-700 text-sm space-y-1">
                            <p className="font-medium">
                                {order.shipping_address?.first_name} {order.shipping_address?.last_name}
                            </p>
                            <p>{order.shipping_address?.address_1}</p>
                            {order.shipping_address?.address_2 && <p>{order.shipping_address?.address_2}</p>}
                            <p>{order.shipping_address?.city}, {order.shipping_address?.province} - {order.shipping_address?.postal_code}</p>
                            <p>{order.shipping_address?.country_code?.toUpperCase()}</p>
                            <p className="mt-2 text-gray-500">{order.shipping_address?.phone}</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-lg mb-2">Order Summary</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>₹{(order.subtotal / 100).toFixed(0)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Shipping</span>
                                <span>₹{(order.shipping_total / 100).toFixed(0)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tax</span>
                                <span>₹{(order.tax_total / 100).toFixed(0)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                                <span>Total</span>
                                <span>₹{(order.total / 100).toFixed(0)}</span>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t">
                            <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold uppercase tracking-wide">
                                Payment: {order.payment_status === 'awaiting' ? 'Unpaid (COD)' : order.payment_status}
                            </span>
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold uppercase tracking-wide ml-2">
                                Status: {order.status}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
