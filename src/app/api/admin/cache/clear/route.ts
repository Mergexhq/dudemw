import { NextResponse } from 'next/server'
import { CacheService } from '@/lib/services/redis'

export async function POST() {
    try {
        await CacheService.clearAllCache()
        return NextResponse.json({ success: true, message: 'All caches cleared' })
    } catch (error) {
        console.error('Cache clear error:', error)
        return NextResponse.json({ success: false, error: 'Failed to clear cache' }, { status: 500 })
    }
}

export async function GET() {
    try {
        await CacheService.clearAllCache()
        return NextResponse.json({ success: true, message: 'All caches cleared' })
    } catch (error) {
        console.error('Cache clear error:', error)
        return NextResponse.json({ success: false, error: 'Failed to clear cache' }, { status: 500 })
    }
}
