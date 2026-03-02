import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/categories/[id]
 * Get a single category by ID or slug (use ?slug=true to look up by slug)
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const isSlug = _request.nextUrl.searchParams.get('slug') === 'true'

        const category = isSlug
            ? await prisma.categories.findFirst({ where: { slug: id } as any })
            : await prisma.categories.findUnique({ where: { id } })

        if (!category) {
            return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true, category })
    } catch (error) {
        console.error('GET /api/categories/[id] error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch category' }, { status: 500 })
    }
}

/**
 * PATCH /api/categories/[id]
 * Update a category
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const category = await prisma.categories.update({ where: { id }, data: body as any })
        return NextResponse.json({ success: true, category })
    } catch (error) {
        console.error('PATCH /api/categories/[id] error:', error)
        return NextResponse.json({ success: false, error: 'Failed to update category' }, { status: 500 })
    }
}

/**
 * DELETE /api/categories/[id]
 * Delete a category
 */
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await prisma.categories.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('DELETE /api/categories/[id] error:', error)
        return NextResponse.json({ success: false, error: 'Failed to delete category' }, { status: 500 })
    }
}
