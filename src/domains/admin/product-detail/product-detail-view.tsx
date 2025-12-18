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
  DollarSign, 
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
    if (totalStock === 0) return { label: 'Out of Stock', color: 'destructive' as const }
    if (totalStock < 10) return { label: 'Low Stock', color: 'secondary' as const }
    return { label: 'In Stock', color: 'default' as const }
  }
  
  const stockStatus = getStockStatus()

  return (
    <div className="space-y-6">
      {/* Header - FRONTEND: Navigation and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
            {primaryImage ? (
              <Image
                src={primaryImage.image_url}
                alt={primaryImage.alt_text || product.title}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{product.title}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge 
                variant={product.status === 'active' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {product.status || 'draft'}
              </Badge>
              <span className="text-sm text-gray-500">#{product.id.slice(-8)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/products/${product.slug}`}>
              <ExternalLink className="w-4 h-4 mr-2" />
              View Storefront
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/admin/products/${product.id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Product
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Product Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-gray-900 dark:text-white">{product.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Handle</label>
                  <p className="text-gray-900 dark:text-white">{product.slug}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="text-gray-900 dark:text-white">{categoryName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <Badge variant={product.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                    {product.status || 'draft'}
                  </Badge>
                </div>
              </div>
              
              {product.subtitle && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Subtitle</label>
                  <p className="text-gray-900 dark:text-white">{product.subtitle}</p>
                </div>
              )}
              
              {collectionNames.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Collections</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {collectionNames.map((name: string, index: number) => (
                      <Badge key={index} variant="outline">{name}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Created:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {new Date(product.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Updated:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {new Date(product.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Summary - FRONTEND: Display calculated values */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Pricing Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {variantCount > 1 ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Price Range</span>
                    <span className="font-semibold">
                      ₹{minPrice.toLocaleString('en-IN')} - ₹{maxPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Variants</span>
                    <span className="font-semibold">{variantCount} variants</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Price</span>
                    <span className="font-semibold">₹{product.price.toLocaleString('en-IN')}</span>
                  </div>
                  {product.compare_price && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Compare Price</span>
                      <span className="text-gray-500 line-through">
                        ₹{product.compare_price.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Variant Overview - FRONTEND: Navigation to variants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <List className="w-5 h-5 mr-2" />
                  Variant Overview
                </div>
                <Button variant="outline" size="sm" asChild>
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
                      className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div>
                        <p className="font-medium hover:text-blue-600 dark:hover:text-blue-400">{variant.name || 'Default Variant'}</p>
                        <p className="text-sm text-gray-500">{variant.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{variant.price.toLocaleString('en-IN')}</p>
                        <p className="text-sm text-gray-500">{variant.stock} in stock</p>
                      </div>
                    </Link>
                  ))}
                  {variantCount > 3 && (
                    <p className="text-sm text-gray-500 text-center">
                      +{variantCount - 3} more variants
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No variants created</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Inventory Summary - FRONTEND: Display aggregated values */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Warehouse className="w-5 h-5 mr-2" />
                Inventory Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Total Stock</span>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">{totalStock}</span>
                  <Badge variant={stockStatus.color}>{stockStatus.label}</Badge>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Track Inventory</span>
                <Badge variant={product.track_inventory ? 'default' : 'secondary'}>
                  {product.track_inventory ? 'ON' : 'OFF'}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Backorders</span>
                <Badge variant={product.allow_backorders ? 'default' : 'secondary'}>
                  {product.allow_backorders ? 'Allowed' : 'Not Allowed'}
                </Badge>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/admin/inventory">
                    <Warehouse className="w-4 h-4 mr-2" />
                    Manage Inventory
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/admin/products/${product.id}/variants`}>
                    <List className="w-4 h-4 mr-2" />
                    View Variants
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Media Preview - FRONTEND: Display images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ImageIcon className="w-5 h-5 mr-2" />
                Media Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {product.product_images?.length > 0 ? (
                <div className="space-y-3">
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <Image
                      src={primaryImage.image_url}
                      alt={primaryImage.alt_text || product.title}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex space-x-2">
                    {product.product_images.slice(1, 4).map((image: any, index: number) => (
                      <div key={index} className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
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
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-500">+{product.product_images.length - 4}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description Preview - FRONTEND: Display content */}
          {product.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
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