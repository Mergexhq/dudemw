import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const INSTAGRAM_BUSINESS_ACCOUNT_ID = process.env.NEXT_PUBLIC_INSTAGRAM_BUSINESS_ACCOUNT_ID
        const ACCESS_TOKEN = process.env.NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN

        if (!INSTAGRAM_BUSINESS_ACCOUNT_ID || !ACCESS_TOKEN) {
            return NextResponse.json(
                { error: 'Instagram credentials not configured' },
                { status: 500 }
            )
        }

        // Determine API endpoint based on token type
        // IGAA... tokens are for Instagram Basic Display API (use 'me' endpoint)
        // EAA... tokens are for Instagram Graph API (use Business Account ID)
        const isBasicDisplay = ACCESS_TOKEN.startsWith('IGAA')

        const baseUrl = isBasicDisplay
            ? 'https://graph.instagram.com/me/media'
            : `https://graph.instagram.com/${INSTAGRAM_BUSINESS_ACCOUNT_ID}/media`

        const fields = isBasicDisplay
            ? 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp'
            : 'id,media_type,media_url,permalink,thumbnail_url,caption'

        // Increase limit to support better looping
        const url = `${baseUrl}?fields=${fields}&limit=24&access_token=${ACCESS_TOKEN}`

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            next: { revalidate: 3600 } // Cache for 1 hour
        })

        if (!response.ok) {
            const errorText = await response.text()
            let errorData
            try {
                errorData = JSON.parse(errorText)
            } catch {
                errorData = { message: errorText }
            }

            console.error('Instagram API Error Details:', {
                status: response.status,
                statusText: response.statusText,
                error: errorData,
                url: url.replace(ACCESS_TOKEN, 'TOKEN_HIDDEN')
            })

            return NextResponse.json(
                {
                    error: 'Failed to fetch Instagram media',
                    details: errorData,
                    status: response.status,
                    message: errorData?.error?.message || errorData?.message || 'Unknown error'
                },
                { status: response.status }
            )
        }
        const data = await response.json()

        return NextResponse.json({
            success: true,
            data: data.data || [],
            paging: data.paging
        })

    } catch (error) {
        console.error('Instagram API Route Error:', error)
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
