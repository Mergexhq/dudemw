"use client"

import React, { useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Edit, MoreHorizontal, Eye, Copy, Archive, Trash2, Loader2, Package } from "lucide-react"
import { deleteProduct } from "@/lib/actions/products"
import { toast } from "sonner"

interface Product {
  id: string
  title: string
  slug: string
  description: string | null
  category_id: string | null
  status: string | null
  price: number
  compare_price: number | null
  global_stock: number | null
  product_images: Array<{
    id: string
    image_url: string
    alt_text: string | null
    is_primary: boolean | null
  }>
  product_variants: Array<{
    id: string
    name: string | null
    sku: string
    price: number
    stock: number
    active: boolean | null
  }>
  product_categories: Array<{
    categories: {
      id: string
      name: string
      slug: string
    }
  }>
}

interface ProductsTableProps {
  products: Product[]
  searchQuery?: string
  categoryFilter?: string
  statusFilter?: string
  stockFilter?: string
  onRefresh?: () => void
}

const getStockStatus = (stock: number) => {
  if (stock === 0) return { label: "Out of Stock", color: "destructive" as const }
  if (stock < 10) return { label: "Low Stock", color: "secondary" as const }
  return { label: "In Stock", color: "outline" as const }
}

export function ProductsTable({ products, onRefresh }: ProductsTableProps) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const toggleAll = () => {
    setSelectedProducts(prev =>
      prev.length === products.length ? [] : products.map(product => product.id)
    )
  }

  const handleDelete = async (productId: string) => {
    setDeletingId(productId)
    startTransition(async () => {
      try {
        const result = await deleteProduct(productId)
        if (result.success) {
          toast.success("Product deleted successfully")
          setSelectedProducts(prev => prev.filter(id => id !== productId))
          if (onRefresh) {
            onRefresh()
          } else {
            window.location.reload()
          }
        } else {
          toast.error(result.error || "Failed to delete product")
        }
      } catch (error) {
        toast.error("Failed to delete product")
      } finally {
        setDeletingId(null)
      }
    })
  }

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return

    startTransition(async () => {
      try {
        const promises = selectedProducts.map(id => deleteProduct(id))
        const results = await Promise.all(promises)

        const successful = results.filter(r => r.success).length
        const failed = results.filter(r => !r.success).length

        if (successful > 0) {
          toast.success(`${successful} product(s) deleted successfully`)
          if (onRefresh) {
            onRefresh()
          } else {
            window.location.reload()
          }
        }

        if (failed > 0) {
          toast.error(`Failed to delete ${failed} product(s)`)
        }

        setSelectedProducts([])
      } catch (error) {
        toast.error("Failed to delete products")
      }
    })
  }


  if (products.length === 0) {
    return null
  }

  return (
    <div className="space-y-4" data-testid="products-table">
      {selectedProducts.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 md:p-4 bg-red-50/50 rounded-xl border border-red-200/50">
          <span className="text-sm font-semibold text-gray-900">
            {selectedProducts.length} product(s) selected
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 min-h-[44px]">
              <Edit className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Bulk </span>Edit
            </Button>
            <Button variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 min-h-[44px]">
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 min-h-[44px]"
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="z-50 bg-white border border-gray-200 shadow-xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-gray-900">Delete Products</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-600">
                    Are you sure you want to delete {selectedProducts.length} product(s)? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-white text-gray-900 border-gray-300 hover:bg-gray-50">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleBulkDelete}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50" data-testid="products-table-card">
        <CardHeader className="px-4 md:px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Package className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
              Products ({products.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile: Horizontal scroll wrapper */}
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Variants</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => {
                    const primaryImage = product.product_images?.find(img => img.is_primary) || product.product_images?.[0]
                    const categoryName = product.product_categories?.[0]?.categories?.name || 'Uncategorized'
                    const totalStock = product.global_stock || product.product_variants?.reduce((sum, variant) => sum + (variant.stock || 0), 0) || 0
                    const stockStatus = getStockStatus(totalStock)
                    const variantCount = product.product_variants?.length || 0

                    return (
                      <TableRow key={product.id}>
                        <TableCell className="w-12">
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={() => toggleProduct(product.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded-lg transition-colors"
                          >
                            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                              {primaryImage ? (
                                <Image
                                  src={primaryImage.image_url}
                                  alt={primaryImage.alt_text || product.title}
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-xs text-gray-500">IMG</span>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 hover:text-blue-600">{product.title}</div>
                              <div className="text-sm text-gray-600">{product.slug}</div>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className="text-gray-700">{categoryName}</TableCell>
                        <TableCell className="font-semibold text-gray-900">
                          ₹{product.price.toLocaleString('en-IN')}
                          {product.compare_price && product.compare_price > product.price && (
                            <div className="text-xs text-gray-500 line-through">
                              ₹{product.compare_price.toLocaleString('en-IN')}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-700">{totalStock}</span>
                            <Badge className={`text-xs font-medium ${stockStatus.color === 'destructive' ? 'bg-red-100 text-red-700 border-red-200' :
                              stockStatus.color === 'secondary' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                'bg-green-100 text-green-700 border-green-200'
                              }`}>
                              {stockStatus.label}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`font-medium capitalize ${product.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' :
                            product.status === 'draft' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                              'bg-gray-100 text-gray-700 border-gray-200'
                            }`}>
                            {product.status || 'draft'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {variantCount > 0 ? `${variantCount} variant${variantCount > 1 ? 's' : ''}` : 'No variants'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm">
                              <DropdownMenuLabel className="text-gray-900">Actions</DropdownMenuLabel>
                              <DropdownMenuItem className="hover:bg-gray-50" asChild>
                                <Link href={`/products/${product.slug}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Product
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="hover:bg-gray-50" asChild>
                                <Link href={`/admin/products/${product.id}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Product
                                </Link>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="hover:bg-gray-50">
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                              </DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    className="text-red-600 hover:bg-red-50"
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="z-50 bg-white border border-gray-200 shadow-xl">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-gray-900">Delete Product</AlertDialogTitle>
                                    <AlertDialogDescription className="text-gray-600">
                                      Are you sure you want to delete "{product.title}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-white text-gray-900 border-gray-300 hover:bg-gray-50">
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(product.id)}
                                      className="bg-red-600 hover:bg-red-700 text-white"
                                      disabled={deletingId === product.id}
                                    >
                                      {deletingId === product.id ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          Deleting...
                                        </>
                                      ) : (
                                        'Delete'
                                      )}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
