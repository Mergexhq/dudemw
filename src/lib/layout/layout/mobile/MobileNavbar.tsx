"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useOfferBar } from "@/contexts/OfferBarContext"
import NavigationDrawer from "../drawer/NavigationDrawer"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBars, faTimes } from "@fortawesome/free-solid-svg-icons"

export default function MobileNavbar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { isOfferBarVisible } = useOfferBar()

  return (
    <>
      {/* Top Navbar */}
      <nav className={`fixed left-0 right-0 z-40 bg-white/95 backdrop-blur-sm lg:hidden transition-all duration-300 ${isOfferBarVisible ? 'top-7' : 'top-0'}`}>
        <div className="flex items-center justify-between px-4 py-2">
          {/* Hamburger Menu */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="relative h-9 w-9 flex items-center justify-center rounded-full bg-gray-100 transition-all hover:bg-gray-200 hover:text-red-600"
            aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
          >
            <FontAwesomeIcon
              icon={isSidebarOpen ? faTimes : faBars}
              className="h-5 w-5 text-gray-900"
            />
          </button>

          {/* Logo - Center */}
          <Link href="/" className="flex items-center">
            <div className="relative h-7 w-32">
              <Image
                src="/logo/typography-logo.png"
                alt="Dude Mens Wear"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Search Icon */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="p-2 transition-colors hover:text-red-600"
            aria-label="Search"
          >
            <svg
              className="h-6 w-6"
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
        </div>

        {/* Full-Screen Search */}
        {isSearchOpen && (
          <div className="border-t-2 border-gray-200 bg-white p-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 pr-10 font-body text-sm focus:border-red-600 focus:outline-none"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </>
  )
}
