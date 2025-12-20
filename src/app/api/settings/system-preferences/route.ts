import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/supabase'

// GET system preferences
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('system_preferences')
      .select('*')
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching system preferences:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch system preferences' },
        { status: 500 }
      )
    }

    // If no preferences exist, create default
    if (!data) {
      const defaultPreferences = {
        auto_cancel_enabled: true,
        auto_cancel_minutes: 30,
        guest_checkout_enabled: true,
        low_stock_threshold: 10,
        allow_backorders: false,
        order_placed_email: true,
        order_shipped_email: true,
        low_stock_alert: true,
        free_shipping_enabled: false,
        free_shipping_threshold: null,
      }

      const { data: newData, error: insertError } = await supabaseAdmin
        .from('system_preferences')
        .insert(defaultPreferences)
        .select()
        .single()

      if (insertError) {
        console.error('Error creating default system preferences:', insertError)
        return NextResponse.json(
          { success: false, error: 'Failed to create default preferences' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data: newData })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('System preferences GET error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT update system preferences
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Preferences ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('system_preferences')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating system preferences:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update system preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('System preferences PUT error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
