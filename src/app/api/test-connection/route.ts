import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    // Check if environment variables are present
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        success: false,
        error: 'Environment variables missing',
        details: {
          hasSupabaseUrl: !!supabaseUrl,
          hasSupabaseKey: !!supabaseKey,
          nodeEnv: process.env.NODE_ENV
        }
      }, { status: 500 })
    }
    
    // Try to create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test database connection with a simple query
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .limit(1)
    
    if (error) {
      return NextResponse.json({ 
        success: false,
        error: 'Database query failed',
        details: {
          message: error.message,
          code: error.code,
          hint: error.hint
        }
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Connection successful',
      details: {
        hasData: !!data && data.length > 0,
        envVarsPresent: true,
        nodeEnv: process.env.NODE_ENV
      }
    })
  } catch (err: any) {
    return NextResponse.json({ 
      success: false,
      error: 'Exception occurred',
      details: {
        message: err.message,
        stack: err.stack
      }
    }, { status: 500 })
  }
}
