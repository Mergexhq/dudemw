import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CustomerService } from '@/lib/services/customers'
import { customerKeys } from '../queries/useCustomers'
import { toast } from 'sonner'

/**
 * Mutation hook for exporting customers to CSV
 */
export function useExportCustomers() {
  return useMutation({
    mutationFn: async (filters?: any) => {
      const result = await CustomerService.exportCustomers(filters)
      if (!result.success) {
        throw new Error(result.error || 'Failed to export customers')
      }
      return result
    },
    onSuccess: () => {
      toast.success('Customers exported successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to export customers')
    },
  })
}

/**
 * Mutation hook for sending email to customer
 */
export function useSendCustomerEmail() {
  return useMutation({
    mutationFn: async ({ customerId, subject, message }: { customerId: string; subject: string; message: string }) => {
      const result = await CustomerService.sendEmail(customerId, subject, message)
      if (!result.success) {
        throw new Error(result.error || 'Failed to send email')
      }
      return result
    },
    onSuccess: () => {
      toast.success('Email sent successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send email')
    },
  })
}
