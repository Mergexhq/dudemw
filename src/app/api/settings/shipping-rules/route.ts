import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET all shipping rules
export async function GET() {
  try {
    const data = await prisma.shipping_rules.findMany({
      orderBy: [{ zone: 'asc' }, { min_quantity: 'asc' }]
    })
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
    const data = await prisma.shipping_rules.create({ data: body })
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

    const data = await prisma.shipping_rules.update({
      where: { id },
      data: { ...updates, updated_at: new Date() }
    })

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

    await prisma.shipping_rules.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Shipping rules DELETE error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
