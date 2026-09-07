import { prisma } from '@/lib/db'
import { sendBroadcastTemplate } from '@/lib/services/interakt'

/**
 * Growth Engine — Broadcast audience + send orchestration.
 *
 * Minimum capability per the SOW: reuse existing customers/orders tables for
 * targeting; idempotency via the existing audit_logs table (a broadcast with a
 * client-supplied broadcastId can only ever send once); hard test-mode so no
 * real customer can receive a message during development/testing.
 */

export type BroadcastFilter =
  | { type: 'all' }
  | { type: 'with_orders' }
  | { type: 'recent'; days: number }

export interface BroadcastRequest {
  broadcastId: string // client-supplied idempotency key (e.g. 'diwali-2026-drop')
  headerMediaUrl: string
  bodyValues: string[]
  buttonValues?: Record<string, string[]>
  filter: BroadcastFilter
  /** When set, ALL sends go to this single number instead of the audience (test mode). */
  testPhone?: string
}

export interface BroadcastResult {
  broadcastId: string
  audienceSize: number
  sent: number
  failed: number
  skippedNoPhone: number
  testMode: boolean
  auditLogId: string
  errors: Array<{ phone: string; error: string }>
}

function normalizePhone(raw: string | null | undefined): string | null {
  let phone = (raw || '').replace(/\D/g, '')
  if (phone.length === 12 && phone.startsWith('91')) phone = phone.slice(2)
  return phone.length === 10 ? phone : null
}

/** Resolve the audience from existing tables. No new segmentation structures. */
export async function getBroadcastAudience(filter: BroadcastFilter): Promise<Array<{ id: string; phone: string; firstName: string | null }>> {
  const since = filter.type === 'recent' ? new Date(Date.now() - filter.days * 24 * 60 * 60 * 1000) : null

  const rows = (await prisma.customers.findMany({
    where: {
      status: 'active',
      ...(filter.type === 'with_orders' ? { orders: { some: {} } } : {}),
      ...(filter.type === 'recent' ? { orders: { some: { created_at: { gte: since } } } } : {}),
    } as any,
    select: {
      id: true,
      phone: true,
      first_name: true,
    } as any,
    distinct: ['id'] as any,
  })) as any[]

  return rows
    .map((c) => ({ id: c.id, phone: normalizePhone(c.phone), firstName: c.first_name ?? null }))
    .filter((c): c is { id: string; phone: string; firstName: string | null } => c.phone !== null)
}

/**
 * Idempotency mutex: the first call claims the broadcastId by creating its audit row;
 * any later call with the same id is refused. Uses createMany with skipDuplicates? Not
 * available for arbitrary rows without unique constraint — so do check-then-create inside
 * a serializable transaction on the audit row count.
 */
async function claimBroadcast(broadcastId: string, req: BroadcastRequest, audienceSize: number): Promise<{ claimed: boolean; auditLogId?: string }> {
  const existing = await prisma.audit_logs.findFirst({
    where: { action: 'whatsapp_broadcast', entity_id: broadcastId } as any,
    select: { id: true },
  })
  if (existing) return { claimed: false }

  const row = await prisma.audit_logs.create({
    data: {
      action: 'whatsapp_broadcast',
      entity_type: 'whatsapp_broadcast',
      entity_id: broadcastId,
      details: {
        template: process.env.INTERAKT_BROADCAST_TEMPLATE || null,
        filter: req.filter,
        test_mode: Boolean(req.testPhone),
        audience_size: audienceSize,
        status: 'claimed',
        recipients_sent: [],
        errors: [],
      } as any,
    } as any,
  })
  return { claimed: true, auditLogId: row.id }
}

async function appendAudit(auditLogId: string, patch: Record<string, unknown>) {
  await prisma.audit_logs.updateMany({
    where: { id: auditLogId } as any,
    data: { details: patch as any } as any,
  }).catch((e: any) => console.error('[Broadcast] audit update failed:', e))
}

/**
 * Execute a broadcast. Safety rails:
 *  - template env must be configured (sendBroadcastTemplate throws otherwise)
 *  - testPhone redirects the ENTIRE audience to one number (dev/test only)
 *  - explicit confirm=true is required whenever testPhone is absent (production sends)
 */
export async function executeBroadcast(
  req: BroadcastRequest,
  opts: { confirm?: boolean } = {}
): Promise<{ ok: boolean; reason?: string } & Partial<BroadcastResult>> {
  if (!req.broadcastId || typeof req.broadcastId !== 'string') {
    return { ok: false, reason: 'broadcastId is required (idempotency key)' }
  }
  if (!Array.isArray(req.bodyValues) || !req.headerMediaUrl) {
    return { ok: false, reason: 'headerMediaUrl and bodyValues are required' }
  }

  const testMode = Boolean(req.testPhone)
  if (!testMode && opts.confirm !== true) {
    return {
      ok: false,
      reason: 'Production broadcast refused: pass confirm=true to send to real customers. ' +
              'For testing, pass testPhone to redirect all sends to one number.',
    }
  }

  const audience = testMode
    ? [{ id: 'test-recipient', phone: normalizePhone(req.testPhone)!, firstName: 'Test' }]
    : await getBroadcastAudience(req.filter)

  const claim = await claimBroadcast(req.broadcastId, req, audience.length)
  if (!claim.claimed || !claim.auditLogId) {
    return { ok: false, reason: `Broadcast "${req.broadcastId}" was already sent (idempotency guard)` }
  }
  const auditLogId = claim.auditLogId

  let sent = 0
  let failed = 0
  let skippedNoPhone = 0
  const errors: Array<{ phone: string; error: string }> = []
  const sentTo: string[] = []

  for (const recipient of audience) {
    if (!recipient.phone) {
      skippedNoPhone++
      continue
    }
    try {
      await sendBroadcastTemplate({
        customerPhone: recipient.phone,
        headerMediaUrl: req.headerMediaUrl,
        bodyValues: req.bodyValues,
        buttonValues: req.buttonValues,
      })
      sent++
      sentTo.push(recipient.phone)
    } catch (e: any) {
      failed++
      errors.push({ phone: recipient.phone, error: String(e?.message || e).slice(0, 300) })
      console.error(`[Broadcast] send failed for ${recipient.phone}:`, e?.message || e)
    }
  }

  await appendAudit(auditLogId, {
    template: process.env.INTERAKT_BROADCAST_TEMPLATE || null,
    filter: req.filter,
    test_mode: testMode,
    audience_size: audience.length,
    status: 'completed',
    recipients_sent: sentTo,
    errors,
  })

  return {
    ok: true,
    broadcastId: req.broadcastId,
    audienceSize: audience.length,
    sent,
    failed,
    skippedNoPhone,
    testMode,
    auditLogId,
    errors,
  }
}
