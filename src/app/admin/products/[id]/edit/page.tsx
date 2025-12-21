import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { ProductEditForm } from '@/domains/admin/product-edit/product-edit-form'
import { getProduct, getCategories, getCollections, getTags } from '@/lib/actions/products'

interface ProductEditPageProps {
  params: Promise<{ id: string }>
}

export default async function ProductEditPage({ params }: ProductEditPageProps) {
  const { id } = await params

  // Fetch all required data in parallel
  const [productResult, categoriesResult, collectionsResult, tagsResult] = await Promise.all([
    getProduct(id),
    getCategories(),
    getCollections(),
    getTags(),
  ])

  if (!productResult.success || !productResult.data) {
    notFound()
  }

  if (!categoriesResult.success || !collectionsResult.success || !tagsResult.success) {
    throw new Error('Failed to load form data')
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Suspense fallback={<ProductEditSkeleton />}>
        <ProductEditForm
          product={productResult.data}
          categories={categoriesResult.data || []}
          collections={collectionsResult.data || []}
          tags={tagsResult.data || []}
        />
      </Suspense>
    </div>
  )
}

function ProductEditSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="h-96 bg-gray-200 rounded animate-pulse" />
          <div className="h-64 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}