"use client"

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft,
  Save,
  Package,
  DollarSign,
  Warehouse,
  Image as ImageIcon,
  AlertTriangle,
  Trash2
} from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface VariantDetailViewProps {
  product: any
  variant: any
}

export function VariantDetailView({ product, variant }: VariantDetailViewProps) {
  // FRONTEND RESPONSIBILITY: Form state, validation, UI interactions
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)
  
  // Form state for variant editing
  const [formData, setFormData] = useState({
    sku: variant.sku,
    price: variant.price,
    discount_price: variant.discount_price || '',
    stock: variant.stock,
    active: variant.active,
    track_quantity: variant.inventory_items?.[0]?.track_quantity ?? true,
    allow_backorders: variant.inventory_items?.[0]?.allow_backorders ?? false,
    low_stock_threshold: variant.inventory_items?.[0]?.low_stock_threshold ?? 5,
    cost: variant.inventory_items?.[0]?.cost || '',
    barcode: variant.inventory_items?.[0]?.barcode || '',
  })

  // FRONTEND RESPONSIBILITY: Display calculations
  const inventoryItem = variant.inventory_items?.[0]
  const availableStock = inventoryItem?.available_quantity ?? variant.stock
  const reservedStock = inventoryItem?.reserved_quantity ?? 0
  
  const getStockStatus = () => {
    if (formData.stock === 0) return { label: 'Out of Stock', color: 'destructive' as const }
    if (formData.stock < formData.low_stock_threshold) return { label: 'Low Stock', color: 'secondary' as const }
    return { label: 'In Stock', color: 'default' as const }
  }

  const stockStatus = getStockStatus()

  // Get variant option display
  const getOptionDisplay = () => {
    return variant.variant_option_values?.map((vov: any) => ({
      optionName: vov.product_option_values?.product_options?.name,
      valueName: vov.product_option_values?.name,
      hexColor: vov.product_option_values?.hex_color,
    })) || []
  }

  const options = getOptionDisplay()

  // FRONTEND RESPONSIBILITY: Handle form submission (sends intent to backend)
  const handleSave = async () => {
    startTransition(async () => {
      try {
        // Update inventory (backend handles validation and business logic)
        const { data: inventoryResult } = await supabase
          .from('product_variants')
          .update({
            stock: formData.stock,
            track_quantity: formData.track_quantity,
            allow_backorders: formData.allow_backorders,
            low_stock_threshold: formData.low_stock_threshold,
            cost: formData.cost ? parseFloat(formData.cost.toString()) : undefined,
          sku: formData.sku,
          barcode: formData.barcode || undefined,
        })

        if (!inventoryResult) {
          throw new Error('Failed to update variant stock')
        }

        // Update variant (would need a separate domain function)
        // const variantResult = await updateVariant(variant.id, {
        //   sku: formData.sku,
        //   price: formData.price,
        //   discount_price: formData.discount_price ? parseFloat(formData.discount_price.toString()) : null,
        //   active: formData.active,
        // })

        toast.success('Variant updated successfully')
        setIsEditing(false)
        router.refresh() // Refresh to get updated data
      } catch (error) {
        toast.error('Failed to update variant')
        console.error('Error updating variant:', error)
      }
    })
  }

  const handleCancel = () => {
    // Reset form to original values
    setFormData({
      sku: variant.sku,
      price: variant.price,
      discount_price: variant.discount_price || '',
      stock: variant.stock,
      active: variant.active,
      track_quantity: variant.inventory_items?.[0]?.track_quantity ?? true,
      allow_backorders: variant.inventory_items?.[0]?.allow_backorders ?? false,
      low_stock_threshold: variant.inventory_items?.[0]?.low_stock_threshold ?? 5,
      cost: variant.inventory_items?.[0]?.cost || '',
      barcode: variant.inventory_items?.[0]?.barcode || '',
    })
    setIsEditing(false)
  }

  // Check if variant is used in orders (would come from backend)
  const isUsedInOrders = false // This would be computed by backend

  return (
    <div className="space-y-6">
      {/* Header - FRONTEND: Navigation and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/products/${product.id}/variants`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Variants
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {variant.name || 'Default Variant'}
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {formData.sku}
              </code>
              <Badge variant={formData.active ? 'default' : 'secondary'}>
                {formData.active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={isPending}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isPending}>
                <Save className="w-4 h-4 mr-2" />
                {isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              Edit Variant
            </Button>
          )}
        </div>
      </div>

      {/* Warning for variants used in orders */}
      {isUsedInOrders && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">
                This variant has been used in orders. Some changes may affect existing orders.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Variant Identity - FRONTEND: Form fields */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Variant Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  disabled={!isEditing || isPending}
                  placeholder="Enter SKU"
                />
              </div>

              <div className="space-y-2">
                <Label>Variant Options</Label>
                <div className="flex flex-wrap gap-2">
                  {options.map((option: any, index: number) => (
                    <div key={index} className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
                      {option.hexColor && (
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: option.hexColor }}
                        />
                      )}
                      <span className="text-sm font-medium">{option.optionName}:</span>
                      <span className="text-sm">{option.valueName}</span>
                    </div>
                  ))}
                  {options.length === 0 && (
                    <span className="text-sm text-gray-500">No options configured</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                  disabled={!isEditing || isPending}
                  placeholder="Enter barcode (optional)"
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing - FRONTEND: Price form fields */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    disabled={!isEditing || isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount_price">Compare Price</Label>
                  <Input
                    id="discount_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discount_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount_price: e.target.value }))}
                    disabled={!isEditing || isPending}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">Cost per item</Label>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                  disabled={!isEditing || isPending}
                  placeholder="Cost (optional)"
                />
              </div>

              {/* Discount preview */}
              {formData.discount_price && parseFloat(formData.discount_price.toString()) > formData.price && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="text-sm text-green-800 dark:text-green-200">
                    <span className="font-medium">Discount: </span>
                    {(((parseFloat(formData.discount_price.toString()) - formData.price) / parseFloat(formData.discount_price.toString())) * 100).toFixed(1)}% off
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Inventory - FRONTEND: Inventory form fields */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Warehouse className="w-5 h-5 mr-2" />
                Inventory
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Track Quantity</Label>
                  <p className="text-sm text-gray-500">Monitor stock levels for this variant</p>
                </div>
                <Switch
                  checked={formData.track_quantity}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, track_quantity: checked }))}
                  disabled={!isEditing || isPending}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                  disabled={!isEditing || isPending || !formData.track_quantity}
                />
                <div className="flex items-center space-x-2">
                  <Badge variant={stockStatus.color}>{stockStatus.label}</Badge>
                  {reservedStock > 0 && (
                    <span className="text-sm text-gray-500">
                      ({reservedStock} reserved)
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
                <Input
                  id="low_stock_threshold"
                  type="number"
                  min="0"
                  value={formData.low_stock_threshold}
                  onChange={(e) => setFormData(prev => ({ ...prev, low_stock_threshold: parseInt(e.target.value) || 0 }))}
                  disabled={!isEditing || isPending || !formData.track_quantity}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Allow Backorders</Label>
                  <p className="text-sm text-gray-500">Continue selling when out of stock</p>
                </div>
                <Switch
                  checked={formData.allow_backorders}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allow_backorders: checked }))}
                  disabled={!isEditing || isPending || !formData.track_quantity}
                />
              </div>
            </CardContent>
          </Card>

          {/* Variant Status & Metadata - FRONTEND: Status and info display */}
          <Card>
            <CardHeader>
              <CardTitle>Status & Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Active Status</Label>
                  <p className="text-sm text-gray-500">Make this variant available for sale</p>
                </div>
                <Switch
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                  disabled={!isEditing || isPending}
                />
              </div>

              <Separator />

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Created:</span>
                  <span>{new Date(variant.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Updated:</span>
                  <span>{new Date(variant.updated_at).toLocaleDateString()}</span>
                </div>
                {isUsedInOrders && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Used in orders:</span>
                    <Badge variant="outline">Yes</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Variant Images - FRONTEND: Image management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ImageIcon className="w-5 h-5 mr-2" />
                Variant Images
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No variant-specific images</p>
                <Button variant="outline" size="sm" disabled={!isEditing}>
                  Upload Images
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Danger Zone */}
      {!isUsedInOrders && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Delete Variant</h4>
                <p className="text-sm text-gray-500">
                  Permanently delete this variant. This action cannot be undone.
                </p>
              </div>
              <Button variant="destructive" size="sm" disabled={isPending}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Variant
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}