"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Save, Plus, Edit, Trash2, Truck, ChevronDown, Check } from "lucide-react"
import { toast } from "sonner"

interface ShippingRule {
  id: string
  zone: string
  minQuantity: number
  maxQuantity: number | null // null means unlimited
  rate: number
  enabled: boolean
}

const ZONES = [
  { value: "tamil_nadu", label: "Tamil Nadu" },
  { value: "south_india", label: "South India (except TN)" },
  { value: "north_india", label: "North India" },
  { value: "east_india", label: "East India" },
  { value: "west_india", label: "West India" },
  { value: "all_india", label: "All India" },
]

export function ShippingSettingsForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [rules, setRules] = useState<ShippingRule[]>([])
  const [freeShippingEnabled, setFreeShippingEnabled] = useState(false)
  const [freeShippingThreshold, setFreeShippingThreshold] = useState("2000")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<ShippingRule | null>(null)
  const [zoneDropdownOpen, setZoneDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    zone: "tamil_nadu",
    minQuantity: 1,
    maxQuantity: "" as string | number,
    rate: 60,
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setZoneDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const resetForm = () => {
    setFormData({
      zone: "tamil_nadu",
      minQuantity: 1,
      maxQuantity: "",
      rate: 60,
    })
    setEditingRule(null)
    setZoneDropdownOpen(false)
  }

  const handleOpenDialog = (rule?: ShippingRule) => {
    if (rule) {
      setEditingRule(rule)
      setFormData({
        zone: rule.zone,
        minQuantity: rule.minQuantity,
        maxQuantity: rule.maxQuantity ?? "",
        rate: rule.rate,
      })
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleSaveRule = () => {
    if (!formData.zone || formData.rate <= 0) {
      toast.error("Please fill all required fields")
      return
    }

    const maxQty = formData.maxQuantity === "" ? null : Number(formData.maxQuantity)

    if (editingRule) {
      // Update existing rule
      setRules(prev => prev.map(rule =>
        rule.id === editingRule.id
          ? {
            ...rule,
            zone: formData.zone,
            minQuantity: formData.minQuantity,
            maxQuantity: maxQty,
            rate: formData.rate,
          }
          : rule
      ))
      toast.success("Rule updated successfully")
    } else {
      // Add new rule
      const newRule: ShippingRule = {
        id: Date.now().toString(),
        zone: formData.zone,
        minQuantity: formData.minQuantity,
        maxQuantity: maxQty,
        rate: formData.rate,
        enabled: true,
      }
      setRules(prev => [...prev, newRule])
      toast.success("Rule added successfully")
    }

    setIsDialogOpen(false)
    resetForm()
  }

  const handleDeleteRule = (id: string) => {
    setRules(prev => prev.filter(rule => rule.id !== id))
    toast.success("Rule deleted")
  }

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(rule =>
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    ))
  }

  const getZoneLabel = (zoneValue: string) => {
    return ZONES.find(z => z.value === zoneValue)?.label || zoneValue
  }

  const getConditionText = (rule: ShippingRule) => {
    if (rule.maxQuantity === null) {
      return `${rule.minQuantity}+ items`
    }
    if (rule.minQuantity === rule.maxQuantity) {
      return `${rule.minQuantity} item${rule.minQuantity > 1 ? 's' : ''}`
    }
    return `${rule.minQuantity}-${rule.maxQuantity} items`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success("Shipping settings saved")
    setIsLoading(false)
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Shipping Rules */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-xl">
                <Truck className="w-5 h-5 mr-2 text-red-600" />
                Shipping Rules
              </CardTitle>
              <CardDescription>
                Configure shipping rates based on quantity and location
              </CardDescription>
            </div>
            <Button
              type="button"
              onClick={() => handleOpenDialog()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Rule
            </Button>
          </CardHeader>
          <CardContent>
            {rules.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No shipping rules</h3>
                <p className="text-gray-500 mb-4">Create your first shipping rule based on quantity and location</p>
                <Button
                  type="button"
                  onClick={() => handleOpenDialog()}
                  variant="outline"
                  className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Rule
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`flex items-center justify-between p-4 rounded-xl border ${rule.enabled
                      ? "bg-white border-gray-200"
                      : "bg-gray-50 border-gray-100 opacity-60"
                      }`}
                  >
                    <div className="flex items-center space-x-4">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => toggleRule(rule.id)}
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                            {getZoneLabel(rule.zone)}
                          </Badge>
                          <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                            {getConditionText(rule)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Shipping charge for {getZoneLabel(rule.zone).toLowerCase()} orders
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">₹{rule.rate}</div>
                        <div className="text-xs text-gray-500">per order</div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(rule)}
                        className="hover:bg-gray-100"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRule(rule.id)}
                        className="hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Free Shipping */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Free Shipping</CardTitle>
            <CardDescription>
              Configure free shipping thresholds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold text-gray-900">Enable Free Shipping</Label>
                <p className="text-sm text-gray-600">
                  Offer free shipping above a minimum order value
                </p>
              </div>
              <Switch
                checked={freeShippingEnabled}
                onCheckedChange={setFreeShippingEnabled}
              />
            </div>

            {freeShippingEnabled && (
              <div className="grid gap-4 md:grid-cols-2 w-full">
                <div className="space-y-2">
                  <Label htmlFor="freeShippingThreshold">Minimum Order Value (₹)</Label>
                  <Input
                    id="freeShippingThreshold"
                    type="number"
                    value={freeShippingThreshold}
                    onChange={(e) => setFreeShippingThreshold(e.target.value)}
                    placeholder="2000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Applicable Zones</Label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-gray-700">All zones</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading} className="bg-red-600 hover:bg-red-700 text-white">
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>

      {/* Add/Edit Rule Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? "Edit Shipping Rule" : "Add Shipping Rule"}
            </DialogTitle>
            <DialogDescription>
              Configure shipping rate based on quantity and location
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="zone">Zone / Location *</Label>
              <div ref={dropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setZoneDropdownOpen(!zoneDropdownOpen)}
                  className="flex h-10 w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  <span>{ZONES.find(z => z.value === formData.zone)?.label || "Select zone"}</span>
                  <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${zoneDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {zoneDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {ZONES.map((zone) => (
                      <button
                        key={zone.value}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, zone: zone.value }))
                          setZoneDropdownOpen(false)
                        }}
                        className={`flex w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-red-50 ${formData.zone === zone.value ? "bg-red-50 text-red-700" : "text-gray-700"
                          }`}
                      >
                        <span>{zone.label}</span>
                        {formData.zone === zone.value && (
                          <Check className="h-4 w-4 text-red-600" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minQuantity">Min Quantity *</Label>
                <Input
                  id="minQuantity"
                  type="number"
                  min={1}
                  value={formData.minQuantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, minQuantity: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxQuantity">Max Quantity</Label>
                <Input
                  id="maxQuantity"
                  type="number"
                  min={1}
                  value={formData.maxQuantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxQuantity: e.target.value ? parseInt(e.target.value) : "" }))}
                  placeholder="Unlimited"
                />
                <p className="text-xs text-gray-500">Leave empty for unlimited</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate">Shipping Rate (₹) *</Label>
              <Input
                id="rate"
                type="number"
                min={0}
                value={formData.rate}
                onChange={(e) => setFormData(prev => ({ ...prev, rate: parseInt(e.target.value) || 0 }))}
                placeholder="60"
              />
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-700">
                <strong>Preview:</strong> {getZoneLabel(formData.zone)} orders with{" "}
                {formData.maxQuantity ? `${formData.minQuantity}-${formData.maxQuantity}` : `${formData.minQuantity}+`} items
                will be charged <strong>₹{formData.rate}</strong>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveRule} className="bg-red-600 hover:bg-red-700 text-white">
              {editingRule ? "Save Changes" : "Add Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}