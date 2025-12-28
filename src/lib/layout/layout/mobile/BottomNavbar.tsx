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
          className="fixed bottom-4 left-4 right-4 z-40 lg:hidden"
          suppressHydrationWarning
        >
          <div
            className="rounded-full bg-gradient-to-br from-red-600 via-red-500 to-red-700 shadow-2xl overflow-hidden"
            style={{
              boxShadow: '0 10px 40px rgba(220, 38, 38, 0.4), 0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div className="relative flex items-center justify-around px-2 py-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex flex-col items-center gap-1 px-2 py-1 transition-all"
                  >
                    <motion.div
                      className="relative"
                      whileTap={{ scale: 0.9 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <div
                        className={`p-1.5 rounded-xl transition-all ${isActive
                          ? "bg-white shadow-md"
                          : "hover:bg-white/10"
                          }`}
                      >
                        <Icon className={`h-5 w-5 ${isActive ? "text-red-600" : "text-white"}`} />
                      </div>
                      {item.name === 'Cart' && itemCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-red-600 z-10 shadow-md">
                          {itemCount}
                        </span>
                      )}
                    </motion.div>
                    <span
                      className={`font-body text-[9px] font-medium text-white ${isActive ? "opacity-100" : "opacity-70"
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
