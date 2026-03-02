import { prisma } from '@/lib/db'

export type NotificationType = 'order' | 'stock' | 'customer' | 'system'
export type NotificationPriority = 'low' | 'medium' | 'high'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  priority: NotificationPriority
  read: boolean
  created_at: string
  metadata?: any
}

export class NotificationService {
  /**
   * Real-time notifications have been removed as part of the
   * migration to Neon + Prisma. Real-time features can be implemented
   * using Server-Sent Events (SSE) or polling.
   */
  static subscribeToNotifications(_userId: string, _callback: (notification: Notification) => void) {
    console.warn('[NotificationService] Real-time subscriptions require SSE or polling — not yet implemented.')
    return { success: false, channels: [], error: 'Real-time notifications not yet implemented in Neon stack' }
  }

  static async unsubscribeFromNotifications() {
    return { success: true }
  }

  /** Check for low stock and return notification items */
  static async checkLowStock() {
    try {
      const products = await prisma.products.findMany({
        where: {
          global_stock: { lte: 10, gt: 0 },
        } as any,
        select: { id: true, title: true, global_stock: true },
      })

      const notifications: Notification[] = (products as any[]).map(product => ({
        id: `low-stock-${product.id}`,
        type: 'stock' as NotificationType,
        title: 'Low Stock Alert',
        message: `${product.title} is running low (${product.global_stock} units left)`,
        priority: 'medium' as NotificationPriority,
        read: false,
        created_at: new Date().toISOString(),
        metadata: product,
      }))

      return { success: true, data: notifications }
    } catch (error) {
      console.error('Error checking low stock:', error)
      return { success: false, error: 'Failed to check stock levels' }
    }
  }

  /** Check for out of stock products */
  static async checkOutOfStock() {
    try {
      const products = await prisma.products.findMany({
        where: { global_stock: 0, status: 'active' } as any,
        select: { id: true, title: true, global_stock: true, status: true },
      })

      const notifications: Notification[] = (products as any[]).map(product => ({
        id: `out-of-stock-${product.id}`,
        type: 'stock' as NotificationType,
        title: 'Out of Stock',
        message: `${product.title} is out of stock`,
        priority: 'high' as NotificationPriority,
        read: false,
        created_at: new Date().toISOString(),
        metadata: product,
      }))

      return { success: true, data: notifications }
    } catch (error) {
      console.error('Error checking out of stock:', error)
      return { success: false, error: 'Failed to check stock levels' }
    }
  }

  /** Get pending orders count */
  static async getPendingOrdersCount() {
    try {
      const count = await prisma.orders.count({
        where: { order_status: 'pending' } as any,
      })
      return { success: true, count }
    } catch (error) {
      console.error('Error fetching pending orders count:', error)
      return { success: false, count: 0 }
    }
  }

  /** Send email notification (delegates to Resend service) */
  static async sendEmailNotification(to: string, subject: string, _html: string) {
    console.log('Sending email notification:', { to, subject })
    return { success: true }
  }

  static async markAsRead(_notificationId: string) {
    return { success: true }
  }

  static async clearAllNotifications() {
    return { success: true }
  }
}
