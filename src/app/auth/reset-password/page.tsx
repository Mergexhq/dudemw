import { Suspense } from 'react'
import { ResetPasswordPage } from '@/domains/auth'

function ResetPasswordFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
    </div>
  )
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordPage />
    </Suspense>
  )
}
