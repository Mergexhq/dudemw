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
import { toast } from 'sonner'
import { ProductSelectionStep } from '@/domains/admin/collection-creation'
import type { SelectedProductWithVariant, Product } from '@/domains/admin/collection-creation/types'
import { getCollectionWithProductDetailsAction, updateCollectionAction, manageCollectionProductsAction } from '@/lib/actions/collections'

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

    useEffect(() => {
        fetchData()
    }, [collectionId])

    const fetchData = async () => {
        try {
            setLoading(true)

            const result = await getCollectionWithProductDetailsAction(collectionId)
            if (!result.success || !result.data) throw new Error(result.error || 'Collection not found')

            const { collection: collectionData, products: productsList } = result.data as any

            setCollection({
                ...collectionData,
                is_active: collectionData.is_active ?? true,
                created_at: collectionData.created_at ? new Date(collectionData.created_at).toISOString() : '',
                updated_at: collectionData.updated_at ? new Date(collectionData.updated_at).toISOString() : '',
            } as Collection)
            setTitle(collectionData.title)
            setDescription(collectionData.description || '')
            setIsActive(collectionData.is_active ?? true)

            const productMap = new Map<string, SelectedProductWithVariant>()
            const initialIds = new Set<string>()

                ; (productsList || []).forEach((product: any) => {
                    if (product) {
                        const typedProduct: Product = {
                            id: product.id,
                            title: product.title,
                            handle: product.slug,
                            price: product.price,
                            product_images: product.product_images || [],
                            product_variants: product.product_variants || []
                        }

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
            const updateResult = await updateCollectionAction(collection.id, {
                title: title.trim(),
                description: description.trim() || null,
                is_active: isActive,
            })
            if (!updateResult.success) throw new Error(updateResult.error)

            // Update Products
            const currentSelectedIds = new Set(selectedProducts.keys())
            const toAdd = [...currentSelectedIds].filter(id => !initialProductIds.has(id))
            const toRemove = [...initialProductIds].filter(id => !currentSelectedIds.has(id))

            if (toAdd.length > 0 || toRemove.length > 0) {
                const productResult = await manageCollectionProductsAction(
                    collection.id, toAdd, toRemove, initialProductIds.size
                )
                if (!productResult.success) throw new Error(productResult.error)
            }

            toast.success('Collection updated successfully')
            router.push(`/admin/collections/${collection.id}`)

        } catch (error: any) {
            const errorMessage = error?.message || 'Unknown error'
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
                    <h1 className="text-2xl font-bold text-gray-900">
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
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
                        <CardHeader>
                            <CardTitle className="flex items-center text-gray-900">
                                <Layers className="w-5 h-5 mr-2 text-red-600" />
                                Collection Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 rounded-lg bg-white/60 border border-gray-100">
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

                            <div className="p-3 rounded-lg bg-white/60 border border-gray-100">
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
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
                        <CardHeader>
                            <CardTitle className="text-gray-900">Collection Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-white/60 border border-gray-100">
                                <div>
                                    <Label htmlFor="active" className="text-gray-700">Active</Label>
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
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
                        <CardHeader>
                            <CardTitle className="flex items-center text-gray-900">
                                <Settings className="w-5 h-5 mr-2 text-red-600" />
                                Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="p-4 rounded-lg bg-white/60 border border-gray-100 text-center">
                                <div className="text-3xl font-bold text-gray-900">
                                    {selectedProducts.size}
                                </div>
                                <div className="text-sm text-gray-500">Products selected</div>
                            </div>
                            <div className="p-3 rounded-lg bg-white/60 border border-gray-100">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</label>
                                <p className="text-gray-900 font-medium mt-1 capitalize">{collection.type}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Metadata */}
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
                        <CardHeader>
                            <CardTitle className="text-gray-900">Metadata</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between p-2 rounded bg-gray-50">
                                <span className="text-gray-500 text-sm">Created:</span>
                                <span className="text-gray-900 font-medium text-sm">
                                    {new Date(collection.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded bg-gray-50">
                                <span className="text-gray-500 text-sm">Updated:</span>
                                <span className="text-gray-900 font-medium text-sm">
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
