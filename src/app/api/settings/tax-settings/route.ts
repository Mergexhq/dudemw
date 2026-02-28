import { NextRequest, NextResponse } from 'next/server'
import { SettingsService } from '@/lib/services/settings'

export async function GET() {
  const result = await SettingsService.getTaxSettings()
  if (!result.success) return NextResponse.json(result, { status: 500 })
  return NextResponse.json(result)
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    console.log('🔧 [API] Received tax settings update:', { id, updates })
    if (!id) return NextResponse.json({ success: false, error: 'Settings ID is required' }, { status: 400 })
    const result = await SettingsService.updateTaxSettings(id, updates)
    if (!result.success) return NextResponse.json(result, { status: 500 })
    console.log('✅ [API] Tax settings updated successfully')
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('❌ [API] Tax settings PUT error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 })
  }
}
