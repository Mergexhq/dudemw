'use client'

import { useCart } from '@/domains/cart'
import MobileCartView from './MobileCartView'
import DesktopCartView from './DesktopCartView'
import EmptyCart from './EmptyCart'
import { CartSkeleton } from './CartSkeleton'

export default function CartPage() {
  const { cartItems, isLoading } = useCart()

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <CartSkeleton />
      </div>
    )
  }

  if (cartItems.length === 0) {
    return <EmptyCart />
  }

  return (
    <>
      {/* Mobile Cart - visible on small screens */}
      <div className="lg:hidden">
        <MobileCartView />
      </div>

      {/* Desktop Cart - visible on large screens */}
      <div className="hidden lg:block">
        <DesktopCartView />
      </div>
    </>
  )
}
