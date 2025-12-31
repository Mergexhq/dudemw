import { NextRequest, NextResponse } from 'next/server'
import { BannerService } from '@/lib/services/banners'
import { BannerCreate, BannerFilters } from '@/lib/types/banners'
import { getCurrentAdmin } from '@/lib/admin-auth'
import { hasPermission } from '@/lib/services/permissions'

/**
 * GET /api/admin/banners
 * Get all banners with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin || !admin.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const canView = await hasPermission(admin.user.id, 'settings.view')
    if (!canView) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams

    const filters: BannerFilters = {
      search: searchParams.get('search') || undefined,
      placement: searchParams.get('placement') || undefined,
      status: searchParams.get('status') || undefined,
      category: searchParams.get('category') || undefined,
    }

    const result = await BannerService.getBanners(filters)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error in GET /api/admin/banners:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/banners
 * Create a new banner
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin || !admin.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const canEdit = await hasPermission(admin.user.id, 'settings.edit')
    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Validate required fields based on banner type
    if (!body.internal_title || !body.placement) {
      return NextResponse.json(
        { error: 'Missing required fields: internal_title and placement are required' },
        { status: 400 }
      )
    }

    // For marquee banners, marquee_data is required
    if (body.placement === 'top-marquee-banner') {
      if (!body.marquee_data) {
        return NextResponse.json(
          { error: 'Missing required fields: marquee_data is required for marquee banners' },
          { status: 400 }
        )
      }
    }
    // For carousel banners, carousel_data is required
    else if (body.placement === 'homepage-carousel' || body.placement === 'product-listing-carousel') {
      if (!body.carousel_data) {
        return NextResponse.json(
          { error: 'Missing required fields: carousel_data is required for carousel banners' },
          { status: 400 }
        )
      }
    }
    // For category banners, image_url and category are required
    else if (body.placement === 'category-banner') {
      if (!body.image_url || !body.category) {
        return NextResponse.json(
          { error: 'Missing required fields: image_url and category are required for category banners' },
          { status: 400 }
        )
      }
    }
    // For other banner types, image_url and action fields are required  
    else {
      if (!body.image_url || !body.action_type || !body.action_target) {
        return NextResponse.json(
          { error: 'Missing required fields: image_url, action_type, and action_target are required' },
          { status: 400 }
        )
      }
    }

    const bannerData: BannerCreate = {
      internal_title: body.internal_title,
      image_url: body.image_url,
      placement: body.placement,
      action_type: body.action_type,
      action_target: body.action_target,
      action_name: body.action_name || body.action_target,
      start_date: body.start_date,
      end_date: body.end_date,
      position: body.position,
      category: body.category,
      cta_text: body.cta_text,
      status: body.status,
      carousel_data: body.carousel_data,
      marquee_data: body.marquee_data,
    }

    const result = await BannerService.createBanner(bannerData)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json(result.data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/banners:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
