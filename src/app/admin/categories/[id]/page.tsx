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
    FolderTree,
    RefreshCw,
    ExternalLink,
    ChevronRight,
    MoreHorizontal,
    Archive
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getCategoryAction, deleteCategoryAction } from '@/lib/actions/categories'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Product {
    id: string
    title: string
    slug: string
    price: number
    status: string
    images: string[]
}

export default function CategoryDetailPage() {
    const params = useParams()
    const router = useRouter()
    const categoryId = params.id as string

    const [category, setCategory] = useState<any>(null)
    const [products, setProducts] = useState<Product[]>([])
    const [subcategories, setSubcategories] = useState<any[]>([])
    const [parentCategory, setParentCategory] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        if (categoryId) {
            fetchCategory()
        }
    }, [categoryId])

    const fetchCategory = async () => {
        try {
            setLoading(true)

            const result = await getCategoryAction(categoryId)

            if (!result.success) {
                toast.error('Category not found')
                router.push('/admin/categories')
                return
            }

            const categoryData = (result as any).data
            if (!categoryData) {
                toast.error('Category not found')
                router.push('/admin/categories')
                return
            }

            setCategory(categoryData)

            const { data: productData, error: productError } = await supabase
                .from('product_categories')
                .select(`
          product:products(id, title, slug, price, status, images)
        `)
                .eq('category_id', categoryId)
                .limit(12)

            if (!productError && productData) {
                setProducts(productData.map(p => p.product).filter(Boolean) as Product[])
            }

            const { data: subData, error: subError } = await supabase
                .from('categories')
                .select('*')
                .eq('parent_id', categoryId)

            if (!subError && subData) {
                setSubcategories(subData)
            }

            if (categoryData.parent_id) {
                const parentResult = await getCategoryAction(categoryData.parent_id)
                if (parentResult.success && 'data' in parentResult) {
                    setParentCategory(parentResult.data)
                }
            }
        } catch (error: any) {
            console.error('Error fetching category:', error)
            toast.error('Failed to load category')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!category) return

        if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
            return
        }

        try {
            setDeleting(true)

            const result = await deleteCategoryAction(category.id)

            if (!result.success) {
                throw new Error(result.error)
            }

            toast.success('Category deleted successfully')
            router.push('/admin/categories')
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete category')
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

    if (!category) {
        return (
            <div className="text-center py-16">
                <FolderTree className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900">Category not found</h2>
                <p className="text-gray-600 mt-2">The category you're looking for doesn't exist.</p>
                <Button asChild className="mt-4">
                    <Link href="/admin/categories">Back to Categories</Link>
                </Button>
            </div>
        )
    }

    const productCount = category.product_categories?.[0]?.count || products.length || 0

    return (
        <div className="space-y-6">
            {/* Header - Product Detail Style */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
                        {category.image_url || category.homepage_thumbnail_url || category.plp_square_thumbnail_url ? (
                            <Image
                                src={category.image_url || category.homepage_thumbnail_url || category.plp_square_thumbnail_url}
                                alt={category.name}
                                width={56}
                                height={56}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <FolderTree className="w-7 h-7 text-gray-400" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{category.name}</h1>
                        <div className="flex items-center space-x-2 mt-1">
                            {parentCategory && (
                                <>
                                    <Link href={`/admin/categories/${parentCategory.id}`} className="text-sm text-gray-500 hover:text-red-600">
                                        {parentCategory.name}
                                    </Link>
                                    <ChevronRight className="h-3 w-3 text-gray-400" />
                                </>
                            )}
                            <span className="text-sm text-gray-500 font-mono">/{category.slug}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <Button variant="outline" className="border-gray-200 hover:border-red-200 hover:bg-red-50" asChild>
                        <Link href={`/categories/${category.slug}`}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Storefront
                        </Link>
                    </Button>
                    <Button className="bg-red-600 hover:bg-red-700 text-white" asChild>
                        <Link href={`/admin/categories/${category.id}/edit`}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Category
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
                            <DropdownMenuItem>
                                <Archive className="w-4 h-4 mr-2" />
                                Archive Category
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={handleDelete}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Category
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Category Summary */}
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                        <CardHeader>
                            <CardTitle className="flex items-center text-gray-900 dark:text-white">
                                <FolderTree className="w-5 h-5 mr-2 text-red-600" />
                                Category Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Name</label>
                                    <p className="text-gray-900 dark:text-white font-medium mt-1">{category.name}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Handle</label>
                                    <p className="text-gray-900 dark:text-white font-mono text-sm mt-1">/{category.slug}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Products</label>
                                    <p className="text-gray-900 dark:text-white font-medium mt-1">{productCount} products</p>
                                </div>
                                <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subcategories</label>
                                    <p className="text-gray-900 dark:text-white font-medium mt-1">{subcategories.length} subcategories</p>
                                </div>
                            </div>

                            {category.description && (
                                <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</label>
                                    <p className="text-gray-900 dark:text-white mt-1">{category.description}</p>
                                </div>
                            )}

                            {parentCategory && (
                                <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Parent Category</label>
                                    <Link
                                        href={`/admin/categories/${parentCategory.id}`}
                                        className="text-red-600 hover:underline font-medium mt-1 block"
                                    >
                                        {parentCategory.name}
                                    </Link>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 text-sm pt-2">
                                <div className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800">
                                    <span className="text-gray-500">Created:</span>
                                    <span className="text-gray-900 dark:text-white font-medium">
                                        {category.created_at ? new Date(category.created_at).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800">
                                    <span className="text-gray-500">Updated:</span>
                                    <span className="text-gray-900 dark:text-white font-medium">
                                        {category.updated_at ? new Date(category.updated_at).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Subcategories */}
                    {subcategories.length > 0 && (
                        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center text-gray-900 dark:text-white">
                                        <FolderTree className="w-5 h-5 mr-2 text-red-600" />
                                        Subcategories
                                    </div>
                                    <Badge variant="secondary">{subcategories.length}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {subcategories.map((sub) => (
                                        <Link
                                            key={sub.id}
                                            href={`/admin/categories/${sub.id}`}
                                            className="flex justify-between items-center p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-red-200 hover:shadow-sm transition-all duration-200"
                                        >
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white hover:text-red-600 transition-colors">{sub.name}</p>
                                                <p className="text-sm text-gray-500 font-mono">/{sub.slug}</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-gray-400" />
                                        </Link>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Products in Category */}
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center text-gray-900 dark:text-white">
                                    <Package className="w-5 h-5 mr-2 text-red-600" />
                                    Products in Category
                                </div>
                                <Badge variant="secondary">{products.length}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {products.length === 0 ? (
                                <div className="text-center py-8">
                                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">No products in this category</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {products.slice(0, 5).map((product) => (
                                        <Link
                                            key={product.id}
                                            href={`/admin/products/${product.id}`}
                                            className="flex justify-between items-center p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-red-200 hover:shadow-sm transition-all duration-200"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden">
                                                    {product.images?.[0] ? (
                                                        <Image
                                                            src={product.images[0]}
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
                                                    <p className="font-semibold text-gray-900 dark:text-white hover:text-red-600 transition-colors">{product.title}</p>
                                                    <p className="text-sm text-gray-500">₹{product.price?.toLocaleString('en-IN')}</p>
                                                </div>
                                            </div>
                                            <Badge className={product.status === 'published'
                                                ? 'bg-green-100 text-green-700 border-green-200'
                                                : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                            }>
                                                {product.status}
                                            </Badge>
                                        </Link>
                                    ))}
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
                    {/* Category Image */}
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                        <CardHeader>
                            <CardTitle className="flex items-center text-gray-900 dark:text-white">
                                <FolderTree className="w-5 h-5 mr-2 text-red-600" />
                                Category Image
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {category.image_url || category.homepage_thumbnail_url || category.plp_square_thumbnail_url ? (
                                <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
                                    <Image
                                        src={category.image_url || category.homepage_thumbnail_url || category.plp_square_thumbnail_url}
                                        alt={category.name}
                                        width={300}
                                        height={300}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                                    <div className="text-center">
                                        <FolderTree className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">No image</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                        <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-white">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="outline" className="w-full border-red-200 text-red-700 hover:bg-red-50" asChild>
                                <Link href={`/admin/categories/${category.id}/edit`}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Category
                                </Link>
                            </Button>
                            <Button variant="outline" className="w-full border-gray-200 hover:border-red-200" asChild>
                                <Link href="/admin/categories/create">
                                    <FolderTree className="w-4 h-4 mr-2" />
                                    Add Subcategory
                                </Link>
                            </Button>
                            <Separator className="my-2" />
                            <Button
                                variant="outline"
                                className="w-full border-red-200 text-red-600 hover:bg-red-50"
                                onClick={handleDelete}
                                disabled={deleting}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {deleting ? 'Deleting...' : 'Delete Category'}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Metadata */}
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                        <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-white">Metadata</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Category ID</label>
                                <p className="text-gray-600 dark:text-gray-400 text-xs font-mono mt-1 break-all">{category.id}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
