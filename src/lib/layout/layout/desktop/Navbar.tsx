"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import InstantSearch from "@/components/search/InstantSearch"
import { useCart } from "@/domains/cart"
import { useOfferBar } from "@/contexts/OfferBarContext"
import { useWishlist } from "@/domains/wishlist"
import NavigationDrawer from "../drawer/NavigationDrawer"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBars, faTimes } from "@fortawesome/free-solid-svg-icons"

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showInstantSearch, setShowInstantSearch] = useState(false)
  const [placeholderText, setPlaceholderText] = useState("")
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const { itemCount } = useCart()
  const { count: wishlistCount } = useWishlist()
  const { isOfferBarVisible } = useOfferBar()
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery("")
    }
  }

  const placeholders = [
    "Search for t-shirts...",
    "Search for track pants...",
    "Search for cargo pants...",
    "Search for combos...",
    "Search online store here...",
  ]

  useEffect(() => {
    if (searchQuery) return // Don't animate if user is typing

    const currentPlaceholder = placeholders[placeholderIndex]
    let charIndex = 0

    const typingInterval = setInterval(() => {
      if (charIndex <= currentPlaceholder.length) {
        setPlaceholderText(currentPlaceholder.slice(0, charIndex))
        charIndex++
      } else {
        clearInterval(typingInterval)
        setTimeout(() => {
          setPlaceholderIndex((prev) => (prev + 1) % placeholders.length)
        }, 2000) // Wait 2 seconds before next placeholder
      }
    }, 100) // Typing speed

    return () => clearInterval(typingInterval)
  }, [placeholderIndex, searchQuery])

  return (
    <div>
      <nav className={`fixed left-0 right-0 z-40 bg-white/95 backdrop-blur-sm transition-all duration-300 ${isOfferBarVisible ? 'top-7' : 'top-0'}`}>
        <div className="mx-auto max-w-[1600px] px-6 py-4">
          <div className="flex items-center justify-between gap-8">
            {/* Left Group: Hamburger Menu + Search Bar */}
            <div className="flex items-center gap-6">
              {/* Hamburger Menu */}


              {/* Search Bar */}
              <div className="hidden w-80 lg:block relative">
                <form onSubmit={handleSearch} className="relative">
                  <input
                    type="text"
                    placeholder={placeholderText}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowInstantSearch(true)}
                    className="w-full border border-gray-300 bg-gray-50 px-4 py-1.5 pr-11 font-body text-sm text-black focus:border-red-600"
                    style={{ outline: 'none', boxShadow: 'none' }}
                  />
                  <button
                    type="submit"
                    className="absolute right-1 top-1/2 flex h-[calc(100%-8px)] w-[calc(100%-8px)] max-w-[26px] -translate-y-1/2 items-center justify-center transition-colors hover:text-red-600"
                  >
                    <svg
                      className="h-4 w-4 text-black"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </button>
                </form>

                {/* Instant Search Dropdown */}
                {showInstantSearch && searchQuery && (
                  <InstantSearch
                    query={searchQuery}
                    onClose={() => {
                      setShowInstantSearch(false)
                      setSearchQuery("")
                    }}
                  />
                )}
              </div>
            </div>

            {/* Center: Logo */}
            <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/logo/logo.png"
                  alt="Dude Mens Wear Icon"
                  width={32}
                  height={32}
                  className="h-8 w-8 flex-shrink-0 object-contain"
                  priority
                />
                <Image
                  src="/logo/typography-logo.png"
                  alt="Dude Mens Wear"
                  width={120}
                  height={28}
                  className="h-7 w-auto object-contain"
                  priority
                />
              </Link>
            </div>

            {/* Right Group: Actions */}
            <div className="flex items-center gap-2">
              <Link
                href="/wishlist"
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 transition-all hover:bg-gray-200 hover:text-red-600"
                aria-label="Wishlist"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                {wishlistCount > 0 && (
                  <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <Link
                href="/cart"
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 transition-all hover:bg-gray-200 hover:text-red-600"
                aria-label="Shopping Cart"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {itemCount > 0 && (
                  <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                    {itemCount}
                  </span>
                )}
              </Link>
              <Link
                href="/profile"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 transition-all hover:bg-gray-200 hover:text-red-600"
                aria-label="Account"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </Link>

              {/* Hamburger Menu (Moved to Right) */}
              <button
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                className="relative h-9 w-9 flex items-center justify-center rounded-full bg-gray-100 transition-all hover:bg-gray-200 hover:text-red-600 ml-2"
                aria-label={isDrawerOpen ? "Close menu" : "Open menu"}
              >
                <FontAwesomeIcon
                  icon={isDrawerOpen ? faTimes : faBars}
                  className="h-5 w-5 text-gray-900"
                />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      {/* Background Overlay when Mega Menu is open */}


    </div>
  )
}
