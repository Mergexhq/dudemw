import { useMutation, useQueryClient } from '@tanstack/react-query'
import { SettingsService } from '@/lib/services/settings'
import { settingsKeys } from '../queries/useSettings'
import { toast } from 'sonner'

/**
 * Mutation hook for updating store settings
 */
export function useUpdateStoreSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (settings: any) => {
      const result = await SettingsService.updateStoreSettings(settings)
      if (!result.success) {
        throw new Error(result.error || 'Failed to update store settings')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.store() })
      toast.success('Store settings updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update store settings')
    },
  })
}

/**
 * Mutation hook for updating payment settings
 */
export function useUpdatePaymentSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (settings: any) => {
      const result = await SettingsService.updatePaymentSettings(settings)
      if (!result.success) {
        throw new Error(result.error || 'Failed to update payment settings')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.payment() })
      toast.success('Payment settings updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update payment settings')
    },
  })
}

/**
 * Mutation hook for updating tax settings
 */
export function useUpdateTaxSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (settings: any) => {
      const result = await SettingsService.updateTaxSettings(settings)
      if (!result.success) {
        throw new Error(result.error || 'Failed to update tax settings')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.tax() })
      toast.success('Tax settings updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update tax settings')
    },
  })
}

/**
 * Mutation hook for creating shipping zone
 */
export function useCreateShippingZone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (zoneData: any) => {
      const result = await SettingsService.createShippingZone(zoneData)
      if (!result.success) {
        throw new Error(result.error || 'Failed to create shipping zone')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.shipping() })
      toast.success('Shipping zone created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create shipping zone')
    },
  })
}

/**
 * Mutation hook for updating shipping rate
 */
export function useUpdateShippingRate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ zoneId, rateData }: { zoneId: string; rateData: any }) => {
      const result = await SettingsService.updateShippingRate(zoneId, rateData)
      if (!result.success) {
        throw new Error(result.error || 'Failed to update shipping rate')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.shipping() })
      toast.success('Shipping rate updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update shipping rate')
    },
  })
}
