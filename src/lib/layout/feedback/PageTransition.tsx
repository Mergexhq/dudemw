'use client'

import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
}

/**
 * Lightweight CSS-based page transition replacing framer-motion.
 * Framer-motion adds ~45 KB to the initial bundle and causes layout
 * recalculations every frame on low-end mobile CPUs.
 *
 * This version uses a simple CSS opacity fade via a keyed div,
 * which runs on the GPU compositor thread and has zero JS cost.
 */
export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()

  return (
    <div key={pathname} className="page-transition-in">
      {children}
    </div>
  )
}
