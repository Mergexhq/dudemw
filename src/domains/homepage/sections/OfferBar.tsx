"use client"

import { useState, useEffect } from "react"
import {
  Flame,
  Zap,
  Target,
  Sparkles,
  Rocket,
  BadgeCheck,
  Gift,
  Star,
  Truck,
  Shield,
  Award,
  Bell,
  Calendar,
  Clock,
  CreditCard,
  DollarSign,
  Gem,
  Heart,
  Megaphone,
  Package,
  PartyPopper,
  Percent,
  Rainbow,
  ShoppingBag,
  Tag,
  TrendingUp,
  Trophy,
  LucideIcon
} from "lucide-react"
import { createClient } from '@/lib/supabase/client'
import { useOfferBar } from '@/contexts/OfferBarContext'

// Icon mapping for dynamic icon selection (using kebab-case to match admin)
const iconMap: Record<string, LucideIcon> = {
  "flame": Flame,
  "zap": Zap,
  "target": Target,
  "sparkles": Sparkles,
  "rocket": Rocket,
  "badge-check": BadgeCheck,
  "gift": Gift,
  "star": Star,
  "truck": Truck,
  "shield": Shield,
  "award": Award,
  "bell": Bell,
  "calendar": Calendar,
  "clock": Clock,
  "credit-card": CreditCard,
  "dollar-sign": DollarSign,
  "gem": Gem,
  "heart": Heart,
  "megaphone": Megaphone,
  "package": Package,
  "party-popper": PartyPopper,
  "percent": Percent,
  "rainbow": Rainbow,
  "shopping-bag": ShoppingBag,
  "tag": Tag,
  "trending-up": TrendingUp,
  "trophy": Trophy
}

interface MarqueeItem {
  id: string
  text: string
  icon?: string
}



export default function OfferBar() {
  const [isVisible, setIsVisible] = useState(true)
  const [offers, setOffers] = useState<MarqueeItem[]>([])
  const [loading, setLoading] = useState(true)
  const { setIsOfferBarVisible } = useOfferBar()

  useEffect(() => {
    const fetchMarqueeBanner = async () => {
      try {
        const supabase = createClient()
        const { data: banner } = await supabase
          .from('banners')
          .select('marquee_data')
          .eq('placement', 'top-marquee-banner')
          .eq('status', 'active')
          .single()

        if (banner?.marquee_data) {
          // Parse marquee_data (could be string or already an array)
          const marqueeItems = typeof banner.marquee_data === 'string'
            ? JSON.parse(banner.marquee_data)
            : banner.marquee_data

          if (marqueeItems && marqueeItems.length > 0) {
            setOffers(marqueeItems)
            setIsOfferBarVisible(true)
          } else {
            // No data or empty data
            setIsOfferBarVisible(false)
          }
        } else {
          // No active banner found
          setIsOfferBarVisible(false)
        }
      } catch (error) {
        console.error('Failed to fetch marquee banner:', error)
        // Hide on error
        setIsOfferBarVisible(false)
      } finally {
        setLoading(false)
      }
    }
    fetchMarqueeBanner()
  }, [setIsOfferBarVisible])

  // Quadruple offers for truly seamless continuous loop
  const duplicatedOffers = [...offers, ...offers, ...offers, ...offers]

  if (!isVisible || loading || offers.length === 0) return null

  return (
    <>
      <div className="fixed top-0 z-50 w-full overflow-hidden bg-black py-1.5 text-white shadow-md">
        <div className="relative flex items-center">
          {/* Marquee Container */}
          <div className="flex animate-marquee items-center gap-8 whitespace-nowrap">
            {duplicatedOffers.map((offer, idx) => {
              const Icon = iconMap[offer.icon || 'flame'] || Flame
              return (
                <span
                  key={`${offer.id}-${idx}`}
                  className="flex items-center gap-2 font-body text-xs font-medium tracking-wide md:text-sm"
                >
                  <Icon className="h-3 w-3 md:h-4 md:w-4" />
                  {offer.text}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      {/* Spacer to prevent content jump */}
      <div className="h-7" />

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-marquee {
          animation: marquee 40s linear infinite;
        }

        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </>
  )
}
