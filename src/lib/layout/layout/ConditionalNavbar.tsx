"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"
import Navbar from "./Navbar"

// Auth routes where navbar should be hidden
const authRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/reset-password', '/auth/verify-otp', '/auth/callback']

export default function ConditionalNavbar() {
  const pathname = usePathname()

  // Hide navbar completely on admin pages
  const isAdminPage = pathname?.startsWith('/admin')

  // Hide navbar on auth pages
  const isAuthPage = authRoutes.some(route => pathname?.startsWith(route))

  // Hide navbar on mobile for product detail pages
  const isProductPage = pathname?.startsWith('/products/')

  // Pages where we should hide navbar and adjust layout
  const shouldHideNavbar = isAdminPage || isAuthPage

  // Update body class to adjust main padding
  useEffect(() => {
    if (isProductPage) {
      document.body.classList.add('pdp-page')
    } else {
      document.body.classList.remove('pdp-page')
    }

    if (shouldHideNavbar) {
      document.body.classList.add('admin-page')
    } else {
      document.body.classList.remove('admin-page')
    }

    return () => {
      document.body.classList.remove('pdp-page')
      document.body.classList.remove('admin-page')
    }
  }, [isProductPage, shouldHideNavbar])

  return (
    <>
      {/* Conditionally render navbar without early returns */}
      {!shouldHideNavbar && (
        <div className={isProductPage ? "hidden lg:block" : ""}>
          <Navbar />
        </div>
      )}
    </>
  )
}
