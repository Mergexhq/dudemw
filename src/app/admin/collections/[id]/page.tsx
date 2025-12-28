'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
    Edit,
    Trash2,
    Package,
    Layers,
    RefreshCw,
    ExternalLink,
    MoreHorizontal,
    Archive,
    Eye,
    EyeOff
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Collection {
    id: string
    title: string
    slug: string
    description: string | null
    type: string
    is_active: boolean | null
    rule_json: any
    created_at: string | null
    updated_at: string | null
}

interface Product {
    id: string
    title: string
    slug: string
    price: number
    status: string
    product_images: Array<{ image_url: string; is_primary: boolean }>
}

export default function CollectionDetailPage() {
    const params = useParams()
    const router = useRouter()
    const collectionId = params.id as string

    const [collection, setCollection] = useState<Collection | null>(null)
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        if (collectionId) {
            fetchCollection()
        }
    }, [collectionId])

    const fetchCollection = async () => {
        try {
            setLoading(true)

            // Fetch collection
            const { data: collectionData, error: collectionError } = await supabase
                .from('collections')
                .select('*')
                .eq('id', collectionId)
                .single()

            if (collectionError) throw collectionError

            setCollection(collectionData)

            // Fetch products in collection
            const { data: productCollections, error: pcError } = await supabase
                .from('product_collections')
                .select(`
                    product_id,
                    product:products(id, title, slug, price, status, product_images(image_url, is_primary))
                `)
                .eq('collection_id', collectionId)

            console.log('Product collections response:', productCollections)

            if (!pcError && productCollections) {
                // Filter out any null products and extract the product data
                const validProducts = productCollections
                    .filter((pc: any) => pc.product !== null)
                    .map((pc: any) => pc.product) as Product[]
                console.log('Valid products:', validProducts)
                setProducts(validProducts)
            }
        } catch (error: any) {
            console.error('Error fetching collection:', error)
            toast.error('Collection not found')
            router.push('/admin/collections')
        } finally {
            setLoading(false)
        }
    }

    const handleToggleActive = async () => {
        if (!collection) return

        try {
            const { error } = await supabase
                .from('collections')
                .update({ is_active: !collection.is_active })
                .eq('id', collection.id)

            if (error) throw error

            setCollection({ ...collection, is_active: !collection.is_active })
            toast.success(`Collection ${!collection.is_active ? 'activated' : 'deactivated'}`)
        } catch (error: any) {
            toast.error('Failed to update collection')
        }
    }

    const handleDelete = async () => {
        if (!collection) return

        if (!confirm('Are you sure you want to delete this collection? This action cannot be undone.')) {
            return
        }

        try {
            setDeleting(true)

            const { error } = await supabase
                .from('collections')
                .delete()
                .eq('id', collection.id)

            if (error) throw error

            toast.success('Collection deleted successfully')
            router.push('/admin/collections')
        } catch (error: any) {
            toast.error('Failed to delete collection')
        } finally {
            setDeleting(false)
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
            {/* Header - Product Detail Style */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
                        <Layers className="w-7 h-7 text-gray-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{collection.title}</h1>
                        <div className="flex items-center space-x-2 mt-1">
                            <Badge
                                className={`capitalize ${collection.is_active
                                    ? 'bg-green-100 text-green-700 border-green-200'
                                    : 'bg-gray-100 text-gray-700 border-gray-200'
                                    }`}
                            >
                                {collection.is_active ? 'active' : 'inactive'}
                            </Badge>
                            <span className="text-sm text-gray-500 font-mono">#{collection.id.slice(-8)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <Button variant="outline" className="border-gray-200 hover:border-red-200 hover:bg-red-50" asChild>
                        <Link href={`/products?collection=${collection.id}`}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Storefront
                        </Link>
                    </Button>
                    <Button className="bg-red-600 hover:bg-red-700 text-white" asChild>
                        <Link href={`/admin/collections/${collection.id}/edit`}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Collection
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
                            <DropdownMenuItem onClick={handleToggleActive}>
                                {collection.is_active ? (
                                    <>
                                        <EyeOff className="w-4 h-4 mr-2" />
                                        Deactivate
                                    </>
                                ) : (
                                    <>
                                        <Eye className="w-4 h-4 mr-2" />
                                        Activate
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Archive className="w-4 h-4 mr-2" />
                                Archive Collection
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={handleDelete}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Collection
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Collection Summary */}
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
                        <CardHeader>
                            <CardTitle className="flex items-center text-gray-900">
                                <Layers className="w-5 h-5 mr-2 text-red-600" />
                                Collection Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-lg bg-white/60 border border-gray-100">
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Title</label>
                                    <p className="text-gray-900 font-medium mt-1">{collection.title}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-white/60 border border-gray-100">
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Handle</label>
                                    <p className="text-gray-900 font-mono text-sm mt-1">{collection.slug}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-white/60 border border-gray-100">
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</label>
                                    <p className="text-gray-900 font-medium mt-1 capitalize">{collection.type}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-white/60 border border-gray-100">
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
                                    <div className="mt-1">
                                        <Badge className={`capitalize ${collection.is_active
                                            ? 'bg-green-100 text-green-700 border-green-200'
                                            : 'bg-gray-100 text-gray-700 border-gray-200'
                                            }`}>
                                            {collection.is_active ? 'active' : 'inactive'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {collection.description && (
                                <div className="p-3 rounded-lg bg-white/60 border border-gray-100">
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</label>
                                    <p className="text-gray-900 mt-1">{collection.description}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 text-sm pt-2">
                                <div className="flex items-center justify-between p-2 rounded bg-gray-50">
                                    <span className="text-gray-500">Created:</span>
                                    <span className="text-gray-900 font-medium">
                                        {collection.created_at ? new Date(collection.created_at).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded bg-gray-50">
                                    <span className="text-gray-500">Updated:</span>
                                    <span className="text-gray-900 font-medium">
                                        {collection.updated_at ? new Date(collection.updated_at).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Products in Collection */}
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center text-gray-900">
                                    <Package className="w-5 h-5 mr-2 text-red-600" />
                                    Products in Collection
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Badge variant="secondary">{products.length}</Badge>
                                    <Button variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-50" asChild>
                                        <Link href={`/admin/collections/${collection.id}/edit`}>
                                            Manage Products
                                        </Link>
                                    </Button>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {products.length === 0 ? (
                                <div className="text-center py-8">
                                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">No products in this collection</p>
                                    <Button variant="outline" size="sm" className="mt-3" asChild>
                                        <Link href={`/admin/collections/${collection.id}/edit`}>
                                            Add Products
                                        </Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {products.slice(0, 5).map((product) => {
                                        const primaryImage = product.product_images?.find((img) => img.is_primary) || product.product_images?.[0]
                                        return (
                                            <Link
                                                key={product.id}
                                                href={`/admin/products/${product.id}`}
                                                className="flex justify-between items-center p-4 bg-white/60 rounded-xl border border-gray-100 hover:border-red-200 hover:shadow-sm transition-all duration-200"
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden">
                                                        {primaryImage?.image_url ? (
                                                            <Image
                                                                src={primaryImage.image_url}
                                                                alt={product.title}
                                                                width={40}
                                                                height={40}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <Package className="w-4 h-4 text-gray-300" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 hover:text-red-600 transition-colors">{product.title}</p>
                                                        <p className="text-sm text-gray-500">₹{product.price?.toLocaleString('en-IN')}</p>
                                                    </div>
                                                </div>
                                                <Badge className={product.status === 'published' || product.status === 'active'
                                                    ? 'bg-green-100 text-green-700 border-green-200'
                                                    : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                }>
                                                    {product.status}
                                                </Badge>
                                            </Link>
                                        )
                                    })}
                                    {products.length > 5 && (
                                        <p className="text-sm text-gray-500 text-center py-2">
                                            +{products.length - 5} more products
                                        </p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Collection Stats */}
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
                        <CardHeader>
                            <CardTitle className="flex items-center text-gray-900">
                                <Layers className="w-5 h-5 mr-2 text-red-600" />
                                Collection Stats
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center p-3 rounded-lg bg-white/60 border border-gray-100">
                                <span className="text-gray-500">Products</span>
                                <span className="font-bold text-gray-900">{products.length}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-white/60 border border-gray-100">
                                <span className="text-gray-500">Status</span>
                                <Badge className={collection.is_active
                                    ? 'bg-green-100 text-green-700 border-green-200'
                                    : 'bg-gray-100 text-gray-700 border-gray-200'
                                }>
                                    {collection.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-white/60 border border-gray-100">
                                <span className="text-gray-500">Type</span>
                                <span className="font-medium text-gray-900 capitalize">{collection.type}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
                        <CardHeader>
                            <CardTitle className="text-gray-900">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="outline" className="w-full border-red-200 text-red-700 hover:bg-red-50" asChild>
                                <Link href={`/admin/collections/${collection.id}/edit`}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Collection
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full border-gray-200 hover:border-red-200"
                                onClick={handleToggleActive}
                            >
                                {collection.is_active ? (
                                    <>
                                        <EyeOff className="w-4 h-4 mr-2" />
                                        Deactivate
                                    </>
                                ) : (
                                    <>
                                        <Eye className="w-4 h-4 mr-2" />
                                        Activate
                                    </>
                                )}
                            </Button>
                            <Separator className="my-2" />
                            <Button
                                variant="outline"
                                className="w-full border-red-200 text-red-600 hover:bg-red-50"
                                onClick={handleDelete}
                                disabled={deleting}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {deleting ? 'Deleting...' : 'Delete Collection'}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Metadata */}
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
                        <CardHeader>
                            <CardTitle className="text-gray-900">Metadata</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="p-3 rounded-lg bg-white/60 border border-gray-100">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Collection ID</label>
                                <p className="text-gray-600 text-xs font-mono mt-1 break-all">{collection.id}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-white/60 border border-gray-100">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Slug</label>
                                <p className="text-gray-600 text-xs font-mono mt-1">{collection.slug}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
