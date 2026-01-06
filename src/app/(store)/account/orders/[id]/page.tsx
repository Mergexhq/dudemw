"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
    ArrowLeft,
    Package,
    MapPin,
    CreditCard,
    Copy,
    Clock,
    Truck,
    CheckCircle,
    X
} from "lucide-react"
import type { OrderWithDetails } from "@/lib/types/orders"
import { getOrder } from "@/lib/actions/orders"
import { getStatusColor, getOrderNumber } from "@/lib/utils/order-helpers"
import { format } from "date-fns"
import { toast } from "sonner"

export default function OrderPage() {
    const params = useParams()
    const [order, setOrder] = useState<OrderWithDetails | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const result = await getOrder(params.id as string)
                if (result.success && result.data) {
                    setOrder(result.data)
                } else {
                    toast.error("Failed to load order")
                }
            } catch (error) {
                console.error("Error loading order:", error)
                toast.error("Something went wrong")
            } finally {
                setIsLoading(false)
            }
        }

        if (params.id) {
            fetchOrder()
        }
    }, [params.id])

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success("Copied to clipboard")
    }

    const getStatusStep = (status: string) => {
        const steps = ['pending', 'packed', 'shipped', 'delivered']
        if (status === 'cancelled') return -1
        return steps.indexOf(status)
    }

    if (isLoading) {
        return (
            <div className="container py-10 max-w-5xl animate-pulse space-y-8">
                <div className="h-8 w-48 bg-gray-200 rounded"></div>
                <div className="grid gap-8 md:grid-cols-3">
                    <div className="md:col-span-2 h-96 bg-gray-200 rounded"></div>
                    <div className="h-96 bg-gray-200 rounded"></div>
                </div>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="container py-20 text-center">
                <h1 className="text-2xl font-bold mb-4">Order not found</h1>
                <Button asChild>
                    <Link href="/account/orders">Back to Orders</Link>
                </Button>
            </div>
        )
    }

    const currentStep = getStatusStep(order.order_status || 'pending')

    return (
        <div className="container py-10 max-w-5xl space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Button variant="ghost" size="sm" asChild className="-ml-3 text-muted-foreground">
                            <Link href="/account/orders">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Orders
                            </Link>
                        </Button>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Order {getOrderNumber(order)}</h1>
                    <p className="text-muted-foreground mt-1">
                        Placed on {order.created_at ? format(new Date(order.created_at), "MMMM d, yyyy") : ""}
                    </p>
                </div>
                <div className="flex gap-3">
                    {order.shipping_tracking_number && (
                        <Button variant="outline" onClick={() => copyToClipboard(order.shipping_tracking_number!)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Tracking #
                        </Button>
                    )}
                    <Badge className={`text-base px-4 py-1.5 ${getStatusColor(order.order_status)}`}>
                        {order.order_status?.toUpperCase().replace("_", " ")}
                    </Badge>
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
                {/* Left Column: Tracking & Items */}
                <div className="md:col-span-2 space-y-6">

                    {/* Status Timeline */}
                    {order.order_status !== 'cancelled' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Order Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="relative">
                                    <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-100 dark:bg-gray-800"></div>
                                    <div className="space-y-8">
                                        {[
                                            { status: 'pending', label: 'Order Placed', icon: Clock, desc: 'We have received your order.' },
                                            { status: 'packed', label: 'Packed', icon: Package, desc: 'Your order is packed and ready to ship.' },
                                            { status: 'shipped', label: 'Shipped', icon: Truck, desc: order.shipping_provider ? `Shipped via ${order.shipping_provider}` : 'On the way.' },
                                            { status: 'delivered', label: 'Delivered', icon: CheckCircle, desc: 'Package delivered.' }
                                        ].map((step, index) => {
                                            const isCompleted = currentStep >= index
                                            const isCurrent = currentStep === index
                                            let timestamp: string | null | undefined = null
                                            if (step.status === 'pending') timestamp = order.created_at
                                            else if (step.status === 'shipped') timestamp = order.shipped_at
                                            else if (step.status === 'delivered') timestamp = order.delivered_at

                                            if (!timestamp && order.order_status_history) {
                                                const historyItem = order.order_status_history.find(h => h.status === step.status)
                                                if (historyItem) timestamp = historyItem.created_at
                                            }

                                            return (
                                                <div key={step.status} className="relative flex items-start gap-4 ml-2">
                                                    <div className={`z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${isCompleted ? 'border-primary bg-primary text-primary-foreground' : 'border-gray-300 bg-background text-gray-300'
                                                        }`}>
                                                        {isCompleted && <div className="h-2 w-2 rounded-full bg-white" />}
                                                    </div>
                                                    <div className={`${isCompleted ? 'text-foreground' : 'text-muted-foreground'} -mt-1`}>
                                                        <p className="font-semibold flex items-center gap-2">
                                                            {step.label}
                                                            {isCurrent && <Badge variant="secondary" className="text-xs">Current</Badge>}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">{step.desc}</p>
                                                        {timestamp && (
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                {format(new Date(timestamp), "MMM d, h:mm a")}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Cancelled State */}
                    {order.order_status === 'cancelled' && (
                        <Card className="border-red-200 bg-red-50">
                            <CardContent className="pt-6 flex items-start gap-4">
                                <X className="h-6 w-6 text-red-600" />
                                <div>
                                    <h3 className="font-semibold text-red-900">Order Cancelled</h3>
                                    <p className="text-red-700 mt-1">This order has been cancelled.</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {order.order_items.map((item) => (
                                    <div key={item.id} className="flex gap-4">
                                        <div className="h-20 w-20 bg-gray-100 rounded-md flex items-center justify-center shrink-0">
                                            <Package className="h-8 w-8 text-gray-300" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-medium line-clamp-2">{item.product_variants?.products?.title}</h4>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {item.product_variants?.name || 'Standard'}
                                                        <span className="mx-2">•</span>
                                                        Qty: {item.quantity}
                                                    </p>
                                                </div>
                                                <p className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Separator className="my-6" />

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>₹{(order.subtotal_amount ?? 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Shipping</span>
                                    <span>{order.shipping_amount ? `₹${order.shipping_amount}` : 'Free'}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg pt-4 border-t mt-4">
                                    <span>Total</span>
                                    <span>₹{(order.total_amount ?? 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Details */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Delivery Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    Shipping Address
                                </h4>
                                {order.shipping_address ? (
                                    <div className="text-sm text-muted-foreground ml-6">
                                        <p className="font-medium text-foreground">{order.shipping_address.firstName} {order.shipping_address.lastName}</p>
                                        <p>{order.shipping_address.address}</p>
                                        <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postalCode}</p>
                                        <p className="mt-1">{order.shipping_address.phone}</p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground ml-6">No address provided</p>
                                )}
                            </div>
                            <Separator />
                            <div>
                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                    Payment Method
                                </h4>
                                <div className="ml-6 space-y-2">
                                    <Badge variant="outline" className="capitalize">
                                        {order.payment_method?.replace('_', ' ') || 'Online'}
                                    </Badge>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className={`h-2 w-2 rounded-full ${order.payment_status === 'paid' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                        <span className="capitalize">{order.payment_status}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}