'use client'

import { useCart } from '@/domains/cart'
import { useAuth } from '@/domains/auth/context'
import CheckoutForm from './CheckoutFormV2'
import Link from 'next/link'

export default function CheckoutPage() {
  const { cartItems, isLoading: isCartLoading } = useCart()
  const { isLoading: isAuthLoading } = useAuth()

  if (isCartLoading || isAuthLoading) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">
            Add some items to your cart before checking out.
          </p>
          <Link
            href="/products"
            className="inline-block bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="container mx-auto px-4">
        <CheckoutForm />
      </div>
    </div>
  )
}
