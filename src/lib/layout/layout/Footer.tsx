"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import DesktopFooter from "./desktop/Footer"
import FooterLite from "./mobile/FooterLite"

// Auth routes where footer should be hidden
const authRoutes = ['/sign-in', '/sign-up']

export default function Footer() {
  const pathname = usePathname()
  const [isAdminSubdomain, setIsAdminSubdomain] = useState(false)

  // Check if we're on admin subdomain via data attribute
  useEffect(() => {
    const isAdmin = document.body.getAttribute('data-admin-subdomain') === 'true'
    setIsAdminSubdomain(isAdmin)
  }, [])

  // Don't render footer on admin pages or admin subdomain
  if (pathname?.startsWith('/admin') || isAdminSubdomain) {
    return null
  }

  // Don't render footer on auth pages
  if (authRoutes.some(route => pathname?.startsWith(route))) {
    return null
  }

  return (
    <>
      {/* Desktop Footer */}
      <DesktopFooter />

      {/* Mobile Footer Lite */}
      {pathname !== '/cart' && pathname !== '/checkout' && <FooterLite />}
    </>
  )
}
