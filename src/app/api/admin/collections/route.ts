import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/supabase'

export interface CreateCollectionRequest {
  title: string
  description: string
  is_active: boolean
  selectedProducts: Array<{
    productId: string
    selectedVariantId: string
  }>
}

/**
 * POST /api/admin/collections
 * Create a new collection with products
 * Uses supabaseAdmin to bypass RLS policies
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateCollectionRequest
    const { title, description, is_active, selectedProducts } = body

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Collection title is required' },
        { status: 400 }
      )
    }

    if (!description?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Collection description is required' },
        { status: 400 }
      )
    }

    if (!selectedProducts || selectedProducts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one product is required' },
        { status: 400 }
      )
    }

    // Generate slug from title
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

    // Create collection using admin client (bypasses RLS)
    const { data: collection, error: collectionError } = await supabaseAdmin
      .from('collections')
      .insert({
        title: title.trim(),
        slug: slug,
        description: description.trim(),
        type: 'manual',
        is_active: is_active,
        rule_json: null
      })
      .select()
      .single()

    if (collectionError) {
      console.error('Collection creation error:', collectionError)
      return NextResponse.json(
        { 
          success: false, 
          error: collectionError.message || 'Failed to create collection',
          details: collectionError 
        },
        { status: 500 }
      )
    }

    // Add products to collection
    const collectionProducts = selectedProducts.map((item, index) => ({
      collection_id: collection.id,
      product_id: item.productId,
      sort_order: index + 1
    }))

    const { error: productsError } = await supabaseAdmin
      .from('collection_products')
      .insert(collectionProducts)

    if (productsError) {
      console.error('Error adding products to collection:', productsError)
      // Try to clean up the collection if product insertion fails
      await supabaseAdmin.from('collections').delete().eq('id', collection.id)
      
      return NextResponse.json(
        { 
          success: false, 
          error: productsError.message || 'Failed to add products to collection',
          details: productsError 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      collection: collection,
      productsAdded: collectionProducts.length
    }, { status: 201 })

  } catch (error) {
    console.error('Create collection API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create collection'
      },
      { status: 500 }
    )
  }
}
