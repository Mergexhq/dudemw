"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Save, Plus, Edit } from "lucide-react"

const shippingRules = [
  {
    id: 1,
    zone: "Tamil Nadu",
    condition: "≤4 items",
    rate: 60,
    enabled: true,
  },
  {
    id: 2,
    zone: "Tamil Nadu",
    condition: "≥5 items",
    rate: 120,
    enabled: true,
  },
  {
    id: 3,
    zone: "Outside Tamil Nadu",
    condition: "≤4 items",
    rate: 100,
    enabled: true,
  },
  {
    id: 4,
    zone: "Outside Tamil Nadu",
    condition: "≥5 items",
    rate: 150,
    enabled: true,
  },
]

export function ShippingSettingsForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [rules, setRules] = useState(shippingRules)
  const [freeShippingEnabled, setFreeShippingEnabled] = useState(false)
  const [freeShippingThreshold, setFreeShippingThreshold] = useState("2000")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  const toggleRule = (id: number) => {
    setRules(prev => prev.map(rule => 
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    ))
  }

  const updateRate = (id: number, newRate: number) => {
    setRules(prev => prev.map(rule => 
      rule.id === id ? { ...rule, rate: newRate } : rule
    ))
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <form onSubmit={handleSubmit} className="space-y-8 w-full">
      <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 dark:from-gray-900 dark:to-red-950/20 border-red-100/50 dark:border-red-900/20 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Shipping Rates</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Configure shipping rates based on zones and item count
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-4 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center space-x-4">
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={() => toggleRule(rule.id)}
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                        {rule.zone}
                      </Badge>
                      <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                        {rule.condition}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Shipping rate for {rule.zone.toLowerCase()} with {rule.condition.toLowerCase()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 dark:text-white">₹{rule.rate}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">per order</div>
                  </div>
                  <Button type="button" variant="ghost" size="sm" className="hover:bg-gray-100 dark:hover:bg-gray-800">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 dark:from-gray-900 dark:to-red-950/20 border-red-100/50 dark:border-red-900/20 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Free Shipping</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Configure free shipping thresholds
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold text-gray-900 dark:text-white">Enable Free Shipping</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Offer free shipping above a minimum order value
              </p>
            </div>
            <Switch 
              checked={freeShippingEnabled}
              onCheckedChange={setFreeShippingEnabled}
            />
          </div>
          
          {freeShippingEnabled && (
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 w-full">
              <div className="space-y-2 min-w-0">
                <Label htmlFor="freeShippingThreshold">Minimum Order Value (₹)</Label>
                <Input
                  id="freeShippingThreshold"
                  type="number"
                  value={freeShippingThreshold}
                  onChange={(e) => setFreeShippingThreshold(e.target.value)}
                  placeholder="2000"
                  className="w-full"
                />
              </div>
              <div className="space-y-2 min-w-0">
                <Label htmlFor="freeShippingZones">Applicable Zones</Label>
                <Input
                  id="freeShippingZones"
                  value="All zones"
                  disabled
                  className="bg-gray-50 dark:bg-gray-800 w-full"
                />
              </div>
            </div>
          )}
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