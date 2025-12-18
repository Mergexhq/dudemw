"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Save, CreditCard, Banknote } from "lucide-react"

export function PaymentSettingsForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [razorpayEnabled, setRazorpayEnabled] = useState(true)
  const [codEnabled, setCodEnabled] = useState(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <form onSubmit={handleSubmit} className="space-y-8 w-full">
      <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 dark:from-gray-900 dark:to-red-950/20 border-red-100/50 dark:border-red-900/20 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-xl font-bold text-gray-900 dark:text-white">
            <CreditCard className="h-5 w-5" />
            <span>Razorpay Integration</span>
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Enable or disable online payments via Razorpay
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold text-gray-900 dark:text-white">Enable Razorpay</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Accept online payments including UPI, Cards, Net Banking
              </p>
            </div>
            <Switch 
              checked={razorpayEnabled}
              onCheckedChange={setRazorpayEnabled}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 dark:from-gray-900 dark:to-red-950/20 border-red-100/50 dark:border-red-900/20 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-xl font-bold text-gray-900 dark:text-white">
            <Banknote className="h-5 w-5" />
            <span>Cash on Delivery (COD)</span>
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Enable or disable cash on delivery payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold text-gray-900 dark:text-white">Enable COD</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Allow customers to pay when they receive their order
              </p>
            </div>
            <Switch 
              checked={codEnabled}
              onCheckedChange={setCodEnabled}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading} className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25">
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
      </form>
    </div>
  )
}