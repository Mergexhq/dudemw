'use client'

import Link from 'next/link'
import { User, Heart, Clock, Package } from 'lucide-react'

export default function GuestWelcome() {
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-black to-red-900 text-white p-8 rounded-lg text-center">
        <User className="w-16 h-16 mx-auto mb-4 opacity-80" />
        <h2 className="text-2xl font-bold mb-2">Welcome to Dude Mens Wear</h2>
        <p className="text-gray-300 mb-6">
          Login pannita full access kudukkum da – order history, saved addresses, easy reorder!
        </p>
        <Link
          href="/auth/login"
          className="inline-block bg-white text-black px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          Sign In / Create Account
        </Link>
      </div>

      {/* Guest Features */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="border border-gray-200 rounded-lg p-6 hover:border-black transition-colors">
          <Package className="w-8 h-8 mb-3 text-red-600" />
          <h3 className="font-semibold mb-2">Track Recent Orders</h3>
          <p className="text-sm text-gray-600 mb-4">
            Order number and email use panni track pannalam
          </p>
          <Link
            href="/profile?section=track-order"
            className="text-sm text-black font-medium hover:underline"
          >
            Track Order →
          </Link>
        </div>

        <div className="border border-gray-200 rounded-lg p-6 hover:border-black transition-colors">
          <Heart className="w-8 h-8 mb-3 text-red-600" />
          <h3 className="font-semibold mb-2">Your Wishlist</h3>
          <p className="text-sm text-gray-600 mb-4">
            Saved items (login panna sync aagum)
          </p>
          <Link
            href="/wishlist"
            className="text-sm text-black font-medium hover:underline"
          >
            View Wishlist →
          </Link>
        </div>

        <div className="border border-gray-200 rounded-lg p-6 hover:border-black transition-colors">
          <Clock className="w-8 h-8 mb-3 text-red-600" />
          <h3 className="font-semibold mb-2">Recently Viewed</h3>
          <p className="text-sm text-gray-600 mb-4">
            Recently paatha products
          </p>
          <Link
            href="/profile?section=recent"
            className="text-sm text-black font-medium hover:underline"
          >
            View History →
          </Link>
        </div>
      </div>
    </div>
  )
}
