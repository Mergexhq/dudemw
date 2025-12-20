import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/supabase'

// GET all shipping rules
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('shipping_rules')
      .select('*')
      .order('zone', { ascending: true })
      .order('min_quantity', { ascending: true })

    if (error) {
      console.error('Error fetching shipping rules:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch shipping rules' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Shipping rules GET error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create shipping rule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { data, error } = await supabaseAdmin
      .from('shipping_rules')
      .insert(body)
      .select()
      .single()

    if (error) {
      console.error('Error creating shipping rule:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create shipping rule' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Shipping rules POST error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT update shipping rule
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Shipping rule ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('shipping_rules')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating shipping rule:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update shipping rule' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Shipping rules PUT error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE shipping rule
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Shipping rule ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('shipping_rules')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting shipping rule:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete shipping rule' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Shipping rules DELETE error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
