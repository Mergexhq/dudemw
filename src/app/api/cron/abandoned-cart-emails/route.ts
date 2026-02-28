import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Cron] Unauthorized access to abandoned-cart-emails')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Cron] Starting abandoned cart email job...')

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const abandonedOrders = await prisma.orders.findMany({
      where: {
        payment_method: 'razorpay',
        payment_status: 'pending',
        order_status: 'pending',
        created_at: { lt: oneHourAgo, gt: twentyFourHoursAgo },
        abandoned_cart_email_sent_at: null,
      } as any,
      include: {
        order_items: {
          include: {
            product_variants: { include: { products: { select: { id: true, title: true, slug: true } } } },
          },
        },
      } as any,
      select: {
        id: true,
        razorpay_order_id: true,
        customer_email_snapshot: true,
        customer_name_snapshot: true,
        total_amount: true,
        created_at: true,
      } as any,
    }) as any[]

    const emailsSent: string[] = []
    const emailsFailed: string[] = []

    for (const order of abandonedOrders) {
      try {
        if (!order.customer_email_snapshot) {
          console.warn(`[Cron] No email for order ${order.id}, skipping`)
          continue
        }

        const checkoutUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?resume=${order.id}`
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@dudemw.com',
          to: order.customer_email_snapshot,
          subject: '🛒 You left items in your cart!',
          html: generateAbandonedCartEmail(order, checkoutUrl),
        })

        await prisma.orders.update({
          where: { id: order.id },
          data: { abandoned_cart_email_sent_at: new Date() } as any,
        })

        emailsSent.push(order.id)
        console.log(`[Cron] Sent abandoned cart email to ${order.customer_email_snapshot}`)
      } catch (emailError: any) {
        console.error(`[Cron] Failed to send email for order ${order.id}:`, emailError)
        emailsFailed.push(order.id)
      }
    }

    console.log(`[Cron] Sent ${emailsSent.length} abandoned cart emails, ${emailsFailed.length} failed`)
    return NextResponse.json({ success: true, sent: emailsSent.length, failed: emailsFailed.length, emailsSent, emailsFailed, timestamp: new Date().toISOString() })
  } catch (error: any) {
    console.error('[Cron] Unexpected error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

function generateAbandonedCartEmail(order: any, checkoutUrl: string): string {
  const itemsList = order.order_items
    ?.map((item: any) => {
      const productName = item.product_variants?.products?.title || 'Product'
      const variantName = item.product_variants?.name || ''
      return `<li>${productName} ${variantName ? `(${variantName})` : ''} - Qty: ${item.quantity}</li>`
    })
    .join('') || ''

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You left items in your cart</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">🛒 You left items in your cart!</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hi ${order.customer_name_snapshot || 'there'},</p>
        <p style="font-size: 16px;">We noticed you left some items in your cart. Don't worry, we've saved them for you!</p>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #667eea;">Your Cart Items:</h3>
          <ul style="list-style: none; padding: 0;">${itemsList}</ul>
          <p style="font-size: 18px; font-weight: bold; color: #667eea; margin: 15px 0;">Total: ₹${order.total_amount}</p>
        </div>
        <p style="font-size: 14px; color: #666;">⏰ <strong>Hurry!</strong> Your cart will expire in less than 24 hours.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${checkoutUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: bold; display: inline-block;">
            Complete Your Purchase →
          </a>
        </div>
        <p style="font-size: 14px; color: #666; text-align: center;">Need help? Contact us at ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@dudemw.com'}</p>
      </div>
      <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Dude Men's Wears. All rights reserved.</p>
      </div>
    </body>
    </html>
  `
}
