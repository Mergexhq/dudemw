import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { VariantDetailView } from '@/domains/admin/variants/variant-detail-view'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface VariantDetailPageProps {
  params: {
    id: string
    variantId: string
  }
}

export default async function VariantDetailPage({ params }: VariantDetailPageProps) {
  const supabase = createClient()

  // Fetch product with required details
  const { data: product, error: productError } = await supabase
    .from('products')
    .select(`
      *,
      product_categories (
        categories (
          id,
          name
        )
      ),
      product_collections (
        collections (
          id,
          title
        )
      )
    `)
    .eq('id', params.id)
    .single()

  if (productError || !product) {
    notFound()
  }

  // Fetch specific variant with options and images
  const { data: variant, error: variantError } = await supabase
    .from('product_variants')
    .select(`
      *,
      variant_images (*),
      variant_option_values (
        product_option_values (
          id,
          name,
          hex_color,
          product_options (
            id,
            name
          )
        )
      )
    `)
    .eq('id', params.variantId)
    .single()

  if (variantError || !variant) {
    notFound()
  }

  return <VariantDetailView product={product} variant={variant} />
}
