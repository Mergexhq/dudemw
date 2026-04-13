import prisma from '@/lib/db'
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
  // Fetch product with categories and collections
  const product = await prisma.products.findUnique({
    where: { id: params.id },
    include: {
      product_categories: {
        include: {
          categories: {
            select: { id: true, name: true },
          },
        },
      },
      product_collections: {
        include: {
          collections: {
            select: { id: true, title: true },
          },
        },
      },
    },
  })

  if (!product) {
    notFound()
  }

  // Fetch specific variant with images and option values
  const variant = await prisma.product_variants.findUnique({
    where: { id: params.variantId },
    include: {
      variant_images: true,
      variant_option_values: {
        include: {
          product_option_values: {
            include: {
              product_options: {
                select: { id: true, name: true },
              },
            },
          },
        },
      },
    },
  })

  if (!variant) {
    notFound()
  }

  return <VariantDetailView product={product} variant={variant} />
}
