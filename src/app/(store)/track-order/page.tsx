"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { getGuestOrder } from "@/lib/actions/orders"
import { Package, Truck, CheckCircle, Clock, MapPin, Search, ArrowRight, X, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import type { OrderWithDetails } from "@/lib/types/orders"
import { getStatusColor } from "@/lib/utils/order-helpers"

const trackOrderSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required"),
  emailOrPhone: z.string().min(1, "Email or Phone is required"),
})

type TrackOrderValues = z.infer<typeof trackOrderSchema>

export default function TrackOrderPage() {
  const [order, setOrder] = useState<OrderWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const form = useForm<TrackOrderValues>({
    resolver: zodResolver(trackOrderSchema),
    defaultValues: {
      orderNumber: "",
      emailOrPhone: "",
    },
  })

  const onSubmit = async (values: TrackOrderValues) => {
    setIsLoading(true)
    setOrder(null)
    setHasSearched(false)

    try {
      const result = await getGuestOrder(values.orderNumber, values.emailOrPhone)

      if (result.success) {
        setOrder((result as any).data as OrderWithDetails)
      } else {
        toast.error(result.error || "Order not found or details incorrect")
      }
    } catch (error) {
      console.error("Tracking error:", error)
      toast.error("Failed to track order")
    } finally {
      setIsLoading(false)
      setHasSearched(true)
    }
  }

  const getStatusStep = (status: string) => {
    const steps = ['pending', 'packed', 'shipped', 'delivered']
    if (status === 'cancelled') return -1
    return steps.indexOf(status)
  }

  const currentStep = order ? getStatusStep(order.order_status || 'pending') : 0

  return (
    <div className="container py-20 max-w-3xl">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Track Your Order</h1>
        <p className="text-lg text-muted-foreground">
          Enter your order number and email/phone to check current status.
        </p>
      </div>

      <Card className="mb-10">
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
          <CardDescription>
            You can find your order number in the confirmation email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="orderNumber">Order Number</Label>
                <Input
                  placeholder="e.g. ORD-12345678"
                  {...form.register("orderNumber")}
                />
                {form.formState.errors.orderNumber && (
                  <p className="text-sm text-red-500">{form.formState.errors.orderNumber.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailOrPhone">Email or Phone</Label>
                <Input
                  placeholder="Email used during checkout"
                  {...form.register("emailOrPhone")}
                />
                {form.formState.errors.emailOrPhone && (
                  <p className="text-sm text-red-500">{form.formState.errors.emailOrPhone.message}</p>
                )}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>Searching...</>
              ) : (
                <><Search className="mr-2 h-4 w-4" /> Track Order</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {order && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card>
            <CardHeader className="bg-muted/30 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Order Found</CardTitle>
                  <CardDescription>
                    Placed on {format(new Date(order.created_at || new Date()), "MMMM d, yyyy")}
                  </CardDescription>
                </div>
                <Badge className={`${getStatusColor(order.order_status)} text-base px-4 py-1.5`}>
                  {order.order_status?.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Cancelled State */}
              {order.order_status === 'cancelled' ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-4">
                  <X className="h-6 w-6 text-red-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-red-900">Order Cancelled</h3>
                    <p className="text-red-700 mt-1">This order was cancelled.</p>
                  </div>
                </div>
              ) : (
                <div className="relative pl-2 md:pl-0">
                  {/* Timeline */}
                  <div className="space-y-8">
                    {[
                      { status: 'pending', label: 'Order Placed', icon: Clock, desc: 'We received your order.' },
                      { status: 'packed', label: 'Packed', icon: Package, desc: 'Packed and ready for pickup.' },
                      { status: 'shipped', label: 'Shipped', icon: Truck, desc: order.shipping_provider ? `Shipped via ${order.shipping_provider}` : 'On the way.' },
                      { status: 'delivered', label: 'Delivered', icon: CheckCircle, desc: 'Package delivered.' }
                    ].map((step, index) => {
                      const isCompleted = currentStep >= index
                      const isCurrent = currentStep === index

                      // Find timestamp logic (simplified)
                      let timestamp = null
                      if (step.status === 'pending') timestamp = order.created_at
                      else if (step.status === 'shipped') timestamp = order.shipped_at
                      else if (step.status === 'delivered') timestamp = order.delivered_at

                      return (
                        <div key={step.status} className="relative flex gap-4">
                          {/* Line connecting steps */}
                          {index < 3 && (
                            <div className={`absolute left-[19px] top-8 bottom-[-32px] w-0.5 ${isCompleted && currentStep > index ? 'bg-primary' : 'bg-gray-100'
                              }`} />
                          )}

                          <div className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${isCompleted ? 'border-primary bg-primary text-primary-foreground' : 'border-gray-200 bg-background text-gray-300'
                            }`}>
                            <step.icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 pt-1 pb-8">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className={`font-semibold ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {step.label}
                                </h4>
                                <p className="text-sm text-muted-foreground mt-1">{step.desc}</p>
                                {step.status === 'shipped' && isCompleted && order.shipping_tracking_number && (
                                  <div className="mt-2 inline-flex items-center gap-2 bg-muted px-3 py-1 rounded text-sm font-medium">
                                    Tracking: {order.shipping_tracking_number}
                                  </div>
                                )}
                              </div>
                              {timestamp && (
                                <div className="text-xs text-muted-foreground text-right">
                                  {format(new Date(timestamp), "MMM d")}
                                  <br />
                                  {format(new Date(timestamp), "h:mm a")}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <Separator className="my-6" />

              {/* Order Summary */}
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Shipping Address
                  </h4>
                  {order.shipping_address ? (
                    <div className="text-sm text-muted-foreground ml-6">
                      <p>{order.shipping_address.firstName} {order.shipping_address.lastName}</p>
                      <p>{order.shipping_address.address}</p>
                      <p>{order.shipping_address.city}, {order.shipping_address.state}</p>
                      <p>{order.shipping_address.postalCode}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground ml-6">Unavailable</p>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Items ({order.order_items.length})</h4>
                  <div className="space-y-3">
                    {order.order_items.slice(0, 3).map((item, i) => ( // Show only first 3 items for guest
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.quantity}x {item.product_variants?.products?.title}
                        </span>
                      </div>
                    ))}
                    {order.order_items.length > 3 && (
                      <p className="text-sm text-muted-foreground italic">+ {order.order_items.length - 3} more items</p>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between font-medium">
                      <span>Total Amount</span>
                      <span>₹{order.total_amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!order && hasSearched && !isLoading && (
        <div className="text-center p-8 bg-muted/20 rounded-lg">
          <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-medium text-lg">No Order Found</h3>
          <p className="text-muted-foreground mt-1">
            We couldn't find an order with those details. Please check your order number and try again.
          </p>
        </div>
      )}
    </div>
  )
}
