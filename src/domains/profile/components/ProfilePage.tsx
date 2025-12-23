'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/domains/auth/context'
import ProfileHeader from './ProfileHeader'
import ProfileSidebar from './ProfileSidebar'
import GuestWelcome from './GuestWelcome'
import MobileProfileView from './MobileProfileView'
import MobileGuestView from './MobileGuestView'
import DesktopGuestView from './DesktopGuestView'
import OrdersSection from '../sections/OrdersSection'
import WishlistSection from '../sections/WishlistSection'
import AddressesSection from '../sections/AddressesSection'
import SettingsSection from '../sections/SettingsSection'
import TrackOrderSection from '../sections/TrackOrderSection'
import { type ProfileSection } from '@/domains/profile/types'

export default function ProfilePage() {
  const { user, logout, isLoading } = useAuth()
  const [activeSection, setActiveSection] = useState<ProfileSection>('track-order')

  // Update active section when user loads
  useEffect(() => {
    // Allow both guests and logged-in users to access track-order section
    // No automatic switching needed
  }, [user, isLoading, activeSection])

  const renderSection = () => {
    if (!user && activeSection !== 'track-order') {
      return <GuestWelcome />
    }

    switch (activeSection) {
      case 'orders':
        return <OrdersSection />
      case 'wishlist':
        return <WishlistSection />
      case 'addresses':
        return <AddressesSection />
      case 'settings':
        return <SettingsSection />
      case 'track-order':
        return <TrackOrderSection />
      default:
        return <OrdersSection />
    }
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

  return (
    <>
      {/* Guest View */}
      {!user ? (
        <>
          {/* Mobile Guest View */}
          <div className="lg:hidden">
            <MobileGuestView />
          </div>

          {/* Desktop Guest View */}
          <div className="hidden lg:block">
            <DesktopGuestView />
          </div>
        </>
      ) : (
        <>
          {/* Mobile View - Logged In */}
          <div className="lg:hidden">
            {activeSection === 'overview' ? (
              <MobileProfileView
                userName={user.name || user.email}
                onSectionChange={setActiveSection}
                onLogout={logout}
              />
            ) : (
              <div className="min-h-screen bg-gray-50">
                {/* Back Button */}
                <div className="bg-white px-4 py-4 border-b border-gray-200 sticky top-0 z-10">
                  <button
                    onClick={() => setActiveSection('overview')}
                    className="flex items-center gap-2 text-gray-700 hover:text-black"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="font-medium">Back</span>
                  </button>
                </div>
                {/* Section Content */}
                <div className="p-4">
                  {renderSection()}
                </div>
              </div>
            )}
          </div>

          {/* Desktop View - Logged In */}
          <div className="hidden lg:block min-h-screen bg-gray-50">
            <div className="w-full px-4 py-8">
              <div className="grid lg:grid-cols-[300px_1fr] gap-6 w-full">
                {/* Sidebar - Desktop */}
                <div className="hidden lg:block">
                  <div className="sticky top-8">
                    <div className="h-[calc(100vh-4rem)] overflow-hidden">
                      <ProfileSidebar
                        activeSection={activeSection}
                        onSectionChange={setActiveSection}
                        onLogout={logout}
                        userName={user.name || user.email}
                        userEmail={user.email}
                      />
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 w-full">
                  {renderSection()}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
