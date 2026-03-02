import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

/**
 * POST /api/admin/collections
 * Create a new collection with products
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { title, description, is_active, productIds, slug: rawSlug } = body

    if (!title?.trim()) return NextResponse.json({ error: 'Collection title is required' }, { status: 400 })
    if (!description?.trim()) return NextResponse.json({ error: 'Collection description is required' }, { status: 400 })
    if (!productIds || productIds.length === 0) return NextResponse.json({ error: 'At least one product is required' }, { status: 400 })

    const slug = rawSlug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

    const collection = await prisma.$transaction(async (tx) => {
      const col = await tx.collections.create({
        data: {
          title: title.trim(),
          slug,
          description: description.trim(),
          type: 'manual',
          is_active: is_active ?? true,
          rule_json: null as any,
        },
      })

      await tx.product_collections.createMany({
        data: (productIds as string[]).map((productId: string, index: number) => ({
          collection_id: col.id,
          product_id: productId,
          position: index + 1,
        })),
      })

      return col
    })

    return NextResponse.json({ success: true, collection, productsAdded: productIds.length }, { status: 201 })
  } catch (error) {
    console.error('Create collection API error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create collection' }, { status: 500 })
  }
}

