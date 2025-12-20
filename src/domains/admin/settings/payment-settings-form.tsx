"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { SettingsClientService } from "@/lib/services/settings-client"
import { PaymentSettings } from "@/lib/types/settings"
import { toast } from "sonner"
import { Save, CreditCard, Banknote, Loader2, CheckCircle, Info } from "lucide-react"

export function PaymentSettingsForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [settings, setSettings] = useState<PaymentSettings | null>(null)
  const [formData, setFormData] = useState({
    razorpay_enabled: false,
    razorpay_key_id: "",
    razorpay_key_secret: "",
    razorpay_test_mode: true,
    cod_enabled: true,
    cod_max_amount: 0,
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setIsFetching(true)
    try {
      const result = await SettingsClientService.getPaymentSettings()
      if (result.success && result.data) {
        setSettings(result.data)
        setFormData({
          razorpay_enabled: result.data.razorpay_enabled,
          razorpay_key_id: result.data.razorpay_key_id || "",
          razorpay_key_secret: result.data.razorpay_key_secret || "",
          razorpay_test_mode: result.data.razorpay_test_mode,
          cod_enabled: result.data.cod_enabled,
          cod_max_amount: result.data.cod_max_amount || 0,
        })
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error)
      toast.error('Failed to load payment settings')
    } finally {
      setIsFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!settings) {
      toast.error('Settings not loaded')
      return
    }

    setIsLoading(true)
    try {
      const result = await SettingsClientService.updatePaymentSettings(settings.id, formData)
      if (result.success) {
        toast.success('Payment settings updated successfully')
        fetchSettings()
      } else {
        toast.error(result.error || 'Failed to update settings')
      }
    } catch (error) {
      console.error('Error updating payment settings:', error)
      toast.error('Failed to update payment settings')
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <form onSubmit={handleSubmit} className="space-y-6 w-full">
        {/* Razorpay */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center text-xl">
                  <CreditCard className="h-5 w-5 mr-2 text-red-600" />
                  Razorpay
                </CardTitle>
                <CardDescription>
                  Accept UPI, Cards, Net Banking, and Wallets
                </CardDescription>
              </div>
              <Badge className={formData.razorpay_enabled ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-500 border-gray-200"}>
                {formData.razorpay_enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Enable Online Payments</p>
                  <p className="text-sm text-gray-500">
                    Accept payments via UPI, Debit/Credit Cards, Net Banking
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.razorpay_enabled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, razorpay_enabled: checked }))}
              />
            </div>

            {formData.razorpay_enabled && (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-800 font-medium">API Keys Configured via Environment</p>
                    <p className="text-sm text-blue-600 mt-1">
                      Razorpay API keys are securely configured through environment variables. Contact your developer to update keys.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* COD */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center text-xl">
                  <Banknote className="h-5 w-5 mr-2 text-red-600" />
                  Cash on Delivery
                </CardTitle>
                <CardDescription>
                  Allow customers to pay when receiving their order
                </CardDescription>
              </div>
              <Badge className={formData.cod_enabled ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-500 border-gray-200"}>
                {formData.cod_enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Banknote className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Enable COD</p>
                  <p className="text-sm text-gray-500">
                    Customers pay in cash when order is delivered
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.cod_enabled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, cod_enabled: checked }))}
              />
            </div>

            {formData.cod_enabled && (
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <Label htmlFor="codMaxAmount" className="text-sm font-medium">Maximum COD Order Value (₹)</Label>
                <Input
                  id="codMaxAmount"
                  type="number"
                  placeholder="0"
                  value={formData.cod_max_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, cod_max_amount: parseFloat(e.target.value) || 0 }))}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Set to 0 for no limit. Orders above this amount will require online payment.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods Summary */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50 to-white">
          <CardContent className="py-4">
            <div className="flex items-center space-x-6">
              <span className="text-sm font-medium text-gray-700">Active Payment Methods:</span>
              <div className="flex items-center space-x-3">
                {formData.razorpay_enabled && (
                  <div className="flex items-center space-x-1.5 text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Online Payments</span>
                  </div>
                )}
                {formData.cod_enabled && (
                  <div className="flex items-center space-x-1.5 text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Cash on Delivery</span>
                  </div>
                )}
                {!formData.razorpay_enabled && !formData.cod_enabled && (
                  <span className="text-sm text-amber-600">No payment methods enabled</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading} className="bg-red-600 hover:bg-red-700 text-white">
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
