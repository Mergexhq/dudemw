"use client"

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Edit,
  ExternalLink,
  Package,
  IndianRupee,
  Warehouse,
  Image as ImageIcon,
  List,
  MoreHorizontal,
  Archive,
  Trash2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ProductDetailViewProps {
  product: any // Type from domain
}

export function ProductDetailView({ product }: ProductDetailViewProps) {
  // FRONTEND RESPONSIBILITY: Display state, navigation, read-only calculations

  // Calculate display values (read-only, no business logic)
  const primaryImage = product.product_images?.find((img: any) => img.is_primary) || product.product_images?.[0]
  const totalStock = product.product_variants?.reduce((sum: number, variant: any) => sum + (variant.stock || 0), 0) || 0
  const variantCount = product.product_variants?.length || 0
  const categoryName = product.product_categories?.[0]?.categories?.name || 'Uncategorized'
  const collectionNames = product.product_collections?.map((pc: any) => pc.collections?.title).filter(Boolean) || []

  // Price range calculation (display only)
  const prices = product.product_variants?.map((v: any) => v.price) || [product.price]
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)

  // Stock status (display only)
  const getStockStatus = () => {
    if (totalStock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700 border-red-200' }
    if (totalStock < 10) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
    return { label: 'In Stock', color: 'bg-green-100 text-green-700 border-green-200' }
  }

  const stockStatus = getStockStatus()

  return (
    <div className="space-y-6">
      {/* Header - FRONTEND: Navigation and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
            {primaryImage ? (
              <Image
                src={primaryImage.image_url}
                alt={primaryImage.alt_text || product.title}
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="w-7 h-7 text-gray-400" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{product.title}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge
                className={`capitalize ${product.status === 'active'
                  ? 'bg-green-100 text-green-700 border-green-200'
                  : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                  }`}
              >
                {product.status || 'draft'}
              </Badge>
              <span className="text-sm text-gray-500 font-mono">#{product.id.slice(-8)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" className="border-gray-200 hover:border-red-200 hover:bg-red-50" asChild>
            <Link href={`/products/${product.slug}`}>
              <ExternalLink className="w-4 h-4 mr-2" />
              View Storefront
            </Link>
          </Button>
          <Button className="bg-red-600 hover:bg-red-700 text-white" asChild>
            <Link href={`/admin/products/${product.id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Product
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
                Archive Product
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Product
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Summary - FRONTEND: Read-only display */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-white">
                <Package className="w-5 h-5 mr-2 text-red-600" />
                Product Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Name</label>
                  <p className="text-gray-900 dark:text-white font-medium mt-1">{product.title}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Handle</label>
                  <p className="text-gray-900 dark:text-white font-mono text-sm mt-1">{product.slug}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Category</label>
                  <p className="text-gray-900 dark:text-white font-medium mt-1">{categoryName}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
                  <div className="mt-1">
                    <Badge className={`capitalize ${product.status === 'active'
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                      }`}>
                      {product.status || 'draft'}
                    </Badge>
                  </div>
                </div>
              </div>

              {product.subtitle && (
                <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subtitle</label>
                  <p className="text-gray-900 dark:text-white mt-1">{product.subtitle}</p>
                </div>
              )}

              {collectionNames.length > 0 && (
                <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Collections</label>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {collectionNames.map((name: string, index: number) => (
                      <Badge key={index} variant="outline" className="bg-white">{name}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm pt-2">
                <div className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800">
                  <span className="text-gray-500">Created:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {new Date(product.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800">
                  <span className="text-gray-500">Updated:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {new Date(product.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Summary - FRONTEND: Display calculated values */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-white">
                <IndianRupee className="w-5 h-5 mr-2 text-red-600" />
                Pricing Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {variantCount > 1 ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                    <span className="text-gray-500">Price Range</span>
                    <span className="font-bold text-lg text-gray-900 dark:text-white">
                      ₹{minPrice.toLocaleString('en-IN')} - ₹{maxPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                    <span className="text-gray-500">Variants</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{variantCount} variants</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                    <span className="text-gray-500">Price</span>
                    <span className="font-bold text-lg text-gray-900 dark:text-white">₹{product.price.toLocaleString('en-IN')}</span>
                  </div>
                  {product.compare_price && (
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                      <span className="text-gray-500">Compare Price</span>
                      <span className="text-gray-400 line-through">
                        ₹{product.compare_price.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Variant Overview - FRONTEND: Navigation to variants */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center text-gray-900 dark:text-white">
                  <List className="w-5 h-5 mr-2 text-red-600" />
                  Variant Overview
                </div>
                <Button variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-50" asChild>
                  <Link href={`/admin/products/${product.id}/variants`}>
                    View All Variants
                  </Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {variantCount > 0 ? (
                <div className="space-y-3">
                  {product.product_variants?.slice(0, 3).map((variant: any) => (
                    <Link
                      key={variant.id}
                      href={`/admin/products/${product.id}/variants/${variant.id}`}
                      className="flex justify-between items-center p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-red-200 hover:shadow-sm transition-all duration-200"
                    >
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white hover:text-red-600 transition-colors">{variant.name || 'Default Variant'}</p>
                        <p className="text-sm text-gray-500 font-mono">{variant.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-white">₹{variant.price.toLocaleString('en-IN')}</p>
                        <p className="text-sm text-gray-500">{variant.stock} in stock</p>
                      </div>
                    </Link>
                  ))}
                  {variantCount > 3 && (
                    <p className="text-sm text-gray-500 text-center py-2">
                      +{variantCount - 3} more variants
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No variants created</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Inventory Summary - FRONTEND: Display aggregated values */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-white">
                <Warehouse className="w-5 h-5 mr-2 text-red-600" />
                Inventory Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                <span className="text-gray-500">Total Stock</span>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-gray-900 dark:text-white">{totalStock}</span>
                  <Badge className={stockStatus.color}>{stockStatus.label}</Badge>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                <span className="text-gray-500">Track Inventory</span>
                <Badge className={product.track_inventory ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'}>
                  {product.track_inventory ? 'ON' : 'OFF'}
                </Badge>
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                <span className="text-gray-500">Backorders</span>
                <Badge className={product.allow_backorders ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-700 border-gray-200'}>
                  {product.allow_backorders ? 'Allowed' : 'Not Allowed'}
                </Badge>
              </div>

              <Separator />

              <div className="space-y-2">
                <Button variant="outline" className="w-full border-red-200 text-red-700 hover:bg-red-50" asChild>
                  <Link href="/admin/inventory">
                    <Warehouse className="w-4 h-4 mr-2" />
                    Manage Inventory
                  </Link>
                </Button>
                <Button variant="outline" className="w-full border-gray-200 hover:border-red-200" asChild>
                  <Link href={`/admin/products/${product.id}/variants`}>
                    <List className="w-4 h-4 mr-2" />
                    View Variants
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Media Preview - FRONTEND: Display images */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-white">
                <ImageIcon className="w-5 h-5 mr-2 text-red-600" />
                Media Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {product.product_images?.length > 0 ? (
                <div className="space-y-3">
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
                    <Image
                      src={primaryImage.image_url}
                      alt={primaryImage.alt_text || product.title}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex space-x-2">
                    {product.product_images.slice(1, 4).map((image: any, index: number) => (
                      <div key={index} className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                        <Image
                          src={image.image_url}
                          alt={image.alt_text || ''}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {product.product_images.length > 4 && (
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        <span className="text-xs text-gray-500 font-medium">+{product.product_images.length - 4}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No images</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description Preview - FRONTEND: Display content */}
          {product.description && (
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 line-clamp-4">
                    {product.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}