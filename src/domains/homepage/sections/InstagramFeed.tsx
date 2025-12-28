"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Instagram } from "lucide-react"
import { Product } from "@/domains/product"
import { supabase } from '@/lib/supabase/supabase'

interface ReelData {
  id: string
  thumbnail: string
  videoUrl: string
  products: Product[]
}

export default function InstagramFeed() {
  const [hoveredReel, setHoveredReel] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [reels, setReels] = useState<ReelData[]>([])
  const [loading, setLoading] = useState(true)

  // Instagram reel URLs (external content)
  const reelUrls = [
    { id: "reel-1", videoUrl: "https://www.instagram.com/reel/DQfjJZUEtYg/" },
    { id: "reel-2", videoUrl: "https://www.instagram.com/reel/DO51xkUkvCc/" },
    { id: "reel-3", videoUrl: "https://www.instagram.com/reel/DOvfkPsEhb1/" },
    { id: "reel-4", videoUrl: "https://www.instagram.com/reel/DNS62I6Sm0A/" },
    { id: "reel-5", videoUrl: "https://www.instagram.com/reel/DMK6U6rScjz/" },
  ]

  useEffect(() => {
    async function loadProducts() {
      try {
        const { data: products } = await supabase
          .from('products')
          .select('*')
          .eq('in_stock', true)
          .limit(15)

        // Distribute products across reels
        const reelsData: ReelData[] = reelUrls.map((reel, index) => {
          const startIdx = index * 3
          const reelProducts = (products || []).slice(startIdx, startIdx + 3) as Product[]
          const thumbnail = reelProducts[0]?.images?.[0] || '/images/placeholder-product.jpg'

          return {
            id: reel.id,
            thumbnail,
            videoUrl: reel.videoUrl,
            products: reelProducts,
          }
        })

        setReels(reelsData.filter(r => r.products.length > 0))
      } catch (error) {
        console.error('Failed to fetch products for Instagram feed:', error)
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [])

  // Auto-scroll effect
  useEffect(() => {
    if (!scrollRef.current || isPaused) return

    const scrollContainer = scrollRef.current
    let scrollAmount = 0
    const scrollSpeed = 1

    const scroll = () => {
      if (!isPaused && scrollContainer) {
        scrollAmount += scrollSpeed
        scrollContainer.scrollLeft = scrollAmount

        // Reset when reaching end
        if (scrollAmount >= scrollContainer.scrollWidth - scrollContainer.clientWidth) {
          scrollAmount = 0
        }
      }
    }

    const intervalId = setInterval(scroll, 30)
    return () => clearInterval(intervalId)
  }, [isPaused])

  if (loading) {
    return (
      <section className="overflow-hidden bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-400">Loading Instagram feed...</div>
        </div>
      </section>
    )
  }

  if (reels.length === 0) {
    return null
  }

  return (
    <section className="overflow-hidden bg-white py-16">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-8 flex flex-col items-center justify-center gap-4 text-center">
          <h2 className="font-heading text-3xl md:text-4xl tracking-wide text-black text-center">
            AS SEEN ON INSTAGRAM
          </h2>
          <a
            href="https://www.instagram.com/dude_mensclothing/?hl=en"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xl text-red-600"
          >
            <Instagram className="h-6 w-6" />
            <span className="font-medium">dude_mensclothing</span>
          </a>
          <a
            href="https://www.instagram.com/dude_mensclothing/?hl=en"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-red-600 px-8 py-3 font-medium text-white transition-all hover:bg-red-700"
          >
            FOLLOW US ON INSTAGRAM
          </a>
        </div>

        {/* Auto-scrolling Carousel */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide"
          style={{ scrollBehavior: "smooth" }}
        >
          {reels.map((reel) => (
            <div
              key={reel.id}
              className="relative flex-shrink-0"
              onMouseEnter={() => {
                setHoveredReel(reel.id)
                setIsPaused(true)
              }}
              onMouseLeave={() => {
                setHoveredReel(null)
                setIsPaused(false)
              }}
            >
              {/* Reel Card - 9:16 aspect ratio with embedded video */}
              <div className="relative h-[500px] w-[280px] overflow-hidden rounded-3xl bg-gray-900">
                {hoveredReel === reel.id ? (
                  // Show embedded Instagram video on hover
                  <iframe
                    src={`${reel.videoUrl}embed/captioned/`}
                    className="h-full w-full border-0"
                    allowFullScreen
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  />
                ) : (
                  // Show thumbnail when not hovered
                  <a
                    href={reel.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative block h-full w-full"
                  >
                    <Image
                      src={reel.thumbnail}
                      alt="Instagram Reel"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Play Icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm transition-all group-hover:bg-white/30">
                        <svg
                          className="h-8 w-8 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>

                    {/* Instagram Icon */}
                    <div className="absolute right-3 top-3">
                      <Instagram className="h-6 w-6 text-white drop-shadow-lg" />
                    </div>
                  </a>
                )}
              </div>


            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
