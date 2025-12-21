'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
    ArrowLeft,
    Save,
    RefreshCw,
    Layers,
    Package,
    Search,
    X,
    Settings
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

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

interface Product {
    id: string
    title: string
    slug: string
    price: number
    status: string
    images: string[]
}

interface CollectionProduct {
    id: string
    product_id: string
    sort_order: number
    product: Product
}

export default function EditCollectionPage() {
    const params = useParams()
    const router = useRouter()
    const collectionId = params.id as string

    const [collection, setCollection] = useState<Collection | null>(null)
    const [collectionProducts, setCollectionProducts] = useState<CollectionProduct[]>([])
    const [allProducts, setAllProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    // Form state
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [isActive, setIsActive] = useState(true)
    const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set())

    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [collectionId])

    const fetchData = async () => {
        try {
            setLoading(true)

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

            const { data: cpData, error: cpError } = await supabase
                .from('product_collections')
                .select(`
          id,
          product_id,
          product:products(id, title, slug, price, status, images)
        `)
                .eq('collection_id', collectionId)

            if (!cpError && cpData) {
                setCollectionProducts(cpData.map((cp, index) => ({ ...cp, sort_order: index })) as CollectionProduct[])
                setSelectedProductIds(new Set(cpData?.map(cp => cp.product_id) || []))
            }

            const { data: productsData, error: productsError } = await supabase
                .from('products')
                .select('id, title, slug, price, status, images')
                .order('title', { ascending: true })

            if (!productsError && productsData) {
                setAllProducts(productsData.map(p => ({
                    ...p,
                    status: p.status || 'draft',
                    images: p.images || []
                })) as Product[])
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

            const currentProductIds = new Set(collectionProducts.map(cp => cp.product_id))
            const toAdd = [...selectedProductIds].filter(id => !currentProductIds.has(id))
            const toRemove = [...currentProductIds].filter(id => !selectedProductIds.has(id))

            if (toRemove.length > 0) {
                const { error: removeError } = await supabase
                    .from('product_collections')
                    .delete()
                    .eq('collection_id', collection.id)
                    .in('product_id', toRemove)

                if (removeError) throw removeError
            }

            if (toAdd.length > 0) {
                const newProducts = toAdd.map((productId) => ({
                    collection_id: collection.id,
                    product_id: productId
                }))

                const { error: addError } = await supabase
                    .from('product_collections')
                    .insert(newProducts)

                if (addError) throw addError
            }

            toast.success('Collection updated successfully')
            router.push(`/admin/collections/${collection.id}`)
        } catch (error: any) {
            console.error('Error saving collection:', error)
            toast.error('Failed to save collection')
        } finally {
            setSaving(false)
        }
    }

    const toggleProduct = (productId: string) => {
        const newSelected = new Set(selectedProductIds)
        if (newSelected.has(productId)) {
            newSelected.delete(productId)
        } else {
            newSelected.add(productId)
        }
        setSelectedProductIds(newSelected)
    }

    const filteredProducts = allProducts.filter(product =>
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.slug.toLowerCase().includes(searchQuery.toLowerCase())
    )

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
                <div className="flex items-center space-x-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/collections/${collection.id}`}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Collection
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Edit Collection
                        </h1>
                        <p className="text-gray-500">{collection.title}</p>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <Button variant="outline" asChild>
                        <Link href={`/admin/collections/${collection.id}`}>
                            Cancel
                        </Link>
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-red-600 hover:bg-red-700">
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

                            <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                                <Label htmlFor="slug" className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    URL Slug
                                </Label>
                                <p className="mt-2 text-gray-900 dark:text-white font-mono text-sm">
                                    {title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'collection-slug'}
                                </p>
                            </div>

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

                    {/* Product Selection */}
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between text-gray-900 dark:text-white">
                                <div className="flex items-center">
                                    <Package className="w-5 h-5 mr-2 text-red-600" />
                                    Products
                                </div>
                                <Badge variant="secondary">{selectedProductIds.size} selected</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Search */}
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                                {searchQuery && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-1 top-1/2 -translate-y-1/2"
                                        onClick={() => setSearchQuery('')}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            {/* Product Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto">
                                {filteredProducts.map((product) => {
                                    const isSelected = selectedProductIds.has(product.id)
                                    return (
                                        <div
                                            key={product.id}
                                            onClick={() => toggleProduct(product.id)}
                                            className={`border rounded-xl p-3 cursor-pointer transition-all ${isSelected
                                                ? 'border-red-500 bg-red-50 ring-2 ring-red-500'
                                                : 'border-gray-200 hover:border-gray-300 bg-white/60'
                                                }`}
                                        >
                                            <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden">
                                                {product.images?.[0] ? (
                                                    <Image
                                                        src={product.images[0]}
                                                        alt={product.title}
                                                        width={120}
                                                        height={120}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Package className="h-6 w-6 text-gray-300" />
                                                    </div>
                                                )}
                                            </div>
                                            <h4 className="font-medium text-sm text-gray-900 truncate">{product.title}</h4>
                                            <p className="text-sm text-gray-600">{formatCurrency(product.price)}</p>
                                        </div>
                                    )
                                })}
                            </div>

                            {filteredProducts.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    No products found matching your search.
                                </div>
                            )}
                        </CardContent>
                    </Card>
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
                                    {selectedProductIds.size}
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
