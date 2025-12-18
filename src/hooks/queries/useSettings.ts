import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { SettingsService } from '@/lib/services/settings'
import { StoreSettings, PaymentSettings, TaxSettings, SystemSettings } from '@/lib/types/settings'

/**
 * Query keys for settings
 */
export const settingsKeys = {
  all: ['settings'] as const,
  store: () => [...settingsKeys.all, 'store'] as const,
  payment: () => [...settingsKeys.all, 'payment'] as const,
  shipping: () => [...settingsKeys.all, 'shipping'] as const,
  tax: () => [...settingsKeys.all, 'tax'] as const,
  system: () => [...settingsKeys.all, 'system'] as const,
}

/**
 * Hook to fetch store settings
 */
export function useStoreSettings(
  options?: Omit<UseQueryOptions<StoreSettings, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: settingsKeys.store(),
    queryFn: async () => {
      const result = await SettingsService.getStoreSettings()
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch store settings')
      }
      return result.data
    },
    staleTime: 10 * 60 * 1000, // Settings are stale after 10 minutes
    ...options,
  })
}

/**
 * Hook to fetch payment settings
 */
export function usePaymentSettings(
  options?: Omit<UseQueryOptions<PaymentSettings, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: settingsKeys.payment(),
    queryFn: async () => {
      const result = await SettingsService.getPaymentSettings()
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch payment settings')
      }
      return result.data
    },
    staleTime: 10 * 60 * 1000,
    ...options,
  })
}

/**
 * Hook to fetch shipping zones and rates
 */
export function useShippingSettings(
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: settingsKeys.shipping(),
    queryFn: async () => {
      const result = await SettingsService.getShippingZones()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch shipping settings')
      }
      return result.data
    },
    staleTime: 10 * 60 * 1000,
    ...options,
  })
}

/**
 * Hook to fetch tax settings
 */
export function useTaxSettings(
  options?: Omit<UseQueryOptions<TaxSettings[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: settingsKeys.tax(),
    queryFn: async () => {
      const result = await SettingsService.getTaxSettings()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch tax settings')
      }
      return result.data || []
    },
    staleTime: 10 * 60 * 1000,
    ...options,
  })
}

/**
 * Hook to fetch system settings
 */
export function useSystemSettings(
  options?: Omit<UseQueryOptions<SystemSettings, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: settingsKeys.system(),
    queryFn: async () => {
      const result = await SettingsService.getSystemSettings()
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch system settings')
      }
      return result.data
    },
    staleTime: 10 * 60 * 1000,
    ...options,
  })
}
