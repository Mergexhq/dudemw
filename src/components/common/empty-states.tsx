"use client"

import { Button } from "@/components/ui/button"
import { Plus, Package, Upload } from "lucide-react"
import Link from "next/link"

export function ProductsEmptyState() {
  return (
    <div className="text-center py-16">
      <div className="mx-auto w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
        <Package className="w-12 h-12 text-red-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        No products yet
      </h3>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Get started by creating your first product or importing products from a CSV file.
      </p>
      <div className="flex items-center justify-center space-x-4">
        <Button className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25" asChild>
          <Link href="/admin/products/create">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
        <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300" asChild>
          <Link href="/admin/products/import">
            <Upload className="mr-2 h-4 w-4" />
            Import Products
          </Link>
        </Button>
      </div>
    </div>
  )
}

export function OrdersEmptyState() {
  return (
    <div className="text-center py-16">
      <div className="mx-auto w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
        <Package className="w-12 h-12 text-red-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        No orders yet
      </h3>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        When customers place orders, they will appear here.
      </p>
    </div>
  )
}

export function CustomersEmptyState() {
  return (
    <div className="text-center py-16">
      <div className="mx-auto w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
        <Package className="w-12 h-12 text-red-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        No customers yet
      </h3>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        When customers create accounts or place orders, they will appear here.
      </p>
    </div>
  )
}

export function InventoryEmptyState() {
  return (
    <div className="text-center py-16">
      <div className="mx-auto w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
        <Package className="w-12 h-12 text-red-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        No inventory items yet
      </h3>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Inventory items will appear here when products are added to your store. Start by creating your first product to begin tracking inventory.
      </p>
      <div className="flex items-center justify-center space-x-4">
        <Button className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25" asChild>
          <Link href="/admin/products/create">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
        <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300" asChild>
          <Link href="/admin/products/import">
            <Upload className="mr-2 h-4 w-4" />
            Import Products
          </Link>
        </Button>
      </div>
    </div>
  )
}
