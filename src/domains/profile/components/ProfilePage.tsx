'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/domains/auth/context'
import { createClient } from '@/lib/supabase/client'
import { User, Edit, Package, MapPin, Settings, LogOut, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ProfileEditDialog from './ProfileEditDialog'
import AddressesSection from '../sections/AddressesSection'
import TrackOrderSection from '../sections/TrackOrderSection'
import GuestWelcome from './GuestWelcome'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  })

  const handleChangePassword = async () => {
    if (!passwordData.new || !passwordData.confirm) {
      toast.error('Please fill in all password fields')
      return
    }

    if (passwordData.new !== passwordData.confirm) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.new.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    try {
      const supabase = createClient()

      // Update password in Supabase
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new
      })

      if (error) throw error

      toast.success('Password changed successfully')
      setShowChangePassword(false)
      setPasswordData({ current: '', new: '', confirm: '' })
    } catch (error: any) {
      console.error('Error changing password:', error)
      toast.error(error.message || 'Failed to change password')
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      'Are you sure you want to delete your account? This action cannot be undone. All your data including orders and addresses will be permanently deleted.'
    )
    if (!confirmed) return

    try {
      const supabase = createClient()

      // Delete user account from Supabase auth
      const { error } = await supabase.rpc('delete_user_account')

      if (error) throw error

      toast.success('Account deleted successfully')
      await logout()
      router.push('/')
    } catch (error: any) {
      console.error('Error deleting account:', error)
      toast.error(error.message || 'Failed to delete account. Please contact support.')
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  // Guest View
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <GuestWelcome />

          {/* Track Order Section for Guests */}
          <div className="mt-8">
            <TrackOrderSection />
          </div>
        </div>
      </div>
    )
  }

  // Logged-in User View
  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Desktop Layout */}
        <div className="hidden lg:block">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-4">
                  {/* Profile Picture */}
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.name || 'Profile'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-10 h-10 text-gray-400" />
                    )}
                  </div>

                  {/* Name & Email */}
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">{user.name || 'User'}</h2>
                    <p className="text-gray-600">{user.email}</p>
                  </div>

                  {/* Edit Button */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowEditDialog(true)}
                    className="flex-shrink-0"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Addresses Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <AddressesSection />
              </div>

              {/* My Orders Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <button
                  onClick={() => router.push('/orders')}
                  className="w-full flex items-center justify-between hover:bg-gray-50 p-4 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-gray-700" />
                    <span className="font-semibold text-lg">My Orders</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Account Settings Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Account Settings
                </h3>
                <div className="space-y-2">
                  {/* Change Password */}
                  <button
                    onClick={() => setShowChangePassword(!showChangePassword)}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-between"
                  >
                    <span>Change Password</span>
                    <svg className={`w-4 h-4 transition-transform ${showChangePassword ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showChangePassword && (
                    <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                      <input
                        type="password"
                        placeholder="Current Password"
                        value={passwordData.current}
                        onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                      />
                      <input
                        type="password"
                        placeholder="New Password"
                        value={passwordData.new}
                        onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                      />
                      <input
                        type="password"
                        placeholder="Confirm New Password"
                        value={passwordData.confirm}
                        onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleChangePassword} className="bg-black hover:bg-gray-800">
                          Update Password
                        </Button>
                        <Button variant="outline" onClick={() => setShowChangePassword(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Delete Account */}
                  <button
                    onClick={handleDeleteAccount}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors text-red-600"
                  >
                    Delete Account
                  </button>

                  {/* Logout - Desktop (inside settings) */}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden">
          <div className="container mx-auto px-4 py-6 max-w-4xl">
            <div className="space-y-4">
              {/* Profile Header - Mobile */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.name || 'Profile'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-gray-900 truncate">{user.name || 'User'}</h2>
                    <p className="text-sm text-gray-600 truncate">{user.email}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowEditDialog(true)}
                    className="flex-shrink-0"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Addresses Section - Mobile */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <AddressesSection />
              </div>

              {/* My Orders Section - Mobile */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <button
                  onClick={() => router.push('/orders')}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-gray-700" />
                    <span className="font-semibold">My Orders</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Account Settings Section - Mobile */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Account Settings
                </h3>
                <div className="space-y-2">
                  {/* Change Password - Mobile */}
                  <button
                    onClick={() => setShowChangePassword(!showChangePassword)}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-between text-sm"
                  >
                    <span>Change Password</span>
                    <svg className={`w-4 h-4 transition-transform ${showChangePassword ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showChangePassword && (
                    <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                      <input
                        type="password"
                        placeholder="Current Password"
                        value={passwordData.current}
                        onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                      />
                      <input
                        type="password"
                        placeholder="New Password"
                        value={passwordData.new}
                        onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                      />
                      <input
                        type="password"
                        placeholder="Confirm New Password"
                        value={passwordData.confirm}
                        onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleChangePassword} size="sm" className="bg-black hover:bg-gray-800">
                          Update
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowChangePassword(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Delete Account - Mobile */}
                  <button
                    onClick={handleDeleteAccount}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors text-red-600 text-sm"
                  >
                    Delete Account
                  </button>
                </div>
              </div>

              {/* Logout Button - Mobile (outside settings) */}
              <button
                onClick={handleLogout}
                className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-red-600 font-medium"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <ProfileEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
    </>
  )
}
