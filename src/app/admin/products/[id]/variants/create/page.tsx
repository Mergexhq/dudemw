import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getProduct } from '@/lib/actions/products'
import { VariantCreateView } from '@/domains/admin/variants/variant-create-view'

interface CreateVariantPageProps {
  params: Promise<{ id: string }>
}

export default async function CreateVariantPage({ params }: CreateVariantPageProps) {
  const { id } = await params
  const result = await getProduct(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const product = result.data

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    }>
      <VariantCreateView product={product} />
    </Suspense>
  )
}