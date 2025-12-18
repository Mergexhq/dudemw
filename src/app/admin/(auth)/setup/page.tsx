'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, AlertCircle, Shield, Key, CheckCircle, Copy, Download } from 'lucide-react'
import { adminSetupAction, checkSetupStatusAction } from '@/lib/actions/admin-auth'

export default function AdminSetupPage() {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    setupKey: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [recoveryKey, setRecoveryKey] = useState('')
  const [keyCopied, setKeyCopied] = useState(false)
  const [checkingSetup, setCheckingSetup] = useState(true)

  useEffect(() => {
    // Check if setup is already completed
    checkSetupStatusAction().then(result => {
      if (result.setupCompleted) {
        router.push('/admin/login')
      }
      setCheckingSetup(false)
    })
  }, [router])

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

    // Validate password strength
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      setIsLoading(false)
      return
    }

    try {
      const result = await adminSetupAction(
        formData.email,
        formData.password,
        formData.setupKey
      )

      if (!result.success) {
        setError(result.error || 'Setup failed')
        return
      }

      // Show recovery key
      setRecoveryKey(result.recoveryKey || '')
      setStep('success')
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyKey = () => {
    navigator.clipboard.writeText(recoveryKey)
    setKeyCopied(true)
    setTimeout(() => setKeyCopied(false), 2000)
  }

  const handleDownloadKey = () => {
    const blob = new Blob(
      [`Dude Men's Wears - Admin Recovery Key\n\n${recoveryKey}\n\nStore this key securely. You will need it to recover super admin access.\nThis key will never be shown again.`],
      { type: 'text/plain' }
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'admin-recovery-key.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleContinue = () => {
    router.push('/admin/login')
  }

  if (checkingSetup) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-900 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p>Checking setup status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header Badge */}
        <div className="flex justify-center mb-6">
          <div className="bg-red-600 text-white px-4 py-2 rounded-full flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <span className="font-semibold">First-Time Admin Setup</span>
          </div>
        </div>

        {step === 'form' ? (
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Create Super Admin
              </h1>
              <p className="text-gray-600">
                Set up the first super admin account for your store
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Important:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    <li>You'll need the setup key from your environment configuration</li>
                    <li>A recovery key will be generated for account recovery</li>
                    <li>Store the recovery key securely - it's shown only once</li>
                    <li>This setup can only be performed once</li>
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

            {/* Setup Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Setup Key */}
              <div>
                <label htmlFor="setupKey" className="block text-sm font-medium text-gray-700 mb-2">
                  Setup Key <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="setupKey"
                    type="password"
                    value={formData.setupKey}
                    onChange={(e) => setFormData({ ...formData, setupKey: e.target.value })}
                    placeholder="Enter setup key from .env"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    required
                    disabled={isLoading}
                    data-testid="admin-setup-key"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Find this in your ADMIN_SETUP_KEY environment variable
                </p>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Super Admin Email <span className="text-red-600">*</span>
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
                    data-testid="admin-setup-email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-600">*</span>
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
                    data-testid="admin-setup-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 8 characters
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Re-enter password"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    required
                    disabled={isLoading}
                    data-testid="admin-setup-confirm-password"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                data-testid="admin-setup-submit"
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
                    Creating Admin Account...
                  </span>
                ) : (
                  'Complete Setup'
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
            {/* Success Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Setup Complete!
              </h1>
              <p className="text-gray-600">
                Your super admin account has been created successfully
              </p>
            </div>

            {/* Recovery Key Section */}
            <div className="bg-red-50 border-2 border-red-600 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-red-900 text-lg mb-1">
                    Save Your Recovery Key
                  </h3>
                  <p className="text-sm text-red-800">
                    This key is required to recover your super admin account if you forget your password.{' '}
                    <strong>It will never be shown again.</strong>
                  </p>
                </div>
              </div>

              <div className="bg-white border border-red-300 rounded-lg p-4 mb-4">
                <div
                  className="font-mono text-lg text-center text-gray-900 break-all select-all"
                  data-testid="recovery-key-display"
                >
                  {recoveryKey}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCopyKey}
                  className="flex-1 bg-white border-2 border-red-600 text-red-600 py-3 rounded-lg font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                  data-testid="copy-recovery-key"
                >
                  {keyCopied ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      Copy Key
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownloadKey}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  data-testid="download-recovery-key"
                >
                  <Download className="w-5 h-5" />
                  Download Key
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-900 mb-2">What to do next:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>Save the recovery key in a secure location (password manager recommended)</li>
                <li>Do not share this key with anyone</li>
                <li>Click "Continue to Login" below to access the admin panel</li>
                <li>You can now create additional admin users from the admin dashboard</li>
              </ol>
            </div>

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              data-testid="continue-to-login"
            >
              Continue to Login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}