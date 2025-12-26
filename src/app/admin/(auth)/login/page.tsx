'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, AlertCircle, Shield, ArrowLeft, Crown } from 'lucide-react'
import { adminLoginAction } from '@/lib/actions/admin-auth'

export default function AdminLoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await adminLoginAction(formData.email, formData.password)

      if (!result.success) {
        // Check if user is pending approval
        if (result.pending) {
          router.push('/admin/pending')
          return
        }

        setError(result.error || 'Invalid credentials')
        return
      }

      // Redirect to admin dashboard
      router.push('/admin')
      router.refresh()
    } catch (err: any) {
      setError('Unauthorized')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 flex items-center justify-between p-4 lg:p-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img
            src="/logo/typography-logo.png"
            alt="Dude Mens Wear"
            className="h-6 lg:h-8 w-auto"
          />
        </div>

        {/* Back to Store Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3 py-2 lg:px-4 lg:py-2 text-xs lg:text-sm font-medium text-gray-600 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-xl transition-all duration-200 border border-gray-200 hover:border-red-200"
        >
          <ArrowLeft className="w-3 h-3 lg:w-4 lg:h-4" />
          Back to Store
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-6">
        <div className="w-full max-w-sm">
          {/* Admin Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-xl shadow-lg">
              <Crown className="w-5 h-5" />
              <span className="font-heading font-bold text-sm tracking-wide">ADMIN PORTAL</span>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-6 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-50 to-transparent rounded-full -translate-y-10 translate-x-10"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-red-50 to-transparent rounded-full translate-y-8 -translate-x-8"></div>

            <div className="relative">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl mb-3">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
                <h1 className="font-heading text-2xl font-bold text-gray-900 mb-1 tracking-wide">
                  Welcome Back
                </h1>
                <p className="text-gray-600 text-sm">
                  Sign in to your admin dashboard
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 mb-4"
                  data-testid="admin-login-error"
                >
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-red-800">Authentication Failed</p>
                    <p className="text-xs text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-gray-900 mb-2"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter your admin email"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all duration-200 text-sm text-gray-900 placeholder-gray-500"
                      required
                      disabled={isLoading}
                      data-testid="admin-login-email"
                      autoComplete="username"
                      autoCapitalize="off"
                      autoCorrect="off"
                      spellCheck="false"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-gray-900 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all duration-200 text-sm text-gray-900 placeholder-gray-500"
                      required
                      disabled={isLoading}
                      data-testid="admin-login-password"
                      autoComplete="current-password"
                      autoCapitalize="off"
                      autoCorrect="off"
                      spellCheck="false"
                      data-1p-ignore
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      disabled={isLoading}
                      data-testid="admin-login-toggle-password"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-lg font-heading font-bold text-sm tracking-wide hover:from-red-700 hover:to-red-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  data-testid="admin-login-submit"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Signing In...
                    </span>
                  ) : (
                    'Sign In to Dashboard'
                  )}
                </button>
              </form>

              {/* Recovery Link */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <Link
                    href="/admin/recover"
                    className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
                    data-testid="admin-login-recovery-link"
                  >
                    <Shield className="w-3 h-3" />
                    Forgot password? Use recovery key
                  </Link>
                </div>
              </div>

              {/* Security Notice */}
              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-3 h-3 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-900">Secure Access</p>
                    <p className="text-xs text-gray-600">
                      All login attempts are monitored for security.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
