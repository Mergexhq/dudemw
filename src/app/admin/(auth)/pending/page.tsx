'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Clock, AlertCircle, LogOut } from 'lucide-react'
import { useState } from 'react'

export default function AdminPendingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await supabase.auth.signOut()
      router.push('/admin/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoggingOut(false)
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
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-6">
        <div className="w-full max-w-sm">
          {/* Header Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white px-4 py-2 rounded-xl shadow-lg">
              <Clock className="w-5 h-5" />
              <span className="font-heading font-bold text-sm tracking-wide">PENDING APPROVAL</span>
            </div>
          </div>

          {/* Pending Card */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-6 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-50 to-transparent rounded-full -translate-y-10 translate-x-10"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-yellow-50 to-transparent rounded-full translate-y-8 -translate-x-8"></div>

            <div className="relative">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-xl mb-3">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>

              {/* Header */}
              <div className="text-center mb-6">
                <h1 className="font-heading text-2xl font-bold text-gray-900 mb-1 tracking-wide">
                  Access Pending
                </h1>
                <p className="text-gray-600 text-sm">
                  Your admin account is awaiting approval
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="flex gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-yellow-900">
                    <p className="font-medium mb-1">What happens next?</p>
                    <ul className="list-disc list-inside space-y-0.5 text-yellow-800">
                      <li>A super admin will review your account</li>
                      <li>You'll receive an email when approved</li>
                      <li>You can then login to access the admin panel</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Status Message */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-700 text-center">
                  Please contact your super admin if you need immediate access or have questions about your account status.
                </p>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-lg font-heading font-bold text-sm tracking-wide hover:from-red-700 hover:to-red-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                data-testid="logout-button"
              >
                <LogOut className="w-4 h-4" />
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
