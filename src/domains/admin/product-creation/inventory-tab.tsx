"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, AlertCircle, Check, ArrowRight, Warehouse, Bell, ShoppingCart } from "lucide-react"
import Link from "next/link"

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
      {/* Inventory Mode Notice */}
      <Card className={`border-0 shadow-sm transition-all duration-200 ${hasVariants
          ? 'bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/30 dark:to-gray-900 border-blue-100/50'
          : 'bg-gradient-to-b from-white to-red-50 dark:from-gray-900 dark:to-red-950/20 border-red-100/50'
        }`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Package className={`h-5 w-5 ${hasVariants ? 'text-blue-600' : 'text-red-600'}`} />
                Inventory Mode
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {hasVariants
                  ? 'Stock is managed per variant'
                  : 'Set a single stock level for this product'
                }
              </CardDescription>
            </div>
            <Badge className={hasVariants ? 'bg-blue-600' : 'bg-red-600'}>
              {hasVariants ? 'Per-Variant Stock' : 'Single Stock'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {hasVariants
              ? `This product has ${variantCount} variants. Each variant has its own stock level.`
              : 'This product has no variants, so it uses a single stock count.'
            }
          </p>
        </CardContent>
      </Card>

      {/* Inventory Behavior Settings - Always Visible */}
      <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 dark:from-gray-900 dark:to-red-950/20 border-red-100/50 dark:border-red-900/20 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Warehouse className="h-5 w-5 text-red-600" />
            Inventory Behavior
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Configure how inventory tracking works for this product
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Track Inventory Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/60 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${inventoryData.trackInventory
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                <Package className={`h-5 w-5 ${inventoryData.trackInventory ? 'text-green-600' : 'text-gray-400'
                  }`} />
              </div>
              <div>
                <Label className="text-base font-semibold text-gray-900 dark:text-white">
                  Track Inventory
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {inventoryData.trackInventory
                    ? 'Stock levels are monitored and updated with each sale'
                    : 'Unlimited stock - no quantity limits'
                  }
                </p>
              </div>
            </div>
            <Switch
              checked={inventoryData.trackInventory}
              onCheckedChange={(checked) => onInventoryDataChange({ trackInventory: checked })}
            />
          </div>

          {/* Allow Backorders Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/60 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${inventoryData.allowBackorders
                  ? 'bg-amber-100 dark:bg-amber-900/30'
                  : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                <ShoppingCart className={`h-5 w-5 ${inventoryData.allowBackorders ? 'text-amber-600' : 'text-gray-400'
                  }`} />
              </div>
              <div>
                <Label className="text-base font-semibold text-gray-900 dark:text-white">
                  Allow Backorders
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {inventoryData.allowBackorders
                    ? 'Customers can order even when out of stock'
                    : 'Product becomes unavailable when stock reaches zero'
                  }
                </p>
              </div>
            </div>
            <Switch
              checked={inventoryData.allowBackorders}
              onCheckedChange={(checked) => onInventoryDataChange({ allowBackorders: checked })}
            />
          </div>

          {/* Low Stock Threshold */}
          {inventoryData.trackInventory && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/60 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <Label htmlFor="lowStockThreshold" className="text-base font-semibold text-gray-900 dark:text-white">
                    Low Stock Alert
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get notified when stock falls below this number
                  </p>
                </div>
              </div>
              <Input
                id="lowStockThreshold"
                type="number"
                placeholder="5"
                min="0"
                value={inventoryData.lowStockThreshold}
                onChange={(e) => onInventoryDataChange({ lowStockThreshold: e.target.value })}
                className="w-24 text-center"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Quantities - Conditional */}
      {inventoryData.trackInventory && (
        <>
          {hasVariants ? (
            /* Variant Stock Notice */
            <Card className="border-0 shadow-sm bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-900">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Stock is managed in the Variants tab
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Since this product has {variantCount} variants, each variant has its own stock level.
                      Go to the <strong>Variants tab</strong> to set stock for each variant.
                    </p>
                    <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" asChild>
                      <Link href="#" onClick={() => {
                        const variantsBtn = document.querySelector('[data-tab="variants"]') as HTMLButtonElement
                        variantsBtn?.click()
                      }}>
                        Go to Variants Tab
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Single Stock Input */
            <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 dark:from-gray-900 dark:to-red-950/20 border-red-100/50 dark:border-red-900/20 hover:shadow-md transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                  Stock Quantity
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Set the available stock for this product
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="space-y-2 flex-1 max-w-xs">
                    <Label htmlFor="globalStock" className="text-base font-semibold">
                      Available Units
                    </Label>
                    <Input
                      id="globalStock"
                      type="number"
                      placeholder="0"
                      min="0"
                      value={inventoryData.globalStock}
                      onChange={(e) => onInventoryDataChange({ globalStock: e.target.value })}
                      className="text-lg"
                    />
                    <p className="text-xs text-gray-500">
                      Number of items in stock
                    </p>
                  </div>

                  {/* Stock Status Preview */}
                  <div className="flex-1">
                    {inventoryData.globalStock && parseInt(inventoryData.globalStock) > 0 ? (
                      <div className={`p-4 rounded-xl ${parseInt(inventoryData.globalStock) <= parseInt(inventoryData.lowStockThreshold || '5')
                          ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800'
                          : 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800'
                        }`}>
                        <div className="flex items-center gap-3">
                          {parseInt(inventoryData.globalStock) <= parseInt(inventoryData.lowStockThreshold || '5') ? (
                            <>
                              <AlertCircle className="h-5 w-5 text-amber-600" />
                              <div>
                                <p className="font-semibold text-amber-900 dark:text-amber-100">Low Stock</p>
                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                  Only {inventoryData.globalStock} units remaining
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <Check className="h-5 w-5 text-green-600" />
                              <div>
                                <p className="font-semibold text-green-900 dark:text-green-100">In Stock</p>
                                <p className="text-sm text-green-700 dark:text-green-300">
                                  {inventoryData.globalStock} units available
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <div>
                            <p className="font-semibold text-red-900 dark:text-red-100">Out of Stock</p>
                            <p className="text-sm text-red-700 dark:text-red-300">
                              {inventoryData.allowBackorders ? 'Backorders allowed' : 'Not available for purchase'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Inventory Rules Summary */}
      <Card className="border-0 shadow-sm bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
            Inventory Rules Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={inventoryData.trackInventory ? "default" : "secondary"}>
                  {inventoryData.trackInventory ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white">Inventory Tracking</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {inventoryData.trackInventory
                  ? "Stock is monitored and updated"
                  : "Unlimited stock assumed"
                }
              </p>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={inventoryData.allowBackorders ? "default" : "secondary"}>
                  {inventoryData.allowBackorders ? "Allowed" : "Not Allowed"}
                </Badge>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white">Backorders</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {inventoryData.allowBackorders
                  ? "Can sell when out of stock"
                  : "Stops when stock is zero"
                }
              </p>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">
                  {inventoryData.lowStockThreshold || '5'} units
                </Badge>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white">Low Stock Alert</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Notify when stock falls below threshold
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}