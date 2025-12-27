import { NextResponse } from 'next/server';
import { isRazorpayConfigured, getRazorpayKeyId, getRazorpayKeySecret } from '@/lib/services/razorpay';

/**
 * GET /api/health
 * Health check endpoint to verify service configuration
 * Useful for debugging deployment issues on Hostinger
 */
export async function GET() {
  // Log for debugging (using warn to show in production)
  console.warn('[Health] Health check requested');
  console.warn('[Health] RAZORPAY_KEY_SECRET from process.env:', !!process.env.RAZORPAY_KEY_SECRET);
  console.warn('[Health] NEXT_PUBLIC_RAZORPAY_KEY_ID from process.env:', !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
  
  const razorpayConfig = isRazorpayConfigured();
  
  // Check Supabase configuration
  const supabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseService = !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY);
  
  // Check Razorpay configuration (without exposing actual keys)
  const razorpayKeyId = getRazorpayKeyId();
  const razorpaySecret = getRazorpayKeySecret();
  
  // Check App URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    nodeVersion: process.version,
    configuration: {
      supabase: {
        url: supabaseUrl,
        anonKey: supabaseAnon,
        serviceKey: supabaseService,
        status: supabaseUrl && supabaseAnon ? '✅ Configured' : '❌ Missing'
      },
      razorpay: {
        keyIdPresent: !!razorpayKeyId,
        secretPresent: !!razorpaySecret,
        configured: razorpayConfig.configured,
        status: razorpayConfig.configured ? '✅ Configured' : '❌ ' + razorpayConfig.error,
        // Show first 12 chars of key ID if present (safe to show partial public key)
        keyIdPreview: razorpayKeyId ? razorpayKeyId.substring(0, 12) + '...' : null,
        secretLength: razorpaySecret ? razorpaySecret.length : 0,
        // Diagnostic info
        envKeyIdSource: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? 'NEXT_PUBLIC_RAZORPAY_KEY_ID' : 
                        (process.env.RAZORPAY_KEY_ID ? 'RAZORPAY_KEY_ID' : 'not found'),
        envSecretSource: process.env.RAZORPAY_KEY_SECRET ? 'RAZORPAY_KEY_SECRET' : 'not found'
      },
      appUrl: {
        value: appUrl || 'Not set',
        status: appUrl ? '✅ Set' : '⚠️ Not set'
      }
    },
    checks: {
      paymentGateway: razorpayConfig.configured ? 'ready' : 'not_configured',
      database: supabaseUrl && supabaseAnon ? 'ready' : 'not_configured'
    },
    troubleshooting: !razorpayConfig.configured ? {
      message: 'Razorpay is not properly configured. Please verify:',
      steps: [
        '1. NEXT_PUBLIC_RAZORPAY_KEY_ID is set in environment variables',
        '2. RAZORPAY_KEY_SECRET is set in environment variables',
        '3. No extra spaces or quotes around the values',
        '4. The keys match your Razorpay dashboard (test vs live)',
        '5. After updating env vars, rebuild and redeploy the app'
      ]
    } : null
  };
  
  // Set status based on critical services
  if (!razorpayConfig.configured || !supabaseUrl || !supabaseAnon) {
    health.status = 'degraded';
  }
  
  return NextResponse.json(health);
}
