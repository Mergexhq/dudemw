"use client"

import { useState, useEffect } from 'react'

export type CookieConsent = 'accepted' | 'declined' | null

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsent>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check localStorage for existing consent
    const savedConsent = localStorage.getItem('cookie-consent') as CookieConsent
    setConsent(savedConsent)
    setIsLoading(false)
  }, [])

  const updateConsent = (newConsent: CookieConsent) => {
    if (newConsent) {
      localStorage.setItem('cookie-consent', newConsent)
    } else {
      localStorage.removeItem('cookie-consent')
    }
    setConsent(newConsent)
  }

  const hasConsented = consent === 'accepted'
  const hasDeclined = consent === 'declined'
  const needsConsent = consent === null

  return {
    consent,
    hasConsented,
    hasDeclined,
    needsConsent,
    isLoading,
    updateConsent
  }
}