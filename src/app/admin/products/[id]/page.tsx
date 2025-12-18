import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { ProductDetailView } from '@/domains/admin/product-detail/product-detail-view'
import { getProduct } from '@/lib/actions/products'

interface ProductDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  try {
    const { id } = await params
    const result = await getProduct(id)
    
    if (!result.success) {
      console.error('Failed to fetch product:', result.error)
      notFound()
    }

    if (!result.data) {
      console.log('Product data is null for ID:', params.id)
      notFound()
    }

    return (
      <div className="space-y-6">
        <Suspense fallback={<ProductDetailSkeleton />}>
          <ProductDetailView product={result.data} />
        </Suspense>
      </div>
    )
  } catch (error) {
    console.error('Error in ProductDetailPage:', error)
    notFound()
  }
}

function ProductDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}