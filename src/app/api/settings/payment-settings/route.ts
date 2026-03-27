import { NextRequest, NextResponse } from 'next/server'
import { SettingsService } from '@/lib/services/settings'

export async function GET() {
  const result = await SettingsService.getPaymentSettings()
  if (!result.success) return NextResponse.json(result, { status: 500 })
  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    },
  })
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ success: false, error: 'Settings ID is required' }, { status: 400 })
    const result = await SettingsService.updatePaymentSettings(id, updates)
    if (!result.success) return NextResponse.json(result, { status: 500 })
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 })
  }
}
