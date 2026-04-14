'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

// Lottie tick animation data (inlined to avoid resolveJsonModule requirement)
const successTickAnimation = {"v":"5.6.3","fr":29.9700012207031,"ip":0,"op":60.0000024438501,"w":100,"h":100,"nm":"Comp 1","ddd":0,"assets":[],"layers":[{"ddd":0,"ind":1,"ty":4,"nm":"Tick","sr":1,"ks":{"o":{"a":1,"k":[{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.333],"y":[0]},"t":14,"s":[0]},{"t":16.0000006516934,"s":[100]}],"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":0,"k":[50,50,0],"ix":2},"a":{"a":0,"k":[21.5,16.5,0],"ix":1},"s":{"a":0,"k":[100,100,100],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ix":1,"ks":{"a":1,"k":[{"i":{"x":0.667,"y":1},"o":{"x":0.333,"y":0},"t":16,"s":[{"i":[[0.966,0.967],[0,0],[0.966,-0.966],[-0.966,-0.967],[0,0],[-0.966,0.967],[0,0],[0.967,0.966],[0.967,-0.966],[0,0]],"o":[[0,0],[-0.966,-0.966],[-0.966,0.967],[0,0],[0.966,0.967],[0,0],[0.967,-0.966],[-0.967,-0.966],[0,0],[-0.966,0.967]],"v":[[-18.876,0.062],[-16.751,0.999],[-20.251,0.999],[-20.313,1.249],[-20.376,0.999],[-20.001,0.749],[-19.188,0.499],[-18.563,0.437],[-18.813,0.124],[-18.688,-0.126]],"c":true}]},{"i":{"x":0.667,"y":1},"o":{"x":0.333,"y":0},"t":20,"s":[{"i":[[0.966,0.967],[0,0],[0.966,-0.966],[-0.966,-0.967],[0,0],[-0.966,0.967],[0,0],[0.967,0.966],[0.967,-0.966],[0,0]],"o":[[0,0],[-0.966,-0.966],[-0.966,0.967],[0,0],[0.966,0.967],[0,0],[0.967,-0.966],[-0.967,-0.966],[0,0],[-0.966,0.967]],"v":[[-10.626,6.937],[-16.751,0.999],[-20.251,0.999],[-20.251,4.499],[-9.751,14.999],[-6.251,14.999],[-6.251,13.874],[-6.251,10.374],[-7.188,9.937],[-8.126,9.187]],"c":true}]},{"t":28.0000011404634,"s":[{"i":[[0.966,0.967],[0,0],[0.966,-0.966],[-0.966,-0.967],[0,0],[-0.966,0.967],[0,0],[0.967,0.966],[0.967,-0.966],[0,0]],"o":[[0,0],[-0.966,-0.966],[-0.966,0.967],[0,0],[0.966,0.967],[0,0],[0.967,-0.966],[-0.967,-0.966],[0,0],[-0.966,0.967]],"v":[[-9.751,7.999],[-16.751,0.999],[-20.251,0.999],[-20.251,4.499],[-9.751,14.999],[-6.251,14.999],[20.249,-11.501],[20.249,-15.001],[16.749,-15.001],[-6.251,7.999]],"c":true}]}],"ix":2},"nm":"Path 1","mn":"ADBE Vector Shape - Group","hd":false},{"ty":"fl","c":{"a":0,"k":[1,1,1,1],"ix":4},"o":{"a":0,"k":100,"ix":5},"r":1,"bm":0,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill","hd":false},{"ty":"tr","p":{"a":0,"k":[21.467,16.217],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}],"ip":14.0000005702317,"op":314.000012789482,"st":14.0000005702317,"bm":0},{"ddd":0,"ind":2,"ty":4,"nm":"Charkr","sr":1,"ks":{"o":{"a":0,"k":100,"ix":11},"r":{"a":1,"k":[{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.333],"y":[0]},"t":0,"s":[-64]},{"t":37.0000015070409,"s":[0]}],"ix":10},"p":{"a":0,"k":[50,50,0],"ix":2},"a":{"a":0,"k":[40.5,40.5,0],"ix":1},"s":{"a":1,"k":[{"i":{"x":[0.16,0.16,0.667],"y":[0.952,0.952,1]},"o":{"x":[0.167,0.167,0.167],"y":[0.167,0.167,18.333]},"t":1,"s":[0,0,100]},{"i":{"x":[0.587,0.587,0.667],"y":[-0.285,-0.285,1]},"o":{"x":[0.167,0.167,0.167],"y":[0.167,0.167,-1.667]},"t":9,"s":[110,110,100]},{"t":14.0000005702317,"s":[100,100,100]}],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ix":1,"ks":{"a":0,"k":{"i":[[2.132,1.566],[0.187,0.741],[-0.708,1.25],[1.245,2.146],[2.723,0.289],[1.264,0.629],[0.005,1.415],[2.16,1.258],[2.49,-1.099],[1.435,-0.079],[0.901,1.231],[2.567,0],[1.569,-2.129],[0.741,-0.192],[1.253,0.701],[2.139,-1.239],[0.306,-2.741],[0.627,-1.265],[1.405,-0.008],[1.255,-2.16],[-1.099,-2.494],[-0.077,-1.439],[1.23,-0.897],[0,-2.567],[-2.132,-1.565],[-0.188,-0.741],[0.708,-1.25],[-1.245,-2.147],[-2.724,-0.288],[-1.263,-0.628],[-0.006,-1.416],[-2.16,-1.259],[-2.494,1.086],[-1.442,0.079],[-0.901,-1.231],[-2.566,0],[-1.569,2.129],[-0.741,0.191],[-1.252,-0.707],[-2.144,1.235],[-0.306,2.727],[-0.627,1.264],[-1.41,0.009],[-1.255,2.16],[1.082,2.494],[0.069,1.444],[-1.232,0.899],[0,2.564]],"o":[[-1.231,-0.907],[0.078,-1.435],[1.085,-2.491],[-1.246,-2.146],[-1.411,-0.01],[-0.63,-1.269],[-0.306,-2.724],[-2.159,-1.26],[-1.251,0.707],[-0.75,-0.201],[-1.581,-2.13],[-2.567,0],[-0.911,1.234],[-1.433,-0.087],[-2.504,-1.103],[-2.139,1.238],[-0.01,1.411],[-1.261,0.62],[-2.727,0.306],[-1.261,0.62],[-2.727,0.306],[-1.256,2.16],[0.71,1.253],[-0.202,0.751],[-2.131,1.566],[0,2.567],[1.231,0.908],[-0.079,1.434],[-1.085,2.49],[1.245,2.146],[1.411,0.01],[0.63,1.27],[0.306,2.724],[2.16,1.26],[1.263,-0.7],[0.751,0.202],[1.568,2.13],[2.567,0],[0.911,-1.234],[1.434,0.081],[2.489,1.085],[2.143,-1.234],[0.01,-1.412],[1.263,-0.625],[2.727,-0.306],[1.256,-2.16],[-0.708,-1.26],[0.2,-0.751],[2.129,-1.569],[0,-2.564]],"v":[[35.45,-5.912],[32.48,-8.694],[33.676,-12.774],[34.636,-19.992],[27.836,-22.775],[23.77,-23.745],[22.804,-27.825],[20.02,-34.625],[12.787,-33.683],[8.703,-32.487],[5.921,-35.457],[-0.002,-40],[-5.915,-35.457],[-8.698,-32.483],[-12.781,-33.68],[-20.005,-34.643],[-22.808,-27.826],[-23.775,-23.759],[-27.827,-22.806],[-34.63,-20.024],[-33.684,-12.788],[-32.487,-8.694],[-35.457,-5.912],[-40,0.002],[-35.454,5.915],[-32.484,8.698],[-33.68,12.778],[-34.64,19.996],[-27.84,22.778],[-23.775,23.748],[-22.808,27.829],[-20.025,34.629],[-12.808,33.669],[-8.697,32.487],[-5.914,35.457],[-0.002,40],[5.911,35.457],[8.694,32.484],[12.777,33.68],[19.99,34.643],[22.794,27.84],[23.761,23.774],[27.823,22.81],[34.626,20.027],[33.666,12.809],[32.484,8.698],[35.454,5.915],[40,0.002]],"c":true},"ix":2},"nm":"Path 1","mn":"ADBE Vector Shape - Group","hd":false},{"ty":"fl","c":{"a":0,"k":[0,0.788000009574,0.294000004787,1],"ix":4},"o":{"a":0,"k":100,"ix":5},"r":1,"bm":0,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill","hd":false},{"ty":"tr","p":{"a":0,"k":[40.25,40.25],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":4,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}],"ip":0,"op":300.00001221925,"st":0,"bm":0}],"markers":[]}

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

  // insta banner
  instaWrap: { background: 'linear-gradient(135deg, #7c3aed, #ec4899)', borderRadius: 24, padding: 4, marginTop: 8 } as React.CSSProperties,
  instaInner: { background: '#ffffff', borderRadius: 21, padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' } as React.CSSProperties,
  instaAvatar: { width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #fbbf24, #ef4444, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 } as React.CSSProperties,
  instaBtn: { display: 'flex', alignItems: 'center', gap: 8, background: '#0f172a', color: '#fff', padding: '12px 20px', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none', whiteSpace: 'nowrap' } as React.CSSProperties,

  footer: { borderTop: '1px solid #e2e8f0', padding: '24px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 40 } as React.CSSProperties,
}

export default function OrderConfirmedPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<Phase>('animating')
  const [shippingInfo, setShippingInfo] = useState<{ optionName: string; estimatedDelivery: string } | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const trackedRef = useRef(false)

  // Track Meta Pixel and GA4 Purchase Events
  useEffect(() => {
    if (order && order.subtotal && !trackedRef.current) {
      const firePixel = () => {
        if (typeof window !== 'undefined') {
          // Track subtotal minus discounts, excluding shipping and taxes to ensure accurate ROAS
          const netValue = Number(order.subtotal) - Number(order.discount || 0);

          if (typeof (window as any).fbq === 'function') {
            try {
              (window as any).fbq('track', 'Purchase', {
                value: netValue > 0 ? netValue : Number(order.subtotal),
                currency: 'INR',
                content_ids: order.items?.map((i: any) => String(i.id)) || [],
                content_type: 'product',
                num_items: order.items?.reduce((s: number, i: any) => s + (i.quantity || 1), 0) || 1,
                transaction_id: order.id, // Adding transaction_id for CAPI deduplication
                order_id: order.display_id,
              })
            } catch (err) {
              console.error('Meta Pixel tracking error:', err)
            }
          }

          if (typeof (window as any).gtag === 'function') {
            try {
              (window as any).gtag('event', 'purchase', {
                transaction_id: order.id,
                value: netValue > 0 ? netValue : Number(order.subtotal),
                tax: Number(order.tax || 0),
                shipping: Number(order.shipping || 0),
                currency: 'INR',
                coupon: order.coupon_code || '',
                items: order.items?.map((item: any, index: number) => ({
                  item_id: item.id,
                  item_name: item.title,
                  price: Number(item.price || 0),
                  quantity: item.quantity,
                  index: index
                })) || []
              })
            } catch (err) {
              console.error('GA4 tracking error:', err)
            }
          }

          trackedRef.current = true
        }
      }

      // Try immediately
      firePixel()

      // If async scripts are loading, poll briefly
      if (!trackedRef.current) {
        let attempts = 0
        const interval = setInterval(() => {
          attempts++
          firePixel()
          if (trackedRef.current || attempts >= 30) {
            clearInterval(interval)
          }
        }, 100)
        return () => clearInterval(interval)
      }
    }
  }, [order])

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        // Prefer guest_id from URL query param (?g=) — passed directly from checkout
        // Falls back to cookie for direct URL visits
        const urlGuestId = searchParams.get('g')
        const cookieGuestId = typeof window !== 'undefined'
          ? document.cookie.split('; ').find(r => r.startsWith('guest_id='))?.split('=')?.[1] ?? null
          : null
        const guestId = urlGuestId || cookieGuestId
        const { getOrderForConfirmation } = await import('@/lib/actions/orders')
        const result = await getOrderForConfirmation(params.id as string, guestId, user?.id || null)
        if (!result.success || !result.order) { setOrder(null); return }
        const d = result.order as any
        const sa = d.shipping_address
        const orderItems = d.order_items || []
        const totalQty = orderItems.reduce((s: number, i: any) => s + (i.quantity || 1), 0)
        const postalCode = sa?.postalCode || sa?.pincode || ''

        setOrder({
          id: d.id,
          display_id: d.id?.slice(-8).toUpperCase(),
          status: d.order_status || 'pending',
          payment_method: d.payment_method,
          created_at: d.created_at,
          shipping_method: d.shipping_method || null,
          items: orderItems.map((i: any) => ({
            id: i.id,
            title: i.product_variants?.product?.title || 'Product',
            quantity: i.quantity,
            price: i.price,
            thumbnail: i.product_variants?.product?.product_images?.[0]?.image_url || null,
          })),
          subtotal: d.subtotal_amount,
          shipping: d.shipping_amount,
          tax: d.tax_amount,
          discount: d.discount_amount || 0,
          coupon_code: d.coupon_code || null,
          total: d.total_amount,
          shipping_address: sa ? {
            name: `${sa.firstName || ''} ${sa.lastName || ''}`.trim() || sa.name || '',
            line1: sa.address || sa.address_line1 || '',
            line2: sa.address2 || '',
            city: sa.city || '',
            state: sa.state || '',
            pin: sa.postalCode || sa.pincode || '',
            phone: sa.phone || '',
          } : null,
        })

        // Fetch live shipping option name + estimated delivery from the same API checkout uses
        if (postalCode && totalQty > 0) {
          try {
            const shRes = await fetch('/api/shipping/calculate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ postalCode, totalQuantity: totalQty }),
            })
            const shData = await shRes.json()
            if (shData.success) {
              setShippingInfo({
                optionName: shData.optionName || d.shipping_method || 'Standard Shipping',
                estimatedDelivery: shData.estimatedDelivery || '',
              })
            } else {
              // Fall back to stored method name
              setShippingInfo({ optionName: d.shipping_method || 'Standard Shipping', estimatedDelivery: '' })
            }
          } catch {
            setShippingInfo({ optionName: d.shipping_method || 'Standard Shipping', estimatedDelivery: '' })
          }
        } else {
          setShippingInfo({ optionName: d.shipping_method || 'Standard Shipping', estimatedDelivery: '' })
        }
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
                <Lottie animationData={successTickAnimation} loop={false} autoplay style={{ width: '100%', height: '100%' }} />
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
                        {order.shipping_address.line2 && (<>{order.shipping_address.line2}<br /></>)}
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
                      <div style={{ fontWeight: 700, fontSize: 14 }}>
                        {shippingInfo?.optionName || order.shipping_method || 'Standard Shipping'}
                      </div>
                      {shippingInfo?.estimatedDelivery && (
                        <div style={{ fontSize: 12, opacity: 0.7 }}>{shippingInfo.estimatedDelivery}</div>
                      )}
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

                {/* Shop More CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                  style={{ gridColumn: 'span 12', display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', paddingBottom: 8 }}
                >
                  <Link
                    href="/products"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      background: '#0f172a', color: '#fff',
                      padding: '14px 32px', borderRadius: 999,
                      fontWeight: 700, fontSize: 14, textDecoration: 'none',
                      letterSpacing: '0.03em',
                    }}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                    Shop More
                  </Link>
                  <Link
                    href="/"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      background: '#fff', color: '#0f172a',
                      border: '2px solid #e2e8f0',
                      padding: '14px 32px', borderRadius: 999,
                      fontWeight: 700, fontSize: 14, textDecoration: 'none',
                      letterSpacing: '0.03em',
                    }}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                    Back to Home
                  </Link>
                </motion.div>
            </div>



            </div>{/* /S.body */}

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