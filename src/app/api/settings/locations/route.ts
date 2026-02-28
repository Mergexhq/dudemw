import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const data = await prisma.store_locations.findMany({
      orderBy: [{ is_primary: 'desc' }, { name: 'asc' }] as any,
    })
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Store locations GET error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = await prisma.store_locations.create({ data: body as any })
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Store locations POST error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ success: false, error: 'Location ID is required' }, { status: 400 })
    const data = await prisma.store_locations.update({
      where: { id } as any,
      data: { ...updates, updated_at: new Date() } as any,
    })
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Store locations PUT error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: 'Location ID is required' }, { status: 400 })
    await prisma.store_locations.delete({ where: { id } as any })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Store locations DELETE error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 })
  }
}
