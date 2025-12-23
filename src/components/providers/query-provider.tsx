'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { getQueryClient } from '@/lib/query-client'
import { ReactNode } from 'react'

interface QueryProviderProps {
  children: ReactNode
}

/**
 * Query Provider Component
 * Wraps the app with React Query context and dev tools
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* React Query DevTools - Temporarily disabled due to Turbopack error */}
      {/* process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      ) */}
    </QueryClientProvider>
  )
}
