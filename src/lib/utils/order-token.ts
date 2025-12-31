import crypto from 'crypto';

const SECRET_KEY = process.env.ORDER_TOKEN_SECRET || 'fallback-secret-key-change-in-production';

/**
 * Generate a signed token for an order ID
 * This allows public access to order details via QR code while preventing unauthorized access
 */
export function generateOrderToken(orderId: string): string {
    const timestamp = Date.now();
    const payload = `${orderId}:${timestamp}`;
    const signature = crypto
        .createHmac('sha256', SECRET_KEY)
        .update(payload)
        .digest('hex');

    return Buffer.from(`${payload}:${signature}`).toString('base64url');
}

/**
 * Verify and decode an order token
 * Returns the order ID if valid, null if invalid or expired
 */
export function verifyOrderToken(token: string, maxAgeMs: number = 365 * 24 * 60 * 60 * 1000): string | null {
    try {
        const decoded = Buffer.from(token, 'base64url').toString('utf-8');
        const [orderId, timestampStr, signature] = decoded.split(':');

        if (!orderId || !timestampStr || !signature) {
            return null;
        }

        const timestamp = parseInt(timestampStr, 10);
        if (isNaN(timestamp)) {
            return null;
        }

        // Check expiration (default: 1 year)
        if (Date.now() - timestamp > maxAgeMs) {
            return null;
        }

        // Verify signature
        const payload = `${orderId}:${timestamp}`;
        const expectedSignature = crypto
            .createHmac('sha256', SECRET_KEY)
            .update(payload)
            .digest('hex');

        if (signature !== expectedSignature) {
            return null;
        }

        return orderId;
    } catch (error) {
        return null;
    }
}
