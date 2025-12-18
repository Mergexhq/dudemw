import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { VariantDetailView } from '@/domains/admin/variants/variant-detail-view'
import { getProduct } from '@/lib/actions/products'

interface VariantDetailPageProps {
  params: Promise<{ 
    id: string
    variantId: string 
  }>
}

export default async function VariantDetailPage({ params }: VariantDetailPageProps) {
  const { id, variantId } = await params
  const result = await getProduct(id)
  
  if (!result.success || !result.data) {
    notFound()
  }

  const product = result.data
  const variant = product.product_variants?.find(v => v.id === variantId)
  
  if (!variant) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Suspense fallback={<VariantDetailSkeleton />}>
        <VariantDetailView 
          product={product}
          variant={variant}
        />
      </Suspense>
    </div>
  )
}

function VariantDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="h-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-6">
          <div className="h-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}