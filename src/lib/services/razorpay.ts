import Razorpay from 'razorpay';
import crypto from 'crypto';

// Lazy initialization of Razorpay instance to prevent build errors
let razorpayInstance: Razorpay | null = null;

// Helper to get Razorpay key ID (supports both live and test keys)
export const getRazorpayKeyId = (): string | null => {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() || 
         process.env.RAZORPAY_KEY_ID?.trim() || 
         null;
  
  // Debug log for production troubleshooting (using warn to show in production)
  if (typeof window === 'undefined') {
    console.warn('[Razorpay Config] Key ID available:', !!keyId, keyId ? `(starts with: ${keyId.slice(0, 8)}...)` : '');
  }
  
  return keyId;
};

// Helper to get Razorpay key secret
export const getRazorpayKeySecret = (): string | null => {
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || null;
  
  // Debug log for production troubleshooting (using warn to show in production)
  if (typeof window === 'undefined') {
    console.warn('[Razorpay Config] Key Secret available:', !!keySecret, keySecret ? `(length: ${keySecret.length})` : '');
  }
  
  return keySecret;
};

// Check if Razorpay is properly configured
export const isRazorpayConfigured = (): { configured: boolean; error?: string } => {
  const keyId = getRazorpayKeyId();
  const keySecret = getRazorpayKeySecret();
  
  if (!keyId && !keySecret) {
    return { 
      configured: false, 
      error: 'Razorpay is not configured. Both NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are missing.' 
    };
  }
  
  if (!keyId) {
    return { 
      configured: false, 
      error: 'NEXT_PUBLIC_RAZORPAY_KEY_ID environment variable is missing.' 
    };
  }
  
  if (!keySecret) {
    return { 
      configured: false, 
      error: 'RAZORPAY_KEY_SECRET environment variable is missing.' 
    };
  }
  
  return { configured: true };
};

const getRazorpay = () => {
  if (!razorpayInstance) {
    const keyId = getRazorpayKeyId();
    const keySecret = getRazorpayKeySecret();
    
    if (!keyId || !keySecret) {
      const configCheck = isRazorpayConfigured();
      throw new Error(configCheck.error || 'Razorpay keys missing');
    }

    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
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

    console.warn('[Razorpay Verify] Starting signature verification...');
    console.warn('[Razorpay Verify] Order ID:', razorpay_order_id);
    console.warn('[Razorpay Verify] Payment ID:', razorpay_payment_id?.slice(0, 10) + '...');

    const keySecret = getRazorpayKeySecret();
    
    // Ensure secret is present
    if (!keySecret) {
      console.error('[Razorpay Verify] RAZORPAY_KEY_SECRET missing during verification');
      console.error('[Razorpay Verify] Direct env check - RAZORPAY_KEY_SECRET:', !!process.env.RAZORPAY_KEY_SECRET);
      return false;
    }

    console.warn('[Razorpay Verify] Key secret found, length:', keySecret.length);

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    console.warn('[Razorpay Verify] Signature body constructed');
    
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body.toString())
      .digest('hex');

    console.warn('[Razorpay Verify] Expected signature generated, length:', expectedSignature.length);
    console.warn('[Razorpay Verify] Received signature length:', razorpay_signature?.length);
    
    const isMatch = expectedSignature === razorpay_signature;
    console.warn('[Razorpay Verify] Signatures match:', isMatch);
    
    if (!isMatch) {
      console.warn('[Razorpay Verify] Expected (first 20 chars):', expectedSignature.slice(0, 20) + '...');
      console.warn('[Razorpay Verify] Received (first 20 chars):', razorpay_signature?.slice(0, 20) + '...');
    }

    return isMatch;
  } catch (error) {
    console.error('[Razorpay Verify] Payment verification failed:', error);
    console.error('[Razorpay Verify] Error details:', error instanceof Error ? error.message : String(error));
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
