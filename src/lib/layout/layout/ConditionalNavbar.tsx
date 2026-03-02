"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import Navbar from "./Navbar"

// Auth routes where navbar should be hidden
const authRoutes = ['/sign-in', '/sign-up', '/auth']

export default function ConditionalNavbar() {
  const pathname = usePathname()
  const [isAdminSubdomain, setIsAdminSubdomain] = useState(false)

  // Check if we're on admin subdomain via data attribute
  useEffect(() => {
    const isAdmin = document.body.getAttribute('data-admin-subdomain') === 'true'
    setIsAdminSubdomain(isAdmin)
  }, [])

  // Hide navbar completely on admin pages or admin subdomain
  const isAdminPage = pathname?.startsWith('/admin') || isAdminSubdomain

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
