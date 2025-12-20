"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DialogSelect } from "@/components/ui/dialog-select"
import { Plus, MapPin, Edit, Trash2, Warehouse, Store } from "lucide-react"
import { toast } from "sonner"

interface Location {
  id: string
  name: string
  address: string
  city: string
  state: string
  pincode: string
  type: "warehouse" | "store" | "distribution"
  isPrimary: boolean
  isActive: boolean
}

export default function StoreLocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "Tamil Nadu",
    pincode: "",
    type: "warehouse" as "warehouse" | "store" | "distribution",
    isPrimary: false,
  })

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      city: "",
      state: "Tamil Nadu",
      pincode: "",
      type: "warehouse",
      isPrimary: false,
    })
    setEditingLocation(null)
  }

  const handleOpenDialog = (location?: Location) => {
    if (location) {
      setEditingLocation(location)
      setFormData({
        name: location.name,
        address: location.address,
        city: location.city,
        state: location.state,
        pincode: location.pincode,
        type: location.type,
        isPrimary: location.isPrimary,
      })
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.name || !formData.address || !formData.city || !formData.pincode) {
      toast.error("Please fill all required fields")
      return
    }

    if (editingLocation) {
      // Update existing location
      setLocations(prev => prev.map(loc =>
        loc.id === editingLocation.id
          ? { ...loc, ...formData }
          : formData.isPrimary ? { ...loc, isPrimary: false } : loc
      ))
      toast.success("Location updated successfully")
    } else {
      // Add new location
      const newLocation: Location = {
        id: Date.now().toString(),
        ...formData,
        isActive: true,
      }

      // If this is primary, remove primary from others
      if (formData.isPrimary) {
        setLocations(prev => [...prev.map(loc => ({ ...loc, isPrimary: false })), newLocation])
      } else {
        setLocations(prev => [...prev, newLocation])
      }
      toast.success("Location added successfully")
    }

    setIsDialogOpen(false)
    resetForm()
  }

  const handleDelete = (id: string) => {
    const location = locations.find(loc => loc.id === id)
    if (location?.isPrimary) {
      toast.error("Cannot delete primary location")
      return
    }
    setLocations(prev => prev.filter(loc => loc.id !== id))
    toast.success("Location deleted")
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "warehouse": return <Warehouse className="h-4 w-4" />
      case "store": return <Store className="h-4 w-4" />
      default: return <MapPin className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Store Locations</h1>
          <p className="text-gray-600 mt-1">
            Manage warehouse and fulfillment locations
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Location
        </Button>
      </div>

      {/* Locations List */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <MapPin className="w-5 h-5 mr-2 text-red-600" />
            Fulfillment Locations
          </CardTitle>
          <CardDescription>
            Configure where your orders are fulfilled from
          </CardDescription>
        </CardHeader>
        <CardContent>
          {locations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No locations added</h3>
              <p className="text-gray-500 mb-4">Add your first warehouse or store location</p>
              <Button
                onClick={() => handleOpenDialog()}
                variant="outline"
                className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Location
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-start justify-between p-4 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                      {getTypeIcon(location.type)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{location.name}</span>
                        {location.isPrimary && (
                          <Badge className="bg-red-100 text-red-700 border-red-200">Primary</Badge>
                        )}
                        <Badge variant="outline" className="capitalize">{location.type}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {location.address}, {location.city}, {location.state} - {location.pincode}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(location)}
                      className="hover:bg-gray-100"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {!location.isPrimary && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(location.id)}
                        className="hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? "Edit Location" : "Add New Location"}
            </DialogTitle>
            <DialogDescription>
              {editingLocation ? "Update location details" : "Add a warehouse or store location"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Location Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Main Warehouse"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <DialogSelect
                value={formData.type}
                onValueChange={(value) =>
                  setFormData(prev => ({ ...prev, type: value as "warehouse" | "store" | "distribution" }))
                }
                options={[
                  { value: "warehouse", label: "Warehouse" },
                  { value: "store", label: "Store" },
                  { value: "distribution", label: "Distribution Center" }
                ]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Street address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  value={formData.pincode}
                  onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                  placeholder="600001"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <DialogSelect
                value={formData.state}
                onValueChange={(value) => setFormData(prev => ({ ...prev, state: value }))}
                options={[
                  { value: "Tamil Nadu", label: "Tamil Nadu" },
                  { value: "Karnataka", label: "Karnataka" },
                  { value: "Kerala", label: "Kerala" },
                  { value: "Andhra Pradesh", label: "Andhra Pradesh" },
                  { value: "Telangana", label: "Telangana" },
                  { value: "Maharashtra", label: "Maharashtra" },
                  { value: "Delhi", label: "Delhi" },
                  { value: "Gujarat", label: "Gujarat" },
                  { value: "Rajasthan", label: "Rajasthan" },
                  { value: "West Bengal", label: "West Bengal" }
                ]}
              />
            </div>

            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="isPrimary"
                checked={formData.isPrimary}
                onChange={(e) => setFormData(prev => ({ ...prev, isPrimary: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isPrimary" className="text-sm cursor-pointer">
                Set as primary fulfillment location
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700 text-white">
              {editingLocation ? "Save Changes" : "Add Location"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}