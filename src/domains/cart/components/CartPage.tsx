'use client'

import { useCart } from '@/domains/cart'
import MobileCartView from './MobileCartView'
import DesktopCartView from './DesktopCartView'
import EmptyCart from './EmptyCart'
import { CartSkeleton } from './CartSkeleton'
import { useState, useEffect } from 'react'

export default function CartPage() {
  const { cartItems, isLoading } = useCart()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Show loading skeleton during initial load or before mounting
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <CartSkeleton />
        </div>
      </div>
    )
  }

  // Show empty cart state
  if (cartItems.length === 0) {
    return <EmptyCart />
  }

  // Show cart content
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Cart - visible on small screens */}
      <div className="lg:hidden">
        <MobileCartView />
      </div>

      {/* Desktop Cart - visible on large screens */}
      <div className="hidden lg:block">
        <DesktopCartView />
      </div>
    </div>
  )
}
