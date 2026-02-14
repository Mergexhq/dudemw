"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useCart } from "@/domains/cart"
import { motion } from "framer-motion"
import { Home, ShoppingBag, Heart, ShoppingCart, User } from "lucide-react"

export default function BottomNavbar() {
  const pathname = usePathname()
  const { itemCount } = useCart()

  // Hide bottom navbar on product detail pages
  const isProductPage = pathname?.startsWith('/products/')

  const navItems = [
    {
      name: "Home",
      href: "/",
      icon: Home,
    },
    {
      name: "Explore",
      href: "/products",
      icon: ShoppingBag,
    },
    {
      name: "Wishlist",
      href: "/wishlist",
      icon: Heart,
    },
    {
      name: "Cart",
      href: "/cart",
      icon: ShoppingCart,
    },
    {
      name: "Profile",
      href: "/account",
      icon: User,
    },
  ]

  return (
    <>
      {/* Conditionally render navbar without early returns */}
      {!isProductPage && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 lg:hidden pb-safe"
          suppressHydrationWarning
        >
          <div className="bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="relative flex items-center justify-around px-2 py-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex flex-col items-center gap-1 px-2 py-1 transition-all flex-1"
                  >
                    <motion.div
                      className="relative"
                      whileTap={{ scale: 0.9 }}
                    >
                      <div
                        className={`p-1.5 rounded-xl transition-all ${isActive
                          ? "bg-red-50 text-red-600"
                          : "text-gray-400 hover:text-gray-600"
                          }`}
                      >
                        <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
                      </div>
                      {item.name === 'Cart' && itemCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white z-10 shadow-sm ring-2 ring-white">
                          {itemCount}
                        </span>
                      )}
                    </motion.div>
                    <span
                      className={`font-body text-[10px] font-medium transition-colors ${isActive ? "text-red-600" : "text-gray-400"
                        }`}
                    >
                      {item.name}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>
      )}
    </>
  )
}
