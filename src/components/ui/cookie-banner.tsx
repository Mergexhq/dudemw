"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Cookie } from 'lucide-react'
import Link from 'next/link'

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem('cookie-consent')
    if (!cookieConsent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true)
        // Trigger animation after component mounts
        setTimeout(() => setIsAnimating(true), 50)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setIsAnimating(false)
    setTimeout(() => setIsVisible(false), 300)
  }

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined')
    setIsAnimating(false)
    setTimeout(() => setIsVisible(false), 300)
  }

  const handleClose = () => {
    // If they close without choosing, we'll ask again next time
    setIsAnimating(false)
    setTimeout(() => setIsVisible(false), 300)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-6 md:right-6 lg:left-auto lg:right-6 lg:max-w-md">
      <div 
        className={`bg-white border border-gray-200 rounded-lg shadow-lg p-4 backdrop-blur-sm transition-all duration-300 ease-out ${
          isAnimating 
            ? 'translate-y-0 opacity-100' 
            : 'translate-y-full opacity-0'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Cookie className="w-5 h-5 text-amber-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 leading-relaxed">
              We use cookies to enhance your experience and analyze site traffic. 
              <Link href="/privacy" className="text-black hover:underline font-medium ml-1">
                Learn more
              </Link>
            </p>
            
            <div className="flex items-center gap-2 mt-3">
              <Button 
                onClick={handleAccept}
                size="sm"
                className="bg-black hover:bg-gray-800 text-white px-4 py-1.5 text-xs font-medium"
              >
                Accept
              </Button>
              <Button 
                onClick={handleDecline}
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 text-xs font-medium"
              >
                Decline
              </Button>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close cookie banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}