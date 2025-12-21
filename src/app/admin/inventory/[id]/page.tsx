'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
    Warehouse,
    Package,
    RefreshCw,
    Plus,
    Minus,
    Save,
    History,
    MoreHorizontal,
    ExternalLink,
    Edit,
    AlertTriangle
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface InventoryItem {
    id: string
    product_id: string
    variant_id: string | null
    quantity: number
    reserved_quantity: number
    track_quantity: boolean
    allow_backorder: boolean
    low_stock_threshold: number
    created_at: string
    updated_at: string
    products: {
        id: string
        title: string
        slug: string
        price: number
        product_images: Array<{ image_url: string; is_primary: boolean }>
    }
    product_variants?: {
        id: string
        name: string
        sku: string
        price: number
    }
}

interface StockLog {
    id: string
    quantity_change: number
    reason: string
    created_at: string
}

export default function InventoryDetailPage() {
    const params = useParams()
    const router = useRouter()
    const inventoryId = params.id as string

    const [inventory, setInventory] = useState<InventoryItem | null>(null)
    const [stockLogs, setStockLogs] = useState<StockLog[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Form state
    const [adjustmentAmount, setAdjustmentAmount] = useState(0)
    const [adjustmentReason, setAdjustmentReason] = useState('')
    const [trackQuantity, setTrackQuantity] = useState(true)
    const [allowBackorder, setAllowBackorder] = useState(false)
    const [lowStockThreshold, setLowStockThreshold] = useState(10)

    const supabase = createClient()

    useEffect(() => {
        if (inventoryId) {
            fetchInventory()
        }
    }, [inventoryId])

    const fetchInventory = async () => {
        try {
            setLoading(true)

            const { data, error } = await supabase
                .from('inventory')
                .select(`
          *,
          products(id, title, slug, price, product_images(image_url, is_primary)),
          product_variants(id, name, sku, price)
        `)
                .eq('id', inventoryId)
                .single()

            if (error) throw error

            setInventory(data as InventoryItem)
            setTrackQuantity(data.track_quantity)
            setAllowBackorder(data.allow_backorder)
            setLowStockThreshold(data.low_stock_threshold)

            // Fetch stock logs (simulated - create table if needed)
            // For now, we'll show recent changes based on updated_at
        } catch (error: any) {
            console.error('Error fetching inventory:', error)
            toast.error('Inventory item not found')
            router.push('/admin/inventory')
        } finally {
            setLoading(false)
        }
    }

    const handleStockAdjustment = async (type: 'add' | 'subtract') => {
        if (!inventory || adjustmentAmount <= 0) {
            toast.error('Please enter a valid amount')
            return
        }

        setSaving(true)

        try {
            const newQuantity = type === 'add'
                ? inventory.quantity + adjustmentAmount
                : Math.max(0, inventory.quantity - adjustmentAmount)

            const { error } = await supabase
                .from('inventory')
                .update({
                    quantity: newQuantity,
                    updated_at: new Date().toISOString()
                })
                .eq('id', inventory.id)

            if (error) throw error

            setInventory({ ...inventory, quantity: newQuantity })
            setAdjustmentAmount(0)
            setAdjustmentReason('')
            toast.success(`Stock ${type === 'add' ? 'increased' : 'decreased'} successfully`)
        } catch (error: any) {
            toast.error('Failed to update stock')
        } finally {
            setSaving(false)
        }
    }

    const handleSaveSettings = async () => {
        if (!inventory) return

        setSaving(true)

        try {
            const { error } = await supabase
                .from('inventory')
                .update({
                    track_quantity: trackQuantity,
                    allow_backorder: allowBackorder,
                    low_stock_threshold: lowStockThreshold,
                    updated_at: new Date().toISOString()
                })
                .eq('id', inventory.id)

            if (error) throw error

            setInventory({
                ...inventory,
                track_quantity: trackQuantity,
                allow_backorder: allowBackorder,
                low_stock_threshold: lowStockThreshold
            })
            toast.success('Inventory settings saved')
        } catch (error: any) {
            toast.error('Failed to save settings')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        )
    }

    if (!inventory) {
        return (
            <div className="text-center py-16">
                <Warehouse className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900">Inventory item not found</h2>
                <p className="text-gray-600 mt-2">The inventory item you're looking for doesn't exist.</p>
                <Button asChild className="mt-4">
                    <Link href="/admin/inventory">Back to Inventory</Link>
                </Button>
            </div>
        )
    }

    const product = inventory.products
    const variant = inventory.product_variants
    const availableStock = inventory.quantity - inventory.reserved_quantity
    const isLowStock = inventory.quantity <= inventory.low_stock_threshold
    const isOutOfStock = inventory.quantity === 0
    const primaryImage = product?.product_images?.find((img) => img.is_primary) || product?.product_images?.[0]

    const getStockStatus = () => {
        if (isOutOfStock) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700 border-red-200' }
        if (isLowStock) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
        return { label: 'In Stock', color: 'bg-green-100 text-green-700 border-green-200' }
    }

    const stockStatus = getStockStatus()

    return (
        <div className="space-y-6">
            {/* Header - Product Detail Style */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
                        {primaryImage?.image_url ? (
                            <Image
                                src={primaryImage.image_url}
                                alt={product?.title || 'Product'}
                                width={56}
                                height={56}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <Package className="w-7 h-7 text-gray-400" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {variant?.name || product?.title || 'Inventory Item'}
                        </h1>
                        <div className="flex items-center space-x-2 mt-1">
                            <Badge className={stockStatus.color}>
                                {stockStatus.label}
                            </Badge>
                            {variant?.sku && (
                                <span className="text-sm text-gray-500 font-mono">SKU: {variant.sku}</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <Button variant="outline" className="border-gray-200 hover:border-red-200 hover:bg-red-50" asChild>
                        <Link href={`/admin/products/${product?.id}`}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Product
                        </Link>
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="border-gray-200">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                                <Link href={`/admin/products/${product?.id}/edit`}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Product
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stock Overview */}
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                        <CardHeader>
                            <CardTitle className="flex items-center text-gray-900 dark:text-white">
                                <Warehouse className="w-5 h-5 mr-2 text-red-600" />
                                Stock Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 text-center">
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Stock</label>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{inventory.quantity}</p>
                                </div>
                                <div className="p-4 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 text-center">
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Available</label>
                                    <p className="text-3xl font-bold text-green-600 mt-2">{availableStock}</p>
                                </div>
                                <div className="p-4 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 text-center">
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reserved</label>
                                    <p className="text-3xl font-bold text-orange-600 mt-2">{inventory.reserved_quantity}</p>
                                </div>
                            </div>

                            {isLowStock && !isOutOfStock && (
                                <div className="flex items-center p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                                    <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
                                    <p className="text-sm text-yellow-700">
                                        Low stock alert: Only {inventory.quantity} units remaining (threshold: {inventory.low_stock_threshold})
                                    </p>
                                </div>
                            )}

                            {isOutOfStock && (
                                <div className="flex items-center p-3 rounded-lg bg-red-50 border border-red-200">
                                    <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
                                    <p className="text-sm text-red-700">This item is out of stock!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Stock Adjustment */}
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                        <CardHeader>
                            <CardTitle className="flex items-center text-gray-900 dark:text-white">
                                <Package className="w-5 h-5 mr-2 text-red-600" />
                                Stock Adjustment
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                                    <Label htmlFor="adjustment" className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                        Adjustment Amount
                                    </Label>
                                    <Input
                                        id="adjustment"
                                        type="number"
                                        min="1"
                                        value={adjustmentAmount}
                                        onChange={(e) => setAdjustmentAmount(parseInt(e.target.value) || 0)}
                                        className="mt-2"
                                        placeholder="Enter amount"
                                    />
                                </div>
                                <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                                    <Label htmlFor="reason" className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                        Reason (Optional)
                                    </Label>
                                    <Input
                                        id="reason"
                                        value={adjustmentReason}
                                        onChange={(e) => setAdjustmentReason(e.target.value)}
                                        className="mt-2"
                                        placeholder="e.g., Restock, Damaged"
                                    />
                                </div>
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <Button
                                    onClick={() => handleStockAdjustment('add')}
                                    disabled={saving || adjustmentAmount <= 0}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Stock
                                </Button>
                                <Button
                                    onClick={() => handleStockAdjustment('subtract')}
                                    disabled={saving || adjustmentAmount <= 0}
                                    variant="destructive"
                                    className="flex-1"
                                >
                                    <Minus className="w-4 h-4 mr-2" />
                                    Remove Stock
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Product Info */}
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                        <CardHeader>
                            <CardTitle className="flex items-center text-gray-900 dark:text-white">
                                <Package className="w-5 h-5 mr-2 text-red-600" />
                                Product Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Product</label>
                                    <Link
                                        href={`/admin/products/${product?.id}`}
                                        className="text-red-600 hover:underline font-medium mt-1 block"
                                    >
                                        {product?.title}
                                    </Link>
                                </div>
                                {variant && (
                                    <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Variant</label>
                                        <p className="text-gray-900 dark:text-white font-medium mt-1">{variant.name}</p>
                                    </div>
                                )}
                                <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Price</label>
                                    <p className="text-gray-900 dark:text-white font-medium mt-1">
                                        ₹{(variant?.price || product?.price || 0).toLocaleString('en-IN')}
                                    </p>
                                </div>
                                {variant?.sku && (
                                    <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">SKU</label>
                                        <p className="text-gray-900 dark:text-white font-mono text-sm mt-1">{variant.sku}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Inventory Settings */}
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                        <CardHeader>
                            <CardTitle className="flex items-center text-gray-900 dark:text-white">
                                <Warehouse className="w-5 h-5 mr-2 text-red-600" />
                                Inventory Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                                <span className="text-gray-700 dark:text-gray-300">Track Quantity</span>
                                <Switch
                                    checked={trackQuantity}
                                    onCheckedChange={setTrackQuantity}
                                />
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                                <span className="text-gray-700 dark:text-gray-300">Allow Backorders</span>
                                <Switch
                                    checked={allowBackorder}
                                    onCheckedChange={setAllowBackorder}
                                />
                            </div>
                            <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                                <Label htmlFor="threshold" className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    Low Stock Threshold
                                </Label>
                                <Input
                                    id="threshold"
                                    type="number"
                                    min="0"
                                    value={lowStockThreshold}
                                    onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 0)}
                                    className="mt-2"
                                />
                            </div>

                            <Button
                                onClick={handleSaveSettings}
                                disabled={saving}
                                className="w-full bg-red-600 hover:bg-red-700"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {saving ? 'Saving...' : 'Save Settings'}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Metadata */}
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                        <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-white">Metadata</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800">
                                <span className="text-gray-500 text-sm">Created:</span>
                                <span className="text-gray-900 dark:text-white font-medium text-sm">
                                    {new Date(inventory.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800">
                                <span className="text-gray-500 text-sm">Updated:</span>
                                <span className="text-gray-900 dark:text-white font-medium text-sm">
                                    {new Date(inventory.updated_at).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Inventory ID</label>
                                <p className="text-gray-600 dark:text-gray-400 text-xs font-mono mt-1 break-all">{inventory.id}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Links */}
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                        <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-white">Quick Links</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="outline" className="w-full border-red-200 text-red-700 hover:bg-red-50" asChild>
                                <Link href={`/admin/products/${product?.id}`}>
                                    <Package className="w-4 h-4 mr-2" />
                                    View Product
                                </Link>
                            </Button>
                            <Button variant="outline" className="w-full border-gray-200 hover:border-red-200" asChild>
                                <Link href="/admin/inventory">
                                    <Warehouse className="w-4 h-4 mr-2" />
                                    All Inventory
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
