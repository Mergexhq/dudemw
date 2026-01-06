import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/supabase'

// GET tax settings
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('tax_settings')
      .select('*')
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching tax settings:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch tax settings' },
        { status: 500 }
      )
    }

    // If no settings exist, create default
    if (!data) {
      const defaultSettings = {
        tax_enabled: true,
        default_gst_rate: 18,
        price_includes_tax: true,
        store_state: 'Tamil Nadu',
        gstin: null,
      }

      const { data: newData, error: insertError } = await supabaseAdmin
        .from('tax_settings')
        .insert(defaultSettings as any)
        .select()
        .single()

      if (insertError) {
        console.error('Error creating default tax settings:', insertError)
        return NextResponse.json(
          { success: false, error: 'Failed to create default settings' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data: newData })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Tax settings GET error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT update tax settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    console.log('🔧 [API] Received tax settings update:', { id, updates })

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Settings ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('tax_settings')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ [API] Error updating tax settings:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update tax settings' },
        { status: 500 }
      )
    }

    console.log('✅ [API] Tax settings updated successfully:', data)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('❌ [API] Tax settings PUT error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
