import { Suspense } from 'react'
import { VerifyOtpPage } from '@/domains/auth'

function VerifyOtpFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
    </div>
  )
}

export default function VerifyOtp() {
  return (
    <Suspense fallback={<VerifyOtpFallback />}>
      <VerifyOtpPage />
    </Suspense>
  )
}
