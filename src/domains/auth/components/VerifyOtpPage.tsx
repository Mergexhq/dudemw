'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mail, ArrowRight, AlertCircle } from 'lucide-react'
import AuthLayout from '../components/AuthLayout'

export default function VerifyOtpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const email = searchParams.get('email') || 'your@email.com'
  
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [timer, setTimer] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(interval)
    } else {
      setCanResend(true)
    }
  }, [timer])

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    const newOtp = pastedData.split('')
    setOtp([...newOtp, ...Array(6 - newOtp.length).fill('')])
    
    // Focus last filled input
    const lastIndex = Math.min(pastedData.length, 5)
    inputRefs.current[lastIndex]?.focus()
  }

  const handleResend = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })
      
      if (error) {
        setError(error.message)
        return
      }
      
      setTimer(60)
      setCanResend(false)
      setOtp(['', '', '', '', '', ''])
      setError('')
      inputRefs.current[0]?.focus()
    } catch (err: any) {
      setError('Failed to resend code')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const otpValue = otp.join('')
    
    if (otpValue.length !== 6) {
      setError('Please enter complete OTP')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: otpValue,
        type: 'signup',
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data.user) {
        router.push('/profile')
      }
    } catch (err: any) {
      setError('Invalid verification code')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Verify Your Email"
      subtitle={`We've sent a 6-digit code to ${email}`}
    >
      {/* Error Message */}
      {error && (
        <div 
          className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 mb-6"
          data-testid="verify-otp-error"
        >
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Display */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <Mail className="w-4 h-4" />
          <span>{email}</span>
        </div>

        {/* OTP Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
            Enter OTP Code
          </label>
          <div className="flex gap-2 justify-center">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors"
                required
              />
            ))}
          </div>
        </div>

        {/* Timer & Resend */}
        <div className="text-center">
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Resend OTP
            </button>
          ) : (
            <p className="text-sm text-gray-600">
              Resend OTP in{' '}
              <span className="font-semibold text-red-600">{timer}s</span>
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-red-600 text-white py-3 rounded-lg font-heading font-semibold tracking-wide hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="verify-otp-submit"
        >
          {isLoading ? 'Verifying...' : 'Verify & Continue'}
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> Check your spam folder if you don't see the email. The code expires in 10 minutes.
        </p>
      </div>

      {/* Change Email */}
      <p className="text-center text-sm text-gray-600 mt-4">
        Wrong email?{' '}
        <button
          onClick={() => router.back()}
          className="text-red-600 font-semibold hover:underline"
        >
          Go Back
        </button>
      </p>
    </AuthLayout>
  )
}
