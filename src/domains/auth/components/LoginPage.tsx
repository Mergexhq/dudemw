'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSignIn } from '@clerk/nextjs'
import { Mail, Lock, Eye, EyeOff, AlertCircle, Shield } from 'lucide-react'
import AuthLayout from './AuthLayout'
import SocialLogin from './SocialLogin'
import Divider from './Divider'

export default function LoginPage() {
  const router = useRouter()
  const { isLoaded, signIn, setActive } = useSignIn()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [rememberMe, setRememberMe] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // OTP verification state (for Client Trust / new device login)
  const [needsOtp, setNeedsOtp] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return

    setIsLoading(true)
    setError('')

    try {
      const result = await signIn.create({
        identifier: formData.email,
        password: formData.password,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.push('/')
      } else if (result.status === 'needs_first_factor' || result.status === 'needs_second_factor') {
        // Client Trust or 2FA — need OTP verification
        // Prepare email code verification
        const emailFactor = result.supportedFirstFactors?.find(
          (f: any) => f.strategy === 'email_code'
        )
        if (emailFactor && 'emailAddressId' in emailFactor) {
          await signIn.prepareFirstFactor({
            strategy: 'email_code',
            emailAddressId: emailFactor.emailAddressId,
          })
        }
        setNeedsOtp(true)
      } else {
        setError('Additional steps required. Please try again.')
      }
    } catch (err: any) {
      if (err.errors && err.errors.length > 0) {
        setError(err.errors[0].longMessage || 'Invalid credentials')
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    const newOtp = pastedData.split('')
    setOtp([...newOtp, ...Array(6 - newOtp.length).fill('')])
    const lastIndex = Math.min(pastedData.length, 5)
    inputRefs.current[lastIndex]?.focus()
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !signIn) return

    const otpValue = otp.join('')
    if (otpValue.length !== 6) {
      setError('Please enter the complete 6-digit code')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code: otpValue,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.push('/')
      } else {
        setError('Verification failed. Please try again.')
      }
    } catch (err: any) {
      if (err.errors && err.errors.length > 0) {
        setError(err.errors[0].longMessage || 'Invalid verification code')
      } else {
        setError('Invalid verification code')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // OTP Verification screen
  if (needsOtp) {
    return (
      <AuthLayout
        title="Verify Your Identity"
        subtitle={`We've sent a verification code to ${formData.email}`}
      >
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg mb-2">
          <Shield className="w-4 h-4 text-blue-600" />
          <span>New device detected. Please verify your identity.</span>
        </div>

        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Enter Verification Code
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
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={handleOtpPaste}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors"
                  required
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-heading font-semibold tracking-wide hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verifying...' : 'Verify & Sign In'}
          </button>
        </form>

        <button
          onClick={() => { setNeedsOtp(false); setOtp(['', '', '', '', '', '']); setError('') }}
          className="w-full text-sm text-gray-500 hover:text-gray-700 underline mt-4 text-center"
        >
          ← Back to Login
        </button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Welcome back! Please enter your details."
    >
      {/* Social Login */}
      <SocialLogin />

      <Divider />

      {/* Error Message */}
      {error && (
        <div
          className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2"
          data-testid="store-login-error"
        >
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter your email"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors"
              required
              data-testid="store-login-email"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors"
              required
              data-testid="store-login-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              data-testid="store-login-toggle-password"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 border-gray-300 rounded text-black focus:ring-black"
            />
            <span className="text-sm text-gray-700">Remember me</span>
          </label>
          <Link
            href="/auth/forgot-password"
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-red-600 text-white py-3 rounded-lg font-heading font-semibold tracking-wide hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="store-login-submit"
        >
          {isLoading ? 'Logging in...' : 'Sign in'}
        </button>

        {/* Clerk CAPTCHA widget */}
        <div id="clerk-captcha" />
      </form>

      {/* Sign Up Link */}
      <p className="text-center text-sm text-gray-600 mt-6">
        Don't have an account?{' '}
        <Link href="/auth/signup" className="text-red-600 font-semibold hover:underline">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  )
}
