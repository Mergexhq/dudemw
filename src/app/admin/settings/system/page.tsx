"use client"

import { useState, useEffect } from "react"
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
  AlertTriangle,
  Loader2
} from "lucide-react"
import { toast } from "sonner"
import { SettingsClientService } from "@/lib/services/settings-client"
import { SystemPreferences } from "@/lib/types/settings"

export default function PreferencesPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [preferences, setPreferences] = useState<SystemPreferences | null>(null)

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    setIsLoading(true)
    try {
      const result = await SettingsClientService.getSystemPreferences()
      if (result.success && result.data) {
        setPreferences(result.data)
      } else {
        toast.error('Failed to load preferences')
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
      toast.error('Failed to load preferences')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSavePreferences = async () => {
    if (!preferences) {
      toast.error('No preferences to save')
      return
    }

    setIsSaving(true)
    try {
      const result = await SettingsClientService.updateSystemPreferences(preferences.id, {
        auto_cancel_enabled: preferences.auto_cancel_enabled,
        auto_cancel_minutes: preferences.auto_cancel_minutes,
        guest_checkout_enabled: preferences.guest_checkout_enabled,
        low_stock_threshold: preferences.low_stock_threshold,
        allow_backorders: preferences.allow_backorders,
        order_placed_email: preferences.order_placed_email,
        order_shipped_email: preferences.order_shipped_email,
        low_stock_alert: preferences.low_stock_alert,
      })

      if (result.success) {
        toast.success("Preferences saved successfully")
      } else {
        toast.error(result.error || 'Failed to save preferences')
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
      toast.error('Failed to save preferences')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-red-600" />
          <p className="text-gray-600">Loading preferences...</p>
        </div>
      </div>
    )
  }

  if (!preferences) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">Failed to load preferences</p>
      </div>
    )
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
          disabled={isSaving}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
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
                  value={preferences.auto_cancel_minutes}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    auto_cancel_minutes: parseInt(e.target.value) || 30
                  })}
                  className="w-20 h-9"
                  disabled={!preferences.auto_cancel_enabled}
                />
                <span className="text-sm text-gray-500">mins</span>
              </div>
              <Switch
                checked={preferences.auto_cancel_enabled}
                onCheckedChange={(checked) => setPreferences({
                  ...preferences,
                  auto_cancel_enabled: checked
                })}
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
              checked={preferences.guest_checkout_enabled}
              onCheckedChange={(checked) => setPreferences({
                ...preferences,
                guest_checkout_enabled: checked
              })}
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
                value={preferences.low_stock_threshold}
                onChange={(e) => setPreferences({
                  ...preferences,
                  low_stock_threshold: parseInt(e.target.value) || 10
                })}
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
              checked={preferences.allow_backorders}
              onCheckedChange={(checked) => setPreferences({
                ...preferences,
                allow_backorders: checked
              })}
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
              checked={preferences.order_placed_email}
              onCheckedChange={(checked) => setPreferences({
                ...preferences,
                order_placed_email: checked
              })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Order shipped</p>
              <p className="text-sm text-gray-500">Notify customer when order is shipped</p>
            </div>
            <Switch
              checked={preferences.order_shipped_email}
              onCheckedChange={(checked) => setPreferences({
                ...preferences,
                order_shipped_email: checked
              })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Low stock alert</p>
              <p className="text-sm text-gray-500">Notify admin when product stock is low</p>
            </div>
            <Switch
              checked={preferences.low_stock_alert}
              onCheckedChange={(checked) => setPreferences({
                ...preferences,
                low_stock_alert: checked
              })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
