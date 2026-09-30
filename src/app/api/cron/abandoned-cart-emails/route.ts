import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Resend } from 'resend'
import { sendCheckoutRecovery, isRecoveryTemplateConfigured } from '@/lib/services/interakt'

const resend = new Resend(process.env.RESEND_API_KEY)

// Process at most this many orders per cron run to stay well within timeouts
const BATCH_LIMIT = 10

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Cron] Unauthorized access to abandoned-cart-emails')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Cron] Starting abandoned cart recovery job...')

    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const baseWhere = {
      payment_method: 'razorpay',
      payment_status: 'pending',
      order_status: 'pending',
      created_at: { lt: threeHoursAgo, gt: twentyFourHoursAgo },
    }

    // Phase 1: Email recovery (independent guard: abandoned_cart_email_sent_at)
    const emailCandidates = await (prisma.orders as any).findMany({
      where: {
        ...baseWhere,
        abandoned_cart_email_sent_at: null,
        customer_email_snapshot: { not: null },
      },
      select: {
        id: true,
        customer_email_snapshot: true,
        customer_name_snapshot: true,
        total_amount: true,
        order_items: {
          include: {
            product_variants: { include: { product: { select: { id: true, title: true, slug: true } } } },
          },
        },
      },
      take: BATCH_LIMIT,
    })

    const emailsSent: string[] = []
    const emailsFailed: string[] = []

    for (const order of emailCandidates) {
      try {
        const checkoutUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?resume=${order.id}`
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@dudemw.com',
          to: order.customer_email_snapshot,
          subject: 'You left items in your cart!',
          html: generateAbandonedCartEmail(order, checkoutUrl),
        })
        await (prisma.orders as any).update({
          where: { id: order.id },
          data: { abandoned_cart_email_sent_at: new Date() },
        })
        emailsSent.push(order.id)
        console.log(`[Cron] Email sent to ${order.customer_email_snapshot}`)
      } catch (emailError: any) {
        console.error(`[Cron] Email failed for ${order.id}:`, emailError)
        emailsFailed.push(order.id)
      }
    }

    console.log(`[Cron] Email phase: ${emailsSent.length} sent, ${emailsFailed.length} failed`)

    // Phase 2: WhatsApp recovery (SEPARATE query, own guard: abandoned_cart_whatsapp_sent_at)
    // A sent email NEVER blocks WhatsApp and vice versa.
    let whatsappSent = 0
    let whatsappFailed = 0
    let whatsappSkippedNoPhone = 0

    if (!isRecoveryTemplateConfigured()) {
      console.warn('[Cron] INTERAKT_RECOVERY_TEMPLATE not set - WhatsApp recovery skipped')
    } else {
      const whatsappCandidates = await (prisma.orders as any).findMany({
        where: {
          ...baseWhere,
          abandoned_cart_whatsapp_sent_at: null,
          customer_phone_snapshot: { not: null },
        },
        select: {
          id: true,
          customer_phone_snapshot: true,
          customer_name_snapshot: true,
          total_amount: true,
        },
        take: BATCH_LIMIT,
      })

      for (const order of whatsappCandidates) {
        try {
          let customerPhone = String(order.customer_phone_snapshot || '').replace(/\D/g, '')
          if (customerPhone.length === 12 && customerPhone.startsWith('91')) {
            customerPhone = customerPhone.slice(2)
          }
          if (customerPhone.length !== 10) {
            whatsappSkippedNoPhone++
            console.warn(`[Cron] Invalid phone for order ${order.id}: ${order.customer_phone_snapshot}`)
            continue
          }

          const checkoutUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?resume=${order.id}`

          // Atomic mutex - only one cron run can claim an order
          const claim = await (prisma.orders as any).updateMany({
            where: { id: order.id, abandoned_cart_whatsapp_sent_at: null },
            data: { abandoned_cart_whatsapp_sent_at: new Date() },
          })

          if ((claim?.count ?? 0) === 0) {
            console.log(`[Cron] WhatsApp already claimed for ${order.id}`)
            continue
          }

          try {
            await sendCheckoutRecovery({
              customerPhone,
              customerName: order.customer_name_snapshot || 'Customer',
              orderId: order.id,
              totalAmount: Number(order.total_amount),
              resumeUrl: checkoutUrl,
            })
            whatsappSent++
            console.log(`[Cron] WhatsApp sent for ${order.id} -> +91${customerPhone}`)
          } catch (waError: any) {
            whatsappFailed++
            console.error(`[Cron] WhatsApp failed for ${order.id} - rolling back:`, waError.message)
            await (prisma.orders as any).updateMany({
              where: { id: order.id },
              data: { abandoned_cart_whatsapp_sent_at: null },
            }).catch((e: any) => console.error(`[Cron] Rollback failed for ${order.id}:`, e))
          }
        } catch (orderError: any) {
          whatsappFailed++
          console.error(`[Cron] WhatsApp error for ${order.id}:`, orderError)
        }
      }

      console.log(`[Cron] WhatsApp phase: ${whatsappSent} sent, ${whatsappFailed} failed, ${whatsappSkippedNoPhone} skipped`)
    }

    return NextResponse.json({
      success: true,
      batchLimit: BATCH_LIMIT,
      email: { sent: emailsSent.length, failed: emailsFailed.length, orderIds: emailsSent },
      whatsapp: {
        sent: whatsappSent,
        failed: whatsappFailed,
        skippedNoPhone: whatsappSkippedNoPhone,
        configured: isRecoveryTemplateConfigured(),
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[Cron] Unexpected error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

function generateAbandonedCartEmail(order: any, checkoutUrl: string): string {
  const itemsList = order.order_items
    ?.map((item: any) => {
      const productName = item.product_variants?.product?.title || 'Product'
      const variantName = item.product_variants?.name || ''
      return `<li>${productName}${variantName ? ` (${variantName})` : ''} - Qty: ${item.quantity}</li>`
    })
    .join('') || ''

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You left items in your cart</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">You left items in your cart!</h1>
  </div>
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Hi ${order.customer_name_snapshot || 'there'},</p>
    <p style="font-size: 16px;">We noticed you left some items in your cart. We have saved them for you!</p>
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #667eea;">Your Cart Items:</h3>
      <ul style="list-style: none; padding: 0;">${itemsList}</ul>
      <p style="font-size: 18px; font-weight: bold; color: #667eea; margin: 15px 0;">Total: Rs.${order.total_amount}</p>
    </div>
    <p style="font-size: 14px; color: #666;"><strong>Hurry!</strong> Your cart will expire in less than 24 hours.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${checkoutUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: bold; display: inline-block;">
        Complete Your Purchase
      </a>
    </div>
    <p style="font-size: 14px; color: #666; text-align: center;">Need help? Contact us at ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@dudemw.com'}</p>
  </div>
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>Dude Men's Wears. All rights reserved.</p>
  </div>
</body>
</html>`
}
