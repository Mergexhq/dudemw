'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Key, AlertCircle, Shield, CheckCircle } from 'lucide-react'
import { adminRecoveryAction } from '@/lib/actions/admin-auth'

export default function AdminRecoverPage() {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [formData, setFormData] = useState({
    email: '',
    recoveryKey: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetLink, setResetLink] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await adminRecoveryAction(
        formData.email,
        formData.recoveryKey.replace(/-/g, '') // Remove dashes for validation
      )

      if (!result.success) {
        setError(result.error || 'Recovery failed')
        return
      }

      setResetLink(result.resetLink || '')
      setStep('success')
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoToReset = () => {
    if (resetLink) {
      window.location.href = resetLink
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header Badge */}
        <div className="flex justify-center mb-6">
          <div className="bg-red-600 text-white px-4 py-2 rounded-full flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <span className="font-semibold">Admin Account Recovery</span>
          </div>
        </div>

        {step === 'form' ? (
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Recover Admin Access
              </h1>
              <p className="text-gray-600">
                Use your recovery key to reset your super admin password
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Recovery Requirements:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    <li>Your super admin email address</li>
                    <li>The recovery key generated during initial setup</li>
                    <li>This feature is only available for super admin accounts</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 mb-6">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Recovery Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Super Admin Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="admin@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    required
                    disabled={isLoading}
                    data-testid="admin-recover-email"
                  />
                </div>
              </div>

              {/* Recovery Key */}
              <div>
                <label htmlFor="recoveryKey" className="block text-sm font-medium text-gray-700 mb-2">
                  Recovery Key
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="recoveryKey"
                    type="text"
                    value={formData.recoveryKey}
                    onChange={(e) => setFormData({ ...formData, recoveryKey: e.target.value })}
                    placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent font-mono"
                    required
                    disabled={isLoading}
                    data-testid="admin-recover-key"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter the 32-character recovery key from your initial setup
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                data-testid="admin-recover-submit"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
                    Verifying...
                  </span>
                ) : (
                  'Recover Account'
                )}
              </button>
            </form>

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
        ) : (
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
            {/* Success Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Recovery Successful
              </h1>
              <p className="text-gray-600">
                Your recovery key has been verified
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900">
                Click the button below to reset your password. You'll be redirected to a secure password reset page.
              </p>
            </div>

            {/* Reset Button */}
            <button
              onClick={handleGoToReset}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl mb-4"
              data-testid="go-to-reset-button"
            >
              Reset Password Now
            </button>

            {/* Alternative Link */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-2">Or copy this link:</p>
              <div className="bg-white border border-gray-300 rounded px-3 py-2">
                <code className="text-xs text-gray-800 break-all">{resetLink}</code>
              </div>
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