'use client'

import Link from 'next/link'

export default function GuestWelcome() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
      <h2 className="text-3xl font-bold mb-4">Unlock More Features</h2>
      <p className="text-gray-600 mb-8">
        Save your details for faster checkout and see your full order history.
      </p>
      <Link
        href="/auth/login"
        className="inline-block bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
      >
        Sign In / Create Account
      </Link>
    </div>
  )
}
