"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Settings,
  ShoppingCart,
  Package,
  Bell,
  Save,
  Clock,
  AlertTriangle
} from "lucide-react"
import { toast } from "sonner"

export default function PreferencesPage() {
  const [isLoading, setIsLoading] = useState(false)

  // Order Behavior
  const [autoCancelEnabled, setAutoCancelEnabled] = useState(true)
  const [autoCancelMinutes, setAutoCancelMinutes] = useState(30)
  const [guestCheckout, setGuestCheckout] = useState(true)

  // Inventory Rules
  const [lowStockThreshold, setLowStockThreshold] = useState(10)
  const [allowBackorders, setAllowBackorders] = useState(false)

  // Notifications
  const [orderPlacedEmail, setOrderPlacedEmail] = useState(true)
  const [orderShippedEmail, setOrderShippedEmail] = useState(true)
  const [lowStockAlert, setLowStockAlert] = useState(true)

  const handleSavePreferences = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success("Preferences saved successfully")
    setIsLoading(false)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Preferences</h1>
          <p className="text-gray-600 mt-2">
            Configure system-wide behavior and automation rules
          </p>
        </div>
        <Button
          onClick={handleSavePreferences}
          disabled={isLoading}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Order Behavior */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <ShoppingCart className="w-5 h-5 mr-2 text-red-600" />
            Order Behavior
          </CardTitle>
          <CardDescription>
            Configure how orders are processed and handled
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto-cancel unpaid orders */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Auto-cancel unpaid orders</p>
                <p className="text-sm text-gray-500">
                  Automatically cancel orders that remain unpaid
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">After</span>
                <Input
                  type="number"
                  min={5}
                  max={1440}
                  value={autoCancelMinutes}
                  onChange={(e) => setAutoCancelMinutes(parseInt(e.target.value) || 30)}
                  className="w-20 h-9"
                  disabled={!autoCancelEnabled}
                />
                <span className="text-sm text-gray-500">mins</span>
              </div>
              <Switch
                checked={autoCancelEnabled}
                onCheckedChange={setAutoCancelEnabled}
              />
            </div>
          </div>

          {/* Guest checkout */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Allow guest checkout</p>
              <p className="text-sm text-gray-500">
                Let customers checkout without creating an account
              </p>
            </div>
            <Switch
              checked={guestCheckout}
              onCheckedChange={setGuestCheckout}
            />
          </div>
        </CardContent>
      </Card>

      {/* Inventory Rules */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Package className="w-5 h-5 mr-2 text-red-600" />
            Inventory Rules
          </CardTitle>
          <CardDescription>
            Set thresholds and stock behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Low stock threshold */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Low stock threshold</p>
                <p className="text-sm text-gray-500">
                  Mark products as "low stock" when quantity falls below
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                min={1}
                max={100}
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 10)}
                className="w-20 h-9"
              />
              <span className="text-sm text-gray-500">units</span>
            </div>
          </div>

          {/* Allow backorders */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Allow backorders</p>
              <p className="text-sm text-gray-500">
                Continue selling products when out of stock
              </p>
            </div>
            <Switch
              checked={allowBackorders}
              onCheckedChange={setAllowBackorders}
            />
          </div>
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Bell className="w-5 h-5 mr-2 text-red-600" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Configure which emails are sent automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Order placed</p>
              <p className="text-sm text-gray-500">Notify admin when a new order is placed</p>
            </div>
            <Switch
              checked={orderPlacedEmail}
              onCheckedChange={setOrderPlacedEmail}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Order shipped</p>
              <p className="text-sm text-gray-500">Notify customer when order is shipped</p>
            </div>
            <Switch
              checked={orderShippedEmail}
              onCheckedChange={setOrderShippedEmail}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Low stock alert</p>
              <p className="text-sm text-gray-500">Notify admin when product stock is low</p>
            </div>
            <Switch
              checked={lowStockAlert}
              onCheckedChange={setLowStockAlert}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}