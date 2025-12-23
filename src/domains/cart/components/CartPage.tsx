'use client'

import { useCart } from '@/domains/cart'
import MobileCartView from './MobileCartView'
import DesktopCartView from './DesktopCartView'
import EmptyCart from './EmptyCart'

export default function CartPage() {
  const { cartItems } = useCart()

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
