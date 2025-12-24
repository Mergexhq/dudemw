"use client"

import { usePathname } from "next/navigation"
import DesktopFooter from "./desktop/Footer"
import FooterLite from "./mobile/FooterLite"

// Auth routes where footer should be hidden
const authRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/reset-password', '/auth/verify-otp', '/auth/callback']

export default function Footer() {
  const pathname = usePathname()

  // Don't render footer on admin pages
  if (pathname?.startsWith('/admin')) {
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
      <FooterLite />
    </>
  )
}
