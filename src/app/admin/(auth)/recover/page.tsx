'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, AlertCircle, Shield, CheckCircle, Key } from 'lucide-react'
import { useSignIn } from '@clerk/nextjs'

export default function AdminRecoverPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLoaded, signIn, setActive } = useSignIn()
  const [step, setStep] = useState<'email' | 'code' | 'newPassword' | 'success'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // If redirected from login page with email param, auto-fill and go to code step
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
      setStep('code')
    }
  }, [searchParams])

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !signIn) return

    setIsLoading(true)
    setError('')

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      })
      setStep('code')
    } catch (err: any) {
      if (err.errors && err.errors.length > 0) {
        setError(err.errors[0].longMessage || err.errors[0].message || 'Failed to send reset code.')
      } else {
        setError('Failed to send reset code. Please check your email address.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !signIn) return

    setIsLoading(true)
    setError('')

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
      })

      if (result.status === 'needs_new_password') {
        setStep('newPassword')
      } else if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        setStep('success')
      } else {
        setError(`Unexpected status: ${result.status}`)
      }
    } catch (err: any) {
      if (err.errors && err.errors.length > 0) {
        setError(err.errors[0].longMessage || 'Invalid code. Please try again.')
      } else {
        setError('Failed to verify code.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !signIn) return

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const result = await signIn.resetPassword({
        password: newPassword,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        setStep('success')
      } else {
        setError(`Unexpected status: ${result.status}`)
      }
    } catch (err: any) {
      if (err.errors && err.errors.length > 0) {
        setError(err.errors[0].longMessage || 'Failed to reset password.')
      } else {
        setError('Failed to reset password.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header Badge */}
        <div className="flex justify-center mb-6">
          <div className="bg-red-600 text-white px-4 py-2 rounded-full flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <span className="font-semibold">Admin Password Reset</span>
          </div>
        </div>

        {step === 'success' ? (
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Password Reset!
              </h1>
              <p className="text-gray-600">
                Your password has been changed and you're now signed in.
              </p>
            </div>
            <button
              onClick={() => { router.push('/admin'); router.refresh() }}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Go to Admin Dashboard
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {step === 'email' ? 'Reset Password' : step === 'code' ? 'Enter Reset Code' : 'Set New Password'}
              </h1>
              <p className="text-gray-600">
                {step === 'email'
                  ? 'Enter your admin email to receive a reset code'
                  : step === 'code'
                    ? `A code was sent to ${email}`
                    : 'Choose a new password for your account'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 mb-6">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Step 1: Email input */}
            {step === 'email' && (
              <form onSubmit={handleSendCode} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@example.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !isLoaded}
                  className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Sending Code...' : 'Send Reset Code'}
                </button>
              </form>
            )}

            {/* Step 2: OTP code input */}
            {step === 'code' && (
              <form onSubmit={handleVerifyCode} className="space-y-5">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    id="code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent text-center tracking-widest font-mono"
                    required
                    disabled={isLoading}
                    maxLength={6}
                    autoComplete="one-time-code"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-2">Check your email for the code</p>
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !isLoaded}
                  className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Verifying...' : 'Verify Code'}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('email'); setCode(''); setError('') }}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  ← Use a different email
                </button>
              </form>
            )}

            {/* Step 3: New password */}
            {step === 'newPassword' && (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                      required
                      disabled={isLoading}
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                      required
                      disabled={isLoading}
                      minLength={8}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !isLoaded}
                  className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            )}

            {/* Back to Login */}
            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <Link
                href="/admin/login"
                className="text-sm text-red-600 hover:text-red-700 font-medium hover:underline"
              >
                ← Back to Login
              </Link>
            </div>
          </div>
        )}

        {/* Back to Store */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-red-600 transition-colors"
          >
            ← Back to Store
          </Link>
        </div>
      </div>
    </div>
  )
}