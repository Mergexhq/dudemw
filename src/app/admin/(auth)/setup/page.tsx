'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, AlertCircle, Shield, Key, CheckCircle, User } from 'lucide-react'
import { adminSetupAction, checkSetupStatusAction } from '@/lib/actions/admin-auth'
import { validateInviteAndCreateAdminAction } from '@/lib/actions/admin-invite'

export default function AdminSetupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const invitedEmail = searchParams.get('email') || ''

  const [step, setStep] = useState<'loading' | 'form' | 'success'>('loading')
  const [mode, setMode] = useState<'superadmin' | 'invited'>('superadmin')
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: invitedEmail,
    password: '',
    confirmPassword: '',
    setupKey: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    // Determine mode: if email param exists, this is an invited admin
    if (invitedEmail) {
      setMode('invited')
      setFormData((prev) => ({ ...prev, email: invitedEmail }))
      setStep('form')
      return
    }

    // Otherwise, check if setup is completed (first-time super admin)
    checkSetupStatusAction().then((result) => {
      if (result.setupCompleted) {
        // Setup already done — redirect to login
        router.push('/admin/login')
      } else {
        setMode('superadmin')
        setStep('form')
      }
    })
  }, [invitedEmail, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      setIsLoading(false)
      return
    }

    if (!formData.setupKey.trim()) {
      setError('Setup key is required')
      setIsLoading(false)
      return
    }

    try {
      if (mode === 'invited') {
        // Invited admin: validate invite key + create Clerk user + admin profile
        const result = await validateInviteAndCreateAdminAction(
          formData.email,
          formData.setupKey.trim(),
          formData.password,
          formData.fullName
        )

        if (!result.success) {
          setError(result.error || 'Failed to create account')
          setIsLoading(false)
          return
        }

        setSuccessMessage(result.message || 'Account created successfully!')
        setStep('success')
      } else {
        // First-time super admin setup
        const result = await adminSetupAction(
          formData.email,
          formData.password,
          formData.setupKey.trim()
        )

        if (!result.success) {
          setError(result.error || 'Setup failed')
          setIsLoading(false)
          return
        }

        setSuccessMessage('Super admin account created! Please log in to continue.')
        setStep('success')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-100 border-t-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Checking setup status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header Badge */}
        <div className="flex justify-center mb-6">
          <div className="bg-red-600 text-white px-4 py-2 rounded-full flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <span className="font-semibold">
              {mode === 'superadmin' ? 'Super Admin Setup' : 'Admin Account Setup'}
            </span>
          </div>
        </div>

        {step === 'success' ? (
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Created!</h1>
              <p className="text-gray-600">{successMessage}</p>
            </div>
            <button
              onClick={() => router.push('/admin/login')}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Go to Login
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {mode === 'superadmin' ? 'Create Super Admin' : 'Set Up Your Admin Account'}
              </h1>
              <p className="text-gray-600">
                {mode === 'superadmin'
                  ? 'Set up the first admin account for your store'
                  : `You've been invited as an admin. Complete your setup below.`}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 mb-6">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="admin@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    required
                    disabled={isLoading || mode === 'invited'}
                    readOnly={mode === 'invited'}
                  />
                </div>
                {mode === 'invited' && (
                  <p className="text-xs text-gray-500 mt-1">This email was set by the invite and cannot be changed.</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Create a strong password"
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

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Re-enter your password"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    required
                    disabled={isLoading}
                    minLength={8}
                  />
                </div>
              </div>

              {/* Setup Key */}
              <div>
                <label htmlFor="setupKey" className="block text-sm font-medium text-gray-700 mb-2">
                  Setup Key
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="setupKey"
                    type="text"
                    value={formData.setupKey}
                    onChange={(e) => setFormData({ ...formData, setupKey: e.target.value })}
                    placeholder={mode === 'invited' ? 'Enter setup key from invite email' : 'Enter the environment setup key'}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent font-mono tracking-wider"
                    required
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {mode === 'invited'
                    ? 'Check your invite email for the setup key (e.g., SK-XXXX-XXXX)'
                    : 'This is the ADMIN_SETUP_KEY from your environment configuration'}
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 shadow-lg hover:shadow-xl"
              >
                {isLoading ? 'Creating Account...' : 'Create Admin Account'}
              </button>
            </form>

            {/* Back to Login */}
            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <button
                onClick={() => router.push('/admin/login')}
                className="text-sm text-red-600 hover:text-red-700 font-medium hover:underline"
              >
                ← Already have an account? Login
              </button>
            </div>
          </div>
        )}

        {/* Back to Store */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-600 hover:text-red-600 transition-colors"
          >
            ← Back to Store
          </button>
        </div>
      </div>
    </div>
  )
}