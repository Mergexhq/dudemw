import { QueryClient, DefaultOptions } from '@tanstack/react-query'

/**
 * Default options for React Query
 * Optimized for admin dashboard with longer cache times
 */
const defaultOptions: DefaultOptions = {
  queries: {
    // Queries will be considered stale after 5 minutes
    staleTime: 5 * 60 * 1000,
    // Cache data for 10 minutes
    gcTime: 10 * 60 * 1000,
    // Retry failed requests once
    retry: 1,
    // Don't refetch on window focus for admin dashboard
    refetchOnWindowFocus: false,
    // Refetch on mount if data is stale
    refetchOnMount: true,
    // Don't refetch on reconnect for admin dashboard
    refetchOnReconnect: false,
  },
  mutations: {
    // Retry failed mutations once
    retry: 1,
  },
}

/**
 * Create a new QueryClient instance
 * Used for server-side rendering and client-side hydration
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions,
  })
}

/**
 * Singleton QueryClient for client-side
 */
let browserQueryClient: QueryClient | undefined = undefined

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient()
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}
