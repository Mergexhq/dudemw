'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
    ArrowLeft,
    Save,
    RefreshCw,
    Layers,
    Settings,
    Package
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ProductSelectionStep } from '@/domains/admin/collection-creation'
import type { SelectedProductWithVariant, Product } from '@/domains/admin/collection-creation/types'

interface Collection {
    id: string
    title: string
    slug: string
    description: string | null
    type: string
    is_active: boolean
    rule_json: any
    created_at: string
    updated_at: string
}

export default function EditCollectionPage() {
    const params = useParams()
    const router = useRouter()
    const collectionId = params.id as string

    const [collection, setCollection] = useState<Collection | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Form state
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [isActive, setIsActive] = useState(true)
    // Use Map for compatibility with ProductSelectionStep
    const [selectedProducts, setSelectedProducts] = useState<Map<string, SelectedProductWithVariant>>(new Map())
    // Keep track of initial product IDs for efficient diffing
    const [initialProductIds, setInitialProductIds] = useState<Set<string>>(new Set())

    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [collectionId])

    const fetchData = async () => {
        try {
            setLoading(true)

            // Fetch Collection Details
            const { data: collectionData, error: collectionError } = await supabase
                .from('collections')
                .select('*')
                .eq('id', collectionId)
                .single()

            if (collectionError) throw collectionError
            setCollection({
                ...collectionData,
                is_active: collectionData.is_active ?? true
            } as Collection)
            setTitle(collectionData.title)
            setDescription(collectionData.description || '')
            setIsActive(collectionData.is_active ?? true)

            // Fetch Collection Products with full product details AND variants
            // We need variants to populate SelectedProductWithVariant correctly
            const { data: cpData, error: cpError } = await supabase
                .from('collection_products')
                .select(`
                    id,
                    product_id,
                    product:products(
                        id, 
                        title, 
                        slug, 
                        price, 
                        status, 
                        images,
                        product_variants(
                            id,
                            name,
                            sku,
                            price,
                            discount_price,
                            stock,
                            active
                        ),
                        product_images(
                            id,
                            image_url,
                            alt_text,
                            is_primary,
                            sort_order
                        )
                    )
                `)
                .eq('collection_id', collectionId)
                .order('sort_order', { ascending: true })

            if (!cpError && cpData) {
                const productMap = new Map<string, SelectedProductWithVariant>()
                const initialIds = new Set<string>()

                cpData.forEach((cp: any) => {
                    const product = cp.product
                    if (product) {
                        // Ensure product object matches Product interface
                        const typedProduct: Product = {
                            id: product.id,
                            title: product.title,
                            handle: product.slug, // Map slug to handle if needed by type
                            price: product.price,
                            product_images: product.product_images || [],
                            product_variants: product.product_variants || []
                        }

                        // Find a default selected variant (first active one)
                        // Since DB doesn't store selected variant for collection, we pick best available
                        const defaultVariant = product.product_variants?.find((v: any) => v.active) || product.product_variants?.[0]
                        const selectedVariantId = defaultVariant?.id || ''

                        productMap.set(product.id, {
                            product: typedProduct,
                            selectedVariantId: selectedVariantId
                        })
                        initialIds.add(product.id)
                    }
                })

                setSelectedProducts(productMap)
                setInitialProductIds(initialIds)
            }

        } catch (error: any) {
            console.error('Error fetching data:', error)
            toast.error('Failed to load collection')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!collection) return

        if (!title.trim()) {
            toast.error('Please enter a collection title')
            return
        }

        try {
            setSaving(true)

            // Update Collection Info
            const { error: updateError } = await supabase
                .from('collections')
                .update({
                    title: title.trim(),
                    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
                    description: description.trim() || null,
                    is_active: isActive,
                    updated_at: new Date().toISOString()
                })
                .eq('id', collection.id)

            if (updateError) throw updateError

            // Update Products
            const currentSelectedIds = new Set(selectedProducts.keys())

            // Determine items to add and remove
            const toAdd = [...currentSelectedIds].filter(id => !initialProductIds.has(id))
            const toRemove = [...initialProductIds].filter(id => !currentSelectedIds.has(id))

            // Remove unselected products
            if (toRemove.length > 0) {
                const { error: removeError } = await supabase
                    .from('collection_products')
                    .delete()
                    .eq('collection_id', collection.id)
                    .in('product_id', toRemove)

                if (removeError) throw removeError
            }

            // Add new products
            if (toAdd.length > 0) {
                const newProducts = toAdd.map((productId, index) => ({
                    collection_id: collection.id,
                    product_id: productId,
                    sort_order: initialProductIds.size + index + 1
                }))

                const { error: addError } = await supabase
                    .from('collection_products')
                    .insert(newProducts)

                if (addError) throw addError
            }

            toast.success('Collection updated successfully')
            router.push(`/admin/collections/${collection.id}`)

        } catch (error: any) {
            const errorMessage = error?.message || error?.error_description || JSON.stringify(error) || 'Unknown error'
            console.error('Error saving collection:', errorMessage, error)
            toast.error(`Failed to save collection: ${errorMessage}`)
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

    if (!collection) {
        return (
            <div className="text-center py-16">
                <Layers className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900">Collection not found</h2>
                <p className="text-gray-600 mt-2">The collection you're looking for doesn't exist.</p>
                <Button asChild className="mt-4">
                    <Link href="/admin/collections">Back to Collections</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Edit Collection
                    </h1>
                    <p className="text-gray-500">{collection.title}</p>
                </div>

                <div className="flex items-center space-x-2">
                    <Button variant="outline" asChild>
                        <Link href={`/admin/collections/${collection.id}`}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Collection
                        </Link>
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-red-600 hover:bg-red-700 text-white">
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Collection'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                        <CardHeader>
                            <CardTitle className="flex items-center text-gray-900 dark:text-white">
                                <Layers className="w-5 h-5 mr-2 text-red-600" />
                                Collection Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                                <Label htmlFor="title" className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    Title *
                                </Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Collection name"
                                    className="mt-2 border-0 bg-transparent p-0 text-gray-900 font-medium focus-visible:ring-0"
                                />
                            </div>

                            {/* Removed Slug/Handle display as requested */}

                            <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                                <Label htmlFor="description" className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    Description
                                </Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Collection description"
                                    rows={4}
                                    className="mt-2 border-0 bg-transparent p-0 text-gray-900 focus-visible:ring-0 resize-none"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Product Selection - Using the shared component */}
                    <ProductSelectionStep
                        selectedProducts={selectedProducts}
                        onProductsChange={setSelectedProducts}
                    />
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Status */}
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                        <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-white">Collection Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                                <div>
                                    <Label htmlFor="active" className="text-gray-700 dark:text-gray-300">Active</Label>
                                    <p className="text-xs text-gray-500 mt-1">Make visible on store</p>
                                </div>
                                <Switch
                                    id="active"
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Summary */}
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                        <CardHeader>
                            <CardTitle className="flex items-center text-gray-900 dark:text-white">
                                <Settings className="w-5 h-5 mr-2 text-red-600" />
                                Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="p-4 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 text-center">
                                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {selectedProducts.size}
                                </div>
                                <div className="text-sm text-gray-500">Products selected</div>
                            </div>
                            <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</label>
                                <p className="text-gray-900 dark:text-white font-medium mt-1 capitalize">{collection.type}</p>
                            </div>
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
                                    {new Date(collection.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800">
                                <span className="text-gray-500 text-sm">Updated:</span>
                                <span className="text-gray-900 dark:text-white font-medium text-sm">
                                    {new Date(collection.updated_at).toLocaleDateString()}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
