'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { useAuth } from '@/domains/auth/context'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, ChevronRight, Instagram } from 'lucide-react'

type Phase = 'animating' | 'transitioning' | 'details'

const STATUS_STEPS = [
  { label: 'Order Placed', sub: 'Confirmed & paid' },
  { label: 'Processing', sub: 'Preparing your items' },
  { label: 'Shipped', sub: 'Handed to carrier' },
  { label: 'Delivered', sub: 'Est. 4–7 business days' },
]

// ── Inline style constants (light-mode only) ─────────────────────────────────
const S = {
  page: { background: '#f8fafc', minHeight: '100vh', fontFamily: "'Outfit', -apple-system, sans-serif", color: '#0f172a' } as React.CSSProperties,
  body: { maxWidth: 1280, margin: '0 auto', padding: '24px 16px' } as React.CSSProperties,

  // hero card
  hero: { background: '#111111', borderRadius: 24, padding: '32px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 280, border: '1px solid rgba(255,255,255,0.08)' } as React.CSSProperties,
  heroGrid: { position: 'absolute', inset: 0, backgroundSize: '40px 40px', backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)', pointerEvents: 'none' } as React.CSSProperties,
  badge: { display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '6px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600, marginBottom: 20 } as React.CSSProperties,
  dot: { width: 8, height: 8, borderRadius: '50%', background: '#22c55e' } as React.CSSProperties,
  h1: { margin: '0 0 12px', fontSize: 'clamp(40px, 6vw, 68px)', fontWeight: 900, color: '#ffffff', lineHeight: 0.92, letterSpacing: '-0.03em', textTransform: 'uppercase' } as React.CSSProperties,
  sub: { color: '#6b7280', fontSize: 16, lineHeight: 1.6, maxWidth: 400, margin: 0 } as React.CSSProperties,
  metaRow: { display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-end', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20, marginTop: 24 } as React.CSSProperties,
  metaLabel: { fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 } as React.CSSProperties,
  metaVal: { fontSize: 18, fontWeight: 700, color: '#ffffff', fontFamily: 'monospace' } as React.CSSProperties,
  payBadge: { display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.07)', color: '#9ca3af', padding: '8px 12px', borderRadius: 10, fontSize: 13, fontWeight: 500 } as React.CSSProperties,

  // cards
  card: { background: '#ffffff', borderRadius: 24, padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' } as React.CSSProperties,
  cardTitle: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 17, fontWeight: 700, marginBottom: 20 } as React.CSSProperties,
  addrBox: { background: '#f8fafc', borderRadius: 16, padding: '14px 16px', border: '1px solid #e2e8f0', marginBottom: 12 } as React.CSSProperties,
  shipBadge: { display: 'flex', alignItems: 'center', gap: 10, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 16, padding: '12px 16px', color: '#1d4ed8' } as React.CSSProperties,

  // items
  itemRow: { display: 'flex', alignItems: 'center', gap: 16, padding: '14px', borderRadius: 16, border: '1px solid #e2e8f0', background: '#f8fafc', marginBottom: 12 } as React.CSSProperties,
  thumb: { width: 72, height: 72, borderRadius: 12, overflow: 'hidden', background: '#e5e7eb', flexShrink: 0 } as React.CSSProperties,
  qtyBadge: { display: 'inline-block', background: '#e5e7eb', color: '#374151', fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 6 } as React.CSSProperties,

  // price breakdown
  priceRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: 14, color: '#64748b' } as React.CSSProperties,
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0 0', borderTop: '1px solid #e2e8f0', marginTop: 8, fontSize: 20, fontWeight: 900, color: '#0f172a' } as React.CSSProperties,

  // timeline
  trackBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', marginTop: 24, padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', color: '#0f172a' } as React.CSSProperties,

  // whatsapp card
  waBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', background: '#25D366', color: '#fff', border: 'none', borderRadius: 16, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', textDecoration: 'none', marginTop: 12 } as React.CSSProperties,

  // insta banner
  instaWrap: { background: 'linear-gradient(135deg, #7c3aed, #ec4899)', borderRadius: 24, padding: 4, marginTop: 8 } as React.CSSProperties,
  instaInner: { background: '#ffffff', borderRadius: 21, padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' } as React.CSSProperties,
  instaAvatar: { width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #fbbf24, #ef4444, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 } as React.CSSProperties,
  instaBtn: { display: 'flex', alignItems: 'center', gap: 8, background: '#0f172a', color: '#fff', padding: '12px 20px', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none', whiteSpace: 'nowrap' } as React.CSSProperties,

  // fab
  fab: { position: 'fixed', bottom: 96, right: 24, width: 56, height: 56, background: '#25D366', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', zIndex: 50, textDecoration: 'none' } as React.CSSProperties,

  footer: { borderTop: '1px solid #e2e8f0', padding: '24px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 40 } as React.CSSProperties,
}

export default function OrderConfirmedPage() {
  const params = useParams()
  const { user } = useAuth()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<Phase>('animating')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const guestId = typeof window !== 'undefined' ? localStorage.getItem('dude_guest_session_id') : null
        const { getOrderForConfirmation } = await import('@/lib/actions/orders')
        const result = await getOrderForConfirmation(params.id as string, guestId, user?.id || null)
        if (!result.success || !result.order) { setOrder(null); return }
        const d = result.order as any
        const sa = d.shipping_address
        setOrder({
          id: d.id,
          display_id: d.id?.slice(-8).toUpperCase(),
          status: d.order_status || 'pending',
          payment_method: d.payment_method,
          created_at: d.created_at,
          items: d.order_items?.map((i: any) => ({
            id: i.id,
            title: i.product_variants?.product?.title || 'Product',
            quantity: i.quantity,
            price: i.price,
            thumbnail: i.product_variants?.product?.product_images?.[0]?.image_url || null,
          })) || [],
          subtotal: d.subtotal_amount,
          shipping: d.shipping_amount,
          tax: d.tax_amount,
          discount: d.discount_amount || 0,
          coupon_code: d.coupon_code || null,
          total: d.total_amount,
          shipping_address: sa ? {
            name: `${sa.firstName || ''} ${sa.lastName || ''}`.trim() || sa.name || '',
            line1: sa.address || sa.address_line1 || '',
            city: sa.city || '',
            state: sa.state || '',
            pin: sa.postalCode || sa.pincode || '',
            phone: sa.phone || '',
          } : null,
        })
      } catch (e) {
        console.error(e)
        setOrder(null)
      } finally {
        setLoading(false)
      }
    }
    if (params.id) fetchOrder()
  }, [params.id, user?.id])

  // Cash register SFX
  useEffect(() => {
    if (phase !== 'animating') return
    try {
      const audio = new Audio('/sfx/cash-register-kaching-sound-effect.mp3')
      audio.volume = 0.6
      audioRef.current = audio
      const t = setTimeout(() => {
        audio.play().catch(() => {
          const unlock = () => { audio.play().catch(() => { }); document.removeEventListener('touchstart', unlock); document.removeEventListener('click', unlock) }
          document.addEventListener('touchstart', unlock, { once: true })
          document.addEventListener('click', unlock, { once: true })
        })
      }, 300)
      return () => clearTimeout(t)
    } catch { /* ignore */ }
  }, [phase])

  useEffect(() => {
    if (phase !== 'animating') return
    const t = setTimeout(() => setPhase('transitioning'), 2600)
    return () => clearTimeout(t)
  }, [phase])

  useEffect(() => {
    if (phase !== 'transitioning') return
    const t = setTimeout(() => setPhase('details'), 650)
    return () => clearTimeout(t)
  }, [phase])

  const fmt = (v: any) => `₹${Number(v || 0).toLocaleString('en-IN')}`

  const currentStep = (() => {
    const s = order?.status?.toLowerCase()
    if (s === 'delivered') return 3
    if (s === 'shipped') return 2
    if (s === 'processing' || s === 'confirmed') return 1
    return 0
  })()

  const whatsappUrl = `https://wa.me/919488924935?text=Hi%2C%20I%20need%20help%20with%20my%20order%20%23${order?.display_id || ''}`

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: '#ef4444', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!order) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <Package style={{ width: 48, height: 48, color: '#d1d5db', margin: '0 auto 16px' }} />
          <p style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Order Not Found</p>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>We couldn&apos;t locate this order.</p>
          <Link href="/" style={{ background: '#0f172a', color: '#fff', padding: '12px 24px', borderRadius: 999, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Go Home</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={S.page}>
      {/* ── Lottie overlay ─────────────────────────────── */}
      <AnimatePresence>
        {(phase === 'animating' || phase === 'transitioning') && (
          <motion.div
            style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
              animate={phase === 'transitioning' ? { y: -220, scale: 0.4, opacity: 0 } : { y: 0, scale: 1, opacity: 1 }}
              transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
            >
              <div style={{ width: 180, height: 180 }}>
                <DotLottieReact src="https://lottie.host/6c2ca54f-0c08-46f5-be5e-fc82c21c9615/yUU9qVh0FH.lottie" autoplay loop={false} />
              </div>
              <motion.div style={{ textAlign: 'center' }} animate={phase === 'transitioning' ? { opacity: 0 } : { opacity: 1 }}>
                <p style={{ color: '#fff', fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>YOU'RE ALL SET</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 8 }}>Order #{order.display_id}</p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content ───────────────────────────────── */}
      <AnimatePresence>
        {phase === 'details' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <div style={S.body}>

              {/* ─── GRID ─── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 20 }}>

                {/* BOX 1 — Hero (8 cols) */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                  style={{ gridColumn: 'span 12', ...S.hero }}
                  className="lg-hero"
                >
                  <div style={S.heroGrid} />
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={S.badge}>
                      <span style={{ ...S.dot, animation: 'pulse 1.5s ease-in-out infinite' }} />
                      Payment Successful
                    </div>
                    <h1 style={S.h1}>Order<br />Secured.</h1>
                    <p style={S.sub}>Your haul is locked in. We&apos;re already on it — you&apos;ll get updates every step of the way.</p>
                  </div>
                  <div style={{ ...S.metaRow, position: 'relative', zIndex: 1 }}>
                    <div>
                      <div style={S.metaLabel}>Order Number</div>
                      <div style={S.metaVal}>#{order.display_id}</div>
                    </div>
                    <div>
                      <div style={{ ...S.metaLabel, textAlign: 'right' }}>Order Date</div>
                      <div style={{ ...S.metaVal, fontSize: 16 }}>
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <div style={S.payBadge}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
                      </svg>
                      <span style={{ textTransform: 'capitalize' }}>{order.payment_method?.replace(/_/g, ' ') || 'Online'}</span>
                    </div>
                  </div>
                </motion.div>

                {/* BOX 2 — Shipping Info (4 cols on lg, 12 on sm) */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }}
                  style={{ gridColumn: 'span 12', ...S.card }}
                  className="sm-4col"
                >
                  <div style={S.cardTitle}>
                    <svg width="20" height="20" fill="none" stroke="#ef4444" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                    Shipping Info
                  </div>
                  {order.shipping_address ? (
                    <div style={S.addrBox}>
                      <p style={{ fontWeight: 700, marginBottom: 4, fontSize: 15 }}>{order.shipping_address.name}</p>
                      <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.7, margin: 0 }}>
                        {order.shipping_address.line1}<br />
                        {order.shipping_address.city}, {order.shipping_address.state}<br />
                        {order.shipping_address.pin}
                      </p>
                      {order.shipping_address.phone && (
                        <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 6, marginBottom: 0 }}>{order.shipping_address.phone}</p>
                      )}
                    </div>
                  ) : (
                    <div style={S.addrBox}><p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>No address on file</p></div>
                  )}
                  <div style={S.shipBadge}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>Standard Shipping</div>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>Usually delivers in 4–7 days</div>
                    </div>
                  </div>
                </motion.div>

                {/* BOX 3 — Order Summary (8 cols) */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                  style={{ gridColumn: 'span 12', ...S.card }}
                  className="lg-8col"
                >
                  <div style={S.cardTitle}>
                    <svg width="20" height="20" fill="none" stroke="#ef4444" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                    Order Summary
                  </div>
                  <div>
                    {order.items.length > 0 ? order.items.map((item: any) => (
                      <div key={item.id} style={S.itemRow}>
                        <div style={S.thumb}>
                          {item.thumbnail ? (
                            <Image src={item.thumbnail} alt={item.title} width={72} height={72} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Package style={{ width: 28, height: 28, color: '#9ca3af' }} />
                            </div>
                          )}
                        </div>
                        <div style={{ flexGrow: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                            <span style={S.qtyBadge}>Qty: {item.quantity}</span>
                            <span style={{ fontWeight: 700, fontSize: 15 }}>{fmt(item.price * item.quantity)}</span>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <p style={{ color: '#94a3b8', fontSize: 14 }}>Items are being processed…</p>
                    )}
                  </div>

                  {/* Price breakdown */}
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16, marginTop: 4 }}>
                    {order.subtotal && <div style={S.priceRow}><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>}
                    <div style={S.priceRow}>
                      <span>Shipping</span>
                      {Number(order.shipping) === 0
                        ? <span style={{ color: '#16a34a', fontWeight: 600 }}>Free</span>
                        : <span>{fmt(order.shipping)}</span>}
                    </div>
                    {Number(order.tax) > 0 && <div style={S.priceRow}><span>Tax (GST)</span><span>{fmt(order.tax)}</span></div>}
                    {Number(order.discount) > 0 && (
                      <div style={{ ...S.priceRow, color: '#16a34a' }}>
                        <span>{order.coupon_code ? `Discount (${order.coupon_code})` : 'Discount'}</span>
                        <span style={{ fontWeight: 600 }}>−{fmt(order.discount)}</span>
                      </div>
                    )}
                    <div style={S.totalRow}><span>Total Paid</span><span>{fmt(order.total)}</span></div>
                  </div>
                </motion.div>

                {/* Right column — Status + Help */}
                <div style={{ gridColumn: 'span 12', display: 'flex', flexDirection: 'column', gap: 20 }} className="lg-4col-flex">

                  {/* BOX 4 — Status Tracker */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.20 }}
                    style={{ ...S.card, flexGrow: 1 }}
                  >
                    <div style={S.cardTitle}>
                      <svg width="20" height="20" fill="none" stroke="#ef4444" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                      Status
                    </div>
                    <div style={{ position: 'relative', paddingLeft: 32 }}>
                      {/* Vertical line */}
                      <div style={{ position: 'absolute', left: 10, top: 12, bottom: 12, width: 2, background: '#e2e8f0' }} />
                      {STATUS_STEPS.map((step, idx) => {
                        const done = idx <= currentStep
                        return (
                          <div key={step.label} style={{ position: 'relative', paddingBottom: idx < STATUS_STEPS.length - 1 ? 28 : 0 }}>
                            {/* Circle */}
                            <div style={{
                              position: 'absolute', left: -32, top: 0,
                              width: 24, height: 24, borderRadius: '50%',
                              background: done ? '#22c55e' : '#f8fafc',
                              border: done ? '3px solid #f8fafc' : '2px solid #e2e8f0',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              zIndex: 1, boxShadow: done ? '0 0 0 3px rgba(34,197,94,0.15)' : 'none',
                            }}>
                              {done && (
                                <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth={3} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div style={{ opacity: done ? 1 : 0.45 }}>
                              <div style={{ fontWeight: done ? 700 : 600, fontSize: 14, color: done && idx === currentStep ? '#16a34a' : '#0f172a' }}>{step.label}</div>
                              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{step.sub}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <Link href="/profile?section=track-order" style={S.trackBtn}>
                      TRACK MY ORDER <ChevronRight style={{ width: 16, height: 16 }} />
                    </Link>
                  </motion.div>

                  {/* BOX 5 — Need Help (WhatsApp) */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    style={S.card}
                  >
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Need Help?</div>
                    <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, margin: '0 0 4px' }}>
                      Changed your mind? Need to modify your order?<br />Reach out fast before it ships.
                    </p>
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={S.waBtn}>
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                      </svg>
                      Chat on WhatsApp
                    </a>
                    <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 8 }}>+91 94889 24935 · support@dudemw.com</p>
                  </motion.div>
                </div>

                {/* Instagram banner (full width) */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.30 }}
                  style={{ gridColumn: 'span 12' }}
                >
                  <div style={S.instaWrap}>
                    <div style={S.instaInner}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={S.instaAvatar}>
                          <Instagram style={{ width: 22, height: 22 }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Join the Community</div>
                          <div style={{ color: '#64748b', fontSize: 14 }}>Tag us in your fits for a repost + first dibs on exclusive drops.</div>
                        </div>
                      </div>
                      <a href="https://instagram.com/dude_mensclothing" target="_blank" rel="noopener noreferrer" style={S.instaBtn}>
                        <Instagram style={{ width: 16, height: 16 }} />
                        @dude_mensclothing
                      </a>
                    </div>
                  </div>
                </motion.div>

              </div>
            </div>

            {/* WhatsApp FAB */}
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={S.fab} aria-label="WhatsApp Support">
              <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            </a>

            {/* Footer */}
            <div style={S.footer}>© {new Date().getFullYear()} Dude Menswear. All rights reserved.</div>

            {/* Responsive grid styles */}
            <style>{`
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.4; }
              }
              @media (min-width: 768px) {
                .sm-4col { grid-column: span 4 !important; }
                .lg-hero  { grid-column: span 8 !important; }
                .lg-8col  { grid-column: span 8 !important; }
                .lg-4col-flex { grid-column: span 4 !important; }
              }
            `}</style>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}