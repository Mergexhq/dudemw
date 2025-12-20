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
import { Save, Plus, Edit, Trash2, Truck, ChevronDown, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { SettingsClientService } from "@/lib/services/settings-client"
import { ShippingRule, CreateShippingRuleInput, SystemPreferences } from "@/lib/types/settings"

const ZONES = [
  { value: "tamil_nadu", label: "Tamil Nadu" },
  { value: "south_india", label: "South India (except TN)" },
  { value: "north_india", label: "North India" },
  { value: "east_india", label: "East India" },
  { value: "west_india", label: "West India" },
  { value: "all_india", label: "All India" },
] as const

export function ShippingSettingsForm() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [rules, setRules] = useState<ShippingRule[]>([])
  const [preferences, setPreferences] = useState<SystemPreferences | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<ShippingRule | null>(null)
  const [zoneDropdownOpen, setZoneDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    zone: "tamil_nadu" as ShippingRule['zone'],
    min_quantity: 1,
    max_quantity: "" as string | number,
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

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [rulesResult, prefsResult] = await Promise.all([
        SettingsClientService.getShippingRules(),
        SettingsClientService.getSystemPreferences()
      ])

      if (rulesResult.success && rulesResult.data) {
        setRules(rulesResult.data)
      }

      if (prefsResult.success && prefsResult.data) {
        setPreferences(prefsResult.data)
      }
    } catch (error) {
      console.error('Error loading shipping data:', error)
      toast.error('Failed to load shipping settings')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      zone: "tamil_nadu",
      min_quantity: 1,
      max_quantity: "",
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
        min_quantity: rule.min_quantity,
        max_quantity: rule.max_quantity ?? "",
        rate: rule.rate,
      })
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleSaveRule = async () => {
    if (!formData.zone || formData.rate <= 0) {
      toast.error("Please fill all required fields")
      return
    }

    setIsSaving(true)
    try {
      const maxQty = formData.max_quantity === "" ? null : Number(formData.max_quantity)

      if (editingRule) {
        // Update existing rule
        const result = await SettingsClientService.updateShippingRule(editingRule.id, {
          zone: formData.zone,
          min_quantity: formData.min_quantity,
          max_quantity: maxQty,
          rate: formData.rate,
        })

        if (result.success) {
          toast.success("Rule updated successfully")
          await loadData()
        } else {
          toast.error(result.error || 'Failed to update rule')
        }
      } else {
        // Add new rule
        const result = await SettingsClientService.createShippingRule({
          zone: formData.zone,
          min_quantity: formData.min_quantity,
          max_quantity: maxQty,
          rate: formData.rate,
          is_enabled: true,
        } as CreateShippingRuleInput)

        if (result.success) {
          toast.success("Rule added successfully")
          await loadData()
        } else {
          toast.error(result.error || 'Failed to add rule')
        }
      }

      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error saving shipping rule:', error)
      toast.error('Failed to save shipping rule')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shipping rule?')) {
      return
    }

    try {
      const result = await SettingsClientService.deleteShippingRule(id)
      if (result.success) {
        toast.success("Rule deleted")
        await loadData()
      } else {
        toast.error(result.error || 'Failed to delete rule')
      }
    } catch (error) {
      console.error('Error deleting rule:', error)
      toast.error('Failed to delete rule')
    }
  }

  const toggleRule = async (id: string) => {
    const rule = rules.find(r => r.id === id)
    if (!rule) return

    try {
      const result = await SettingsClientService.updateShippingRule(id, {
        is_enabled: !rule.is_enabled
      })

      if (result.success) {
        await loadData()
      } else {
        toast.error('Failed to update rule')
      }
    } catch (error) {
      console.error('Error toggling rule:', error)
      toast.error('Failed to update rule')
    }
  }

  const handleUpdateFreeShipping = async () => {
    if (!preferences) return

    setIsSaving(true)
    try {
      const result = await SettingsClientService.updateSystemPreferences(preferences.id, {
        free_shipping_enabled: preferences.free_shipping_enabled,
        free_shipping_threshold: preferences.free_shipping_threshold,
      })

      if (result.success) {
        toast.success('Free shipping settings saved')
      } else {
        toast.error('Failed to save free shipping settings')
      }
    } catch (error) {
      console.error('Error saving free shipping:', error)
      toast.error('Failed to save free shipping settings')
    } finally {
      setIsSaving(false)
    }
  }

  const getZoneLabel = (zoneValue: string) => {
    return ZONES.find(z => z.value === zoneValue)?.label || zoneValue
  }

  const getConditionText = (rule: ShippingRule) => {
    if (rule.max_quantity === null) {
      return `${rule.min_quantity}+ items`
    }
    if (rule.min_quantity === rule.max_quantity) {
      return `${rule.min_quantity} item${rule.min_quantity > 1 ? 's' : ''}`
    }
    return `${rule.min_quantity}-${rule.max_quantity} items`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
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
                    className={`flex items-center justify-between p-4 rounded-xl border ${rule.is_enabled
                      ? "bg-white border-gray-200"
                      : "bg-gray-50 border-gray-100 opacity-60"
                      }`}
                  >
                    <div className="flex items-center space-x-4">
                      <Switch
                        checked={rule.is_enabled}
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
        {preferences && (
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
                  checked={preferences.free_shipping_enabled}
                  onCheckedChange={(checked) => 
                    setPreferences({ ...preferences, free_shipping_enabled: checked })
                  }
                />
              </div>

              {preferences.free_shipping_enabled && (
                <div className="grid gap-4 md:grid-cols-2 w-full">
                  <div className="space-y-2">
                    <Label htmlFor="freeShippingThreshold">Minimum Order Value (₹)</Label>
                    <Input
                      id="freeShippingThreshold"
                      type="number"
                      value={preferences.free_shipping_threshold || ""}
                      onChange={(e) => 
                        setPreferences({ 
                          ...preferences, 
                          free_shipping_threshold: parseFloat(e.target.value) || null 
                        })
                      }
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

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleUpdateFreeShipping} 
                  disabled={isSaving}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Free Shipping
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

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
                          setFormData(prev => ({ ...prev, zone: zone.value as ShippingRule['zone'] }))
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
                  value={formData.min_quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, min_quantity: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxQuantity">Max Quantity</Label>
                <Input
                  id="maxQuantity"
                  type="number"
                  min={1}
                  value={formData.max_quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_quantity: e.target.value ? parseInt(e.target.value) : "" }))}
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
                {formData.max_quantity ? `${formData.min_quantity}-${formData.max_quantity}` : `${formData.min_quantity}+`} items
                will be charged <strong>₹{formData.rate}</strong>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleSaveRule} 
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                editingRule ? "Save Changes" : "Add Rule"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
