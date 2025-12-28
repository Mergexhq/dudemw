"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SettingsClientService } from "@/lib/services/settings-client"
import { StoreSettings } from "@/lib/types/settings"
import { toast } from "sonner"
import { Upload, Save, Loader2 } from "lucide-react"

export function StoreSettingsForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [formData, setFormData] = useState({
    store_name: "",
    legal_name: "",
    description: "",
    support_email: "",
    support_phone: "",
    gst_number: "",
    invoice_prefix: "",
    currency: "INR",
    timezone: "Asia/Kolkata",
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setIsFetching(true)
    try {
      const result = await SettingsClientService.getStoreSettings()
      if (result.success && result.data) {
        setSettings(result.data)
        setFormData({
          store_name: result.data.store_name,
          legal_name: result.data.legal_name || "",
          description: result.data.description || "",
          support_email: result.data.support_email || "",
          support_phone: result.data.support_phone || "",
          gst_number: result.data.gst_number || "",
          invoice_prefix: result.data.invoice_prefix,
          currency: result.data.currency,
          timezone: result.data.timezone,
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Failed to load store settings')
    } finally {
      setIsFetching(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!settings) {
      toast.error('Settings not loaded')
      return
    }

    setIsLoading(true)
    try {
      const result = await SettingsClientService.updateStoreSettings(settings.id, formData)
      if (result.success) {
        toast.success('Store settings updated successfully')
        fetchSettings()
      } else {
        toast.error(result.error || 'Failed to update settings')
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      toast.error('Failed to update store settings')
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
      <form onSubmit={handleSubmit} className="space-y-8 w-full">
        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Store Identity</CardTitle>
            <CardDescription className="text-gray-600">
              Basic information about your store
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 w-full">
              <div className="space-y-2 min-w-0">
                <Label htmlFor="storeName">Store Name</Label>
                <Input
                  id="storeName"
                  placeholder="Dude Men's Wears"
                  value={formData.store_name}
                  onChange={(e) => handleChange('store_name', e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2 min-w-0">
                <Label htmlFor="legalName">Legal Name</Label>
                <Input
                  id="legalName"
                  placeholder="Dude Men's Wears Pvt Ltd"
                  value={formData.legal_name}
                  onChange={(e) => handleChange('legal_name', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Store Description</Label>
              <Textarea
                id="description"
                placeholder="Premium men's clothing and accessories"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Store Logo</Label>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-gray-400">LOGO</span>
                </div>
                <Button type="button" variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Logo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Contact Information</CardTitle>
            <CardDescription className="text-gray-600">
              How customers can reach you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 w-full">
              <div className="space-y-2 min-w-0">
                <Label htmlFor="supportEmail">Support Email</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  placeholder="support@dudemenswears.com"
                  value={formData.support_email}
                  onChange={(e) => handleChange('support_email', e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2 min-w-0">
                <Label htmlFor="supportPhone">Support Phone</Label>
                <Input
                  id="supportPhone"
                  placeholder="+91 98765 43210"
                  value={formData.support_phone}
                  onChange={(e) => handleChange('support_phone', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Business Information</CardTitle>
            <CardDescription className="text-gray-600">
              Legal and tax information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 w-full">
              <div className="space-y-2 min-w-0">
                <Label htmlFor="gstNumber">GST Number</Label>
                <Input
                  id="gstNumber"
                  placeholder="22AAAAA0000A1Z5"
                  value={formData.gst_number}
                  onChange={(e) => handleChange('gst_number', e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2 min-w-0">
                <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                <Input
                  id="invoicePrefix"
                  placeholder="DMW"
                  value={formData.invoice_prefix}
                  onChange={(e) => handleChange('invoice_prefix', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 w-full">
              <div className="space-y-2 min-w-0">
                <Label>Country</Label>
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-lg">🇮🇳</span>
                  <span className="font-medium text-gray-900">India</span>
                  <span className="text-xs text-gray-500 ml-auto">Default</span>
                </div>
                <p className="text-xs text-gray-500">Store location is fixed to India</p>
              </div>
              <div className="space-y-2 min-w-0">
                <Label>Currency</Label>
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-lg font-bold text-gray-700">₹</span>
                  <span className="font-medium text-gray-900">Indian Rupee (INR)</span>
                  <span className="text-xs text-gray-500 ml-auto">Default</span>
                </div>
                <p className="text-xs text-gray-500">All prices are in Indian Rupees</p>
              </div>
            </div>

            <div className="space-y-2 min-w-0">
              <Label>Timezone</Label>
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="font-medium text-gray-900">Asia/Kolkata (IST)</span>
                <span className="text-xs text-gray-500 ml-auto">Indian Standard Time</span>
              </div>
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