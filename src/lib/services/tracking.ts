/**
 * ST Courier Tracking Service for Dude Menswear
 * 
 * Manual tracking system for ST Courier shipments
 * Admins manually enter AWB (Air Waybill) numbers
 * System generates tracking URLs for customers
 */

export interface TrackingInfo {
  awbNumber: string;
  courier: 'ST Courier';
  trackingUrl: string;
  shippedDate: Date | string;
  estimatedDelivery: Date | string;
  status: 'pending' | 'processing' | 'shipped' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'cancelled';
}

export interface UpdateTrackingInput {
  orderId: string;
  awbNumber: string;
  shippedDate?: Date | string;
}

export interface TrackingUpdateResult {
  success: boolean;
  trackingInfo?: TrackingInfo;
  error?: string;
}

/**
 * ST Courier configuration
 */
export const ST_COURIER_CONFIG = {
  name: 'ST Courier',
  website: 'https://www.stcourier.com',
  trackingBaseUrl: 'https://www.stcourier.com/track-consignment',
  contactPhone: '+91-XXX-XXX-XXXX', // Update with actual ST Courier contact
  supportEmail: 'support@stcourier.com'
} as const;

/**
 * Validate AWB number format
 * ST Courier AWB numbers are typically 10-12 digits
 */
export function isValidAWBNumber(awbNumber: string): boolean {
  const cleanAwb = awbNumber.trim().replace(/\s+/g, '');
  // AWB should be 10-12 digits
  const awbRegex = /^[0-9]{10,12}$/;
  return awbRegex.test(cleanAwb);
}

/**
 * Generate ST Courier tracking URL
 */
export function generateTrackingUrl(awbNumber: string): string {
  const cleanAwb = awbNumber.trim().replace(/\s+/g, '');
  return `${ST_COURIER_CONFIG.trackingBaseUrl}?tracking_no=${cleanAwb}`;
}

/**
 * Calculate estimated delivery date from shipped date
 * ST Courier delivery time: 3-7 business days
 */
export function calculateEstimatedDeliveryFromShipped(shippedDate: Date | string): Date {
  const shipped = typeof shippedDate === 'string' ? new Date(shippedDate) : shippedDate;
  const estimated = new Date(shipped);
  
  // Add 7 days as maximum delivery time
  estimated.setDate(shipped.getDate() + 7);
  
  return estimated;
}

/**
 * Format tracking info for display
 */
export function formatTrackingInfo(awbNumber: string, shippedDate?: Date | string): TrackingInfo {
  const trackingUrl = generateTrackingUrl(awbNumber);
  const shipped = shippedDate ? 
    (typeof shippedDate === 'string' ? new Date(shippedDate) : shippedDate) : 
    new Date();
  const estimatedDelivery = calculateEstimatedDeliveryFromShipped(shipped);
  
  return {
    awbNumber,
    courier: 'ST Courier',
    trackingUrl,
    shippedDate: shipped,
    estimatedDelivery,
    status: 'shipped'
  };
}

/**
 * Get tracking status display text
 */
export function getTrackingStatusText(status: TrackingInfo['status']): string {
  const statusMap: Record<TrackingInfo['status'], string> = {
    pending: 'Order Pending',
    processing: 'Processing Order',
    shipped: 'Shipped',
    in_transit: 'In Transit',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  };
  
  return statusMap[status] || 'Unknown';
}

/**
 * Get tracking status color for UI
 */
export function getTrackingStatusColor(status: TrackingInfo['status']): string {
  const colorMap: Record<TrackingInfo['status'], string> = {
    pending: 'gray',
    processing: 'blue',
    shipped: 'purple',
    in_transit: 'indigo',
    out_for_delivery: 'orange',
    delivered: 'green',
    cancelled: 'red'
  };
  
  return colorMap[status] || 'gray';
}

/**
 * Validate and format AWB number for storage
 */
export function formatAWBNumber(awbNumber: string): string {
  return awbNumber.trim().replace(/\s+/g, '');
}

/**
 * Get tracking timeline steps
 */
export function getTrackingTimeline(currentStatus: TrackingInfo['status']) {
  const allSteps = [
    { status: 'pending', label: 'Order Placed', completed: false },
    { status: 'processing', label: 'Processing', completed: false },
    { status: 'shipped', label: 'Shipped', completed: false },
    { status: 'in_transit', label: 'In Transit', completed: false },
    { status: 'out_for_delivery', label: 'Out for Delivery', completed: false },
    { status: 'delivered', label: 'Delivered', completed: false }
  ];
  
  const statusOrder: TrackingInfo['status'][] = [
    'pending',
    'processing',
    'shipped',
    'in_transit',
    'out_for_delivery',
    'delivered'
  ];
  
  const currentIndex = statusOrder.indexOf(currentStatus);
  
  return allSteps.map((step, index) => ({
    ...step,
    completed: index <= currentIndex,
    current: step.status === currentStatus
  }));
}

/**
 * Prepare tracking email data
 */
export function prepareTrackingEmailData(
  orderNumber: string,
  customerName: string,
  trackingInfo: TrackingInfo
) {
  return {
    orderNumber,
    customerName,
    awbNumber: trackingInfo.awbNumber,
    courier: trackingInfo.courier,
    trackingUrl: trackingInfo.trackingUrl,
    shippedDate: trackingInfo.shippedDate,
    estimatedDelivery: trackingInfo.estimatedDelivery
  };
}
