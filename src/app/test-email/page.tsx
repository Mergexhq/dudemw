'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, Send, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function TestEmailPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: any
  } | null>(null)

  const supabase = createClient()

  const testOTP = async () => {
    if (!email) {
      setResult({
        success: false,
        message: 'Please enter an email address'
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: false, // Don't create user, just test email
        }
      })

      if (error) {
        setResult({
          success: false,
          message: error.message,
          details: error
        })
      } else {
        setResult({
          success: true,
          message: 'OTP email sent successfully! Check your inbox.',
          details: data
        })
      }
    } catch (err: any) {
      setResult({
        success: false,
        message: 'Failed to send email: ' + err.message,
        details: err
      })
    } finally {
      setLoading(false)
    }
  }

  const testSignup = async () => {
    if (!email) {
      setResult({
        success: false,
        message: 'Please enter an email address'
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: 'TestPassword123!', // Temporary test password
        options: {
          data: {
            full_name: 'Test User'
          }
        }
      })

      if (error) {
        setResult({
          success: false,
          message: error.message,
          details: error
        })
      } else {
        setResult({
          success: true,
          message: 'Signup successful! Check email for verification.',
          details: data
        })
      }
    } catch (err: any) {
      setResult({
        success: false,
        message: 'Signup failed: ' + err.message,
        details: err
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="w-8 h-8 text-red-600" />
            <h1 className="text-2xl font-bold">Email Testing Tool</h1>
          </div>
          <p className="text-gray-600">
            Test your Supabase + Resend email configuration
          </p>
        </div>

        {/* Configuration Status */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Current Configuration:</h3>
          <div className="space-y-1 text-sm text-blue-800">
            <div>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30)}...</div>
            <div>Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 30)}...</div>
          </div>
        </div>

        {/* Test Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Email Sending</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your-email@gmail.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter an email you have access to
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Test OTP Button */}
            <button
              onClick={testOTP}
              disabled={loading || !email}
              className="flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Test OTP Email
                </>
              )}
            </button>

            {/* Test Signup Button */}
            <button
              onClick={testSignup}
              disabled={loading || !email}
              className="flex items-center justify-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Test Signup Email
                </>
              )}
            </button>
          </div>
        </div>

        {/* Result Display */}
        {result && (
          <div
            className={`rounded-lg p-6 ${
              result.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h3
                  className={`font-semibold mb-2 ${
                    result.success ? 'text-green-900' : 'text-red-900'
                  }`}
                >
                  {result.success ? 'Success!' : 'Error'}
                </h3>
                <p
                  className={`text-sm ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {result.message}
                </p>
                {result.details && (
                  <details className="mt-3">
                    <summary className="text-xs cursor-pointer hover:underline">
                      Show technical details
                    </summary>
                    <pre className="mt-2 p-3 bg-black/5 rounded text-xs overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-100 rounded-lg p-6 mt-6">
          <h3 className="font-semibold mb-3">Testing Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>Enter your email address above</li>
            <li>Click "Test OTP Email" to test magic link/OTP flow</li>
            <li>Check your email inbox (and spam folder)</li>
            <li>Verify you received the email with OTP code</li>
            <li>If successful, your configuration is working!</li>
          </ol>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> If you're using Resend's test domain (onboarding@resend.dev),
              make sure the test email is verified in your Resend dashboard first.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
