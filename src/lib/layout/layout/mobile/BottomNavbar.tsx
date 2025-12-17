"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useCart } from "@/domains/cart"

export default function BottomNavbar() {
  const pathname = usePathname()
  const { itemCount } = useCart()

  // Hide bottom navbar on product detail pages
  const isProductPage = pathname?.startsWith('/products/')

  const navItems = [
    {
      name: "Home",
      href: "/",
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      name: "Explore",
      href: "/collections/all",
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
      ),
    },
    {
      name: "Wishlist",
      href: "/wishlist",
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      ),
    },
    {
      name: "Cart",
      href: "/cart",
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
    },
    {
      name: "Profile",
      href: "/account",
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
  ]

  return (
    <>
      {/* Conditionally render navbar without early returns */}
      {!isProductPage && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-black bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.1)] lg:hidden">
          <div className="flex items-center justify-around px-2 py-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 px-3 py-2 transition-colors ${isActive ? "text-red-600" : "text-gray-600 hover:text-red-600"
                    }`}
                >
                  <div className="relative">
                    {item.icon}
                    {item.name === 'Cart' && itemCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white z-10">
                        {itemCount}
                      </span>
                    )}
                  </div>
                  <span
                    className={`font-body text-[10px] font-medium ${isActive ? "text-red-600" : "text-gray-600"
                      }`}
                  >
                    {item.name}
                  </span>
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </>
  )
}
