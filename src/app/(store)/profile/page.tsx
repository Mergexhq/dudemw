"use client";

import dynamic from 'next/dynamic'

const ProfilePage = dynamic(() => import('@/domains/profile').then(mod => ({ default: mod.ProfilePage })), {
  ssr: false,
  loading: () => (
    <div className="profile-page-wrapper">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    </div>
  )
})

export default function Profile() {
  return (
    <div className="profile-page-wrapper">
      <ProfilePage />
    </div>
  )
}
