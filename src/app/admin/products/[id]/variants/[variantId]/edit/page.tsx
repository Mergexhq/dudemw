import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getProduct } from '@/lib/actions/products'
import { VariantEditView } from '@/domains/admin/variants/variant-edit-view'

interface EditVariantPageProps {
  params: Promise<{
    id: string
    variantId: string
  }>
}

export default async function EditVariantPage({ params }: EditVariantPageProps) {
  const { id, variantId } = await params
  const result = await getProduct(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const product = result.data
  const variant = product.product_variants?.find((v: any) => v.id.toString() === variantId)

  if (!variant) {
    notFound()
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    }>
      <VariantEditView product={product} variant={variant} />
    </Suspense>
  )
}
