"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

interface InventoryData {
  trackInventory: boolean
  allowBackorders: boolean
  lowStockThreshold: string
  globalStock: string
}

interface InventoryTabProps {
  inventoryData: InventoryData
  onInventoryDataChange: (updates: Partial<InventoryData>) => void
  hasVariants: boolean
  variantCount: number
}

export function InventoryTab({ inventoryData, onInventoryDataChange, hasVariants, variantCount }: InventoryTabProps) {
  return (
    <div className="space-y-6">
      {/* Inventory Mode */}
      <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">Inventory Control</CardTitle>
          <CardDescription className="text-gray-600">
            Configure stock tracking and fulfillment settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/60 border border-gray-200/50">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold text-gray-900">Track Inventory</Label>
              <p className="text-sm text-gray-600">
                Monitor stock levels and get low stock alerts
              </p>
            </div>
            <Switch
              checked={inventoryData.trackInventory}
              onCheckedChange={(checked) => onInventoryDataChange({ trackInventory: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-white/60 border border-gray-200/50">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold text-gray-900">Allow Backorders</Label>
              <p className="text-sm text-gray-600">
                Continue selling when out of stock
              </p>
            </div>
            <Switch
              checked={inventoryData.allowBackorders}
              onCheckedChange={(checked) => onInventoryDataChange({ allowBackorders: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stock Management */}
      {inventoryData.trackInventory && (
        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Stock Management</CardTitle>
            <CardDescription className="text-gray-600">
              {hasVariants
                ? `Stock is managed per variant (${variantCount} variants)`
                : "Set stock levels for this product"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasVariants ? (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-700">
                  Stock is managed individually for each variant. Go to the Variants tab to set stock levels for each variant.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 w-full">
                <div className="space-y-2 min-w-0">
                  <Label htmlFor="globalStock">Stock Quantity</Label>
                  <Input
                    id="globalStock"
                    type="number"
                    placeholder="0"
                    min="0"
                    value={inventoryData.globalStock}
                    onChange={(e) => onInventoryDataChange({ globalStock: e.target.value })}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Available units for sale
                  </p>
                </div>
                <div className="space-y-2 min-w-0">
                  <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    placeholder="5"
                    min="0"
                    value={inventoryData.lowStockThreshold}
                    onChange={(e) => onInventoryDataChange({ lowStockThreshold: e.target.value })}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Alert when stock falls below this number
                  </p>
                </div>
              </div>
            )}

            {!hasVariants && (
              <div className="space-y-2">
                <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  placeholder="5"
                  min="0"
                  value={inventoryData.lowStockThreshold}
                  onChange={(e) => onInventoryDataChange({ lowStockThreshold: e.target.value })}
                  className="w-full max-w-xs"
                />
                <p className="text-xs text-gray-500">
                  Get notified when stock is running low
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Inventory Rules */}
      <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">Inventory Rules</CardTitle>
          <CardDescription className="text-gray-600">
            How inventory tracking works
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant={inventoryData.trackInventory ? "default" : "secondary"}>
                  {inventoryData.trackInventory ? "Tracked" : "Not Tracked"}
                </Badge>
                <span className="font-medium text-sm">Inventory Tracking</span>
              </div>
              <p className="text-xs text-gray-600">
                {inventoryData.trackInventory
                  ? "Stock levels are monitored and updated with each sale"
                  : "Unlimited stock - no quantity limits"
                }
              </p>
            </div>

            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant={inventoryData.allowBackorders ? "default" : "secondary"}>
                  {inventoryData.allowBackorders ? "Allowed" : "Not Allowed"}
                </Badge>
                <span className="font-medium text-sm">Backorders</span>
              </div>
              <p className="text-xs text-gray-600">
                {inventoryData.allowBackorders
                  ? "Customers can order even when out of stock"
                  : "Product becomes unavailable when stock reaches zero"
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}