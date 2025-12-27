import Razorpay from 'razorpay';
import crypto from 'crypto';

// Lazy initialization of Razorpay instance to prevent build errors
let razorpayInstance: Razorpay | null = null;

const getRazorpay = () => {
  if (!razorpayInstance) {
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay keys missing. Please check NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET');
    }

    razorpayInstance = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID.trim(),
      key_secret: process.env.RAZORPAY_KEY_SECRET.trim(),
    });
  }
  return razorpayInstance;
};

export interface CreateOrderOptions {
  amount: number; // in paise (₹1 = 100 paise)
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface VerifyPaymentOptions {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/**
 * Create a Razorpay order
 */
export async function createRazorpayOrder(options: CreateOrderOptions) {
  try {
    const rz = getRazorpay();
    const order = await rz.orders.create({
      amount: options.amount,
      currency: options.currency || 'INR',
      receipt: options.receipt || `order_${Date.now()}`,
      notes: options.notes || {},
    });

    return {
      success: true,
      order,
    };
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Order creation failed',
    };
  }
}

/**
 * Verify Razorpay payment signature
 */
export function verifyRazorpayPayment(options: VerifyPaymentOptions): boolean {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = options;

    // Ensure secret is present
    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error('RAZORPAY_KEY_SECRET missing during verification');
      return false;
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    return expectedSignature === razorpay_signature;
  } catch (error) {
    console.error('Payment verification failed:', error);
    return false;
  }
}

/**
 * Verify Razorpay webhook signature
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Webhook verification failed:', error);
    return false;
  }
}

/**
 * Get payment details
 */
export async function getPaymentDetails(paymentId: string) {
  try {
    const rz = getRazorpay();
    const payment = await rz.payments.fetch(paymentId);
    return {
      success: true,
      payment,
    };
  } catch (error) {
    console.error('Failed to fetch payment details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch payment',
    };
  }
}

/**
 * Create refund
 */
export async function createRefund(paymentId: string, amount?: number) {
  try {
    const rz = getRazorpay();
    const refund = await rz.payments.refund(paymentId, {
      amount: amount, // If not provided, full refund
    });

    return {
      success: true,
      refund,
    };
  } catch (error) {
    console.error('Refund creation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Refund failed',
    };
  }
}
