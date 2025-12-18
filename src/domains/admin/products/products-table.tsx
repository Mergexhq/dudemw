"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { TableCell } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Edit, MoreHorizontal, Eye, Copy, Archive, Trash2, Loader2 } from "lucide-react"
import { deleteProduct } from "@/lib/actions/products"
import { toast } from "sonner"
import { VirtualizedTable } from "@/components/common/virtualized-table"

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

  // Define columns for virtualized table
  const columns = [
    {
      key: 'checkbox',
      header: '',
      render: (product: Product) => (
        <TableCell className="w-12">
          <Checkbox 
            checked={selectedProducts.includes(product.id)}
            onCheckedChange={() => toggleProduct(product.id)}
          />
        </TableCell>
      ),
    },
    {
      key: 'product',
      header: 'Product',
      render: (product: Product) => {
        const primaryImage = product.product_images?.find(img => img.is_primary) || product.product_images?.[0]
        return (
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
        )
      },
    },
    {
      key: 'category',
      header: 'Category',
      render: (product: Product) => {
        const categoryName = product.product_categories?.[0]?.categories?.name || 'Uncategorized'
        return (
          <TableCell className="text-gray-700">{categoryName}</TableCell>
        )
      },
    },
    {
      key: 'price',
      header: 'Price',
      render: (product: Product) => (
        <TableCell className="font-semibold text-gray-900">
          ₹{product.price.toLocaleString('en-IN')}
          {product.compare_price && product.compare_price > product.price && (
            <div className="text-xs text-gray-500 line-through">
              ₹{product.compare_price.toLocaleString('en-IN')}
            </div>
          )}
        </TableCell>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      render: (product: Product) => {
        const totalStock = product.global_stock || product.product_variants?.reduce((sum, variant) => sum + (variant.stock || 0), 0) || 0
        const stockStatus = getStockStatus(totalStock)
        return (
          <TableCell>
            <div className="flex items-center space-x-2">
              <span className="text-gray-700">{totalStock}</span>
              <Badge className={`text-xs font-medium ${
                stockStatus.color === 'destructive' ? 'bg-red-100 text-red-700 border-red-200' :
                stockStatus.color === 'secondary' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                'bg-green-100 text-green-700 border-green-200'
              }`}>
                {stockStatus.label}
              </Badge>
            </div>
          </TableCell>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (product: Product) => (
        <TableCell>
          <Badge className={`font-medium capitalize ${
            product.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' :
            product.status === 'draft' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
            'bg-gray-100 text-gray-700 border-gray-200'
          }`}>
            {product.status || 'draft'}
          </Badge>
        </TableCell>
      ),
    },
    {
      key: 'variants',
      header: 'Variants',
      render: (product: Product) => {
        const variantCount = product.product_variants?.length || 0
        return (
          <TableCell className="text-gray-700">
            {variantCount > 0 ? `${variantCount} variant${variantCount > 1 ? 's' : ''}` : 'No variants'}
          </TableCell>
        )
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (product: Product) => (
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
              <DropdownMenuItem className="hover:bg-gray-50">
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
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
      ),
    },
  ]

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No products found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4" data-testid="products-table">
      {selectedProducts.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-red-50/50 rounded-xl border border-red-200/50">
          <span className="text-sm font-semibold text-gray-900">
            {selectedProducts.length} product(s) selected
          </span>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300">
              <Edit className="mr-2 h-4 w-4" />
              Bulk Edit
            </Button>
            <Button variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300">
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
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

      <div className="rounded-xl border border-gray-200/50 shadow-sm bg-white overflow-hidden relative">
        <VirtualizedTable
          data={products}
          columns={columns}
          estimatedRowHeight={100}
          emptyMessage="No products found. Try adjusting your filters or create a new product."
        />
      </div>
    </div>
  )
}
