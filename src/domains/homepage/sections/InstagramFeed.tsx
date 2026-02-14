"use client"

import React, { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation } from 'swiper/modules'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

interface InstagramMedia {
  id: string
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM"
  media_url: string
  permalink: string
  thumbnail_url?: string
  caption?: string
}

export default function InstagramFeed() {
  const [media, setMedia] = useState<InstagramMedia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInstagramMedia = async () => {
      try {
        const response = await fetch('/api/instagram/feed')

        if (!response.ok) {
          const errorData = await response.json()
          console.error('Instagram API Error:', errorData)
          const errorMessage = errorData.message || errorData.error || "Failed to fetch Instagram media"
          throw new Error(errorMessage)
        }

        const result = await response.json()
        setMedia(result.data || [])
      } catch (err) {
        console.error("Error fetching Instagram media:", err)
        setError(err instanceof Error ? err.message : "Failed to load Instagram feed")
      } finally {
        setLoading(false)
      }
    }

    fetchInstagramMedia()
  }, [])

  return (
    <section className="overflow-hidden bg-white py-16 relative">
      <div className="container mx-auto px-4">
        {/* Section Header with Navigation */}
        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-heading text-3xl md:text-4xl tracking-wide text-black w-full text-center md:text-left md:w-auto">
            AS SEEN ON INSTAGRAM
          </h2>

          {/* Custom Navigation Container - Hidden on mobile, visible on desktop */}
          <div className="hidden md:flex gap-2">
            <button className="instagram-prev-btn w-10 h-10 rounded-full border border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button className="instagram-next-btn w-10 h-10 rounded-full border border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12 text-red-600">
            <p>{error}</p>
          </div>
        )}

        {/* Instagram Feed Carousel */}
        {!loading && !error && media.length > 0 && (
          <div className="w-full">
            <Swiper
              modules={[Autoplay, Pagination, Navigation]}
              spaceBetween={12}
              slidesPerView={2}
              loop={true}
              speed={1000}
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true
              }}
              pagination={{
                clickable: true,
                dynamicBullets: true,
                el: '.swiper-pagination'
              }}
              navigation={{
                nextEl: '.instagram-next-btn',
                prevEl: '.instagram-prev-btn',
              }}
              breakpoints={{
                480: {
                  slidesPerView: 2,
                  spaceBetween: 12
                },
                768: {
                  slidesPerView: 3,
                  spaceBetween: 20
                },
                1024: {
                  slidesPerView: 4,
                  spaceBetween: 24
                },
                1280: {
                  slidesPerView: 4,
                  spaceBetween: 24
                },
                1536: {
                  slidesPerView: 5,
                  spaceBetween: 24
                }
              }}
              className="instagram-swiper"
              style={{ paddingBottom: '50px' }}
            >
              {/* Ensure enough slides for loop by duplicating if needed */}
              {(() => {
                // If we have items but fewer than 15 (3x max slidesPerView), duplicate them to ensure seamless loop
                // Max slidesPerView is 5, so we need at least 10 + buffer. 15 is safe.
                let slides = [...media];
                while (slides.length > 0 && slides.length < 15) {
                  slides = [...slides, ...media];
                }
                return slides.map((item, index) => (
                  <SwiperSlide key={`${item.id}-${index}`}>
                    <a
                      href={item.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block relative aspect-[9/16] overflow-hidden bg-gray-100 rounded-lg hover:shadow-xl transition-shadow"
                    >
                      {/* Media Content */}
                      {item.media_type === "VIDEO" ? (
                        <InstagramVideo item={item} />
                      ) : (
                        <Image
                          src={item.media_url}
                          alt={item.caption?.substring(0, 100) || "Instagram post"}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                          className="object-cover"
                          unoptimized
                        />
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center pointer-events-none">
                        <svg
                          className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                      </div>

                      {/* Video Indicator */}
                      {item.media_type === "VIDEO" && (
                        <div className="absolute top-3 right-3 bg-black bg-opacity-70 rounded-full p-2 pointer-events-none">
                          <svg
                            className="w-5 h-5 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                        </div>
                      )}

                      {/* Carousel Indicator */}
                      {item.media_type === "CAROUSEL_ALBUM" && (
                        <div className="absolute top-3 right-3 bg-black bg-opacity-70 rounded-full p-2 pointer-events-none">
                          <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </a>
                  </SwiperSlide>
                ))
              })()}
            </Swiper>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && media.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No Instagram posts available</p>
          </div>
        )}
      </div>

      {/* Custom Swiper Styles */}
      <style jsx global>{`
        .instagram-swiper .swiper-pagination {
          bottom: 0 !important;
          position: absolute;
        }

        .instagram-swiper .swiper-pagination-bullet {
          background: #ccc;
          opacity: 1;
          width: 8px;
          height: 8px;
          margin: 0 4px !important;
        }

        .instagram-swiper .swiper-pagination-bullet-active {
          background: #000;
          width: 10px;
          height: 10px;
        }

        /* Hide default navigation buttons as we use custom ones */
        .instagram-swiper .swiper-button-next,
        .instagram-swiper .swiper-button-prev {
          display: none !important;
        }
      `}</style>
    </section>
  )
}

function InstagramVideo({ item }: { item: InstagramMedia }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hasError, setHasError] = React.useState(false)

  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement) return

    const attemptPlay = async () => {
      try {
        videoElement.muted = true
        videoElement.volume = 0
        await videoElement.play()
      } catch (err) {
        setHasError(true)
      }
    }

    const handleCanPlay = () => {
      attemptPlay()
    }

    const handleError = () => {
      setHasError(true)
    }

    videoElement.addEventListener('canplay', handleCanPlay)
    videoElement.addEventListener('error', handleError)

    // Try to play if already ready
    if (videoElement.readyState >= 3) {
      attemptPlay()
    }

    return () => {
      videoElement.removeEventListener('canplay', handleCanPlay)
      videoElement.removeEventListener('error', handleError)
    }
  }, [item.id, item.media_url])

  // Show thumbnail if video fails to load
  if (hasError && item.thumbnail_url) {
    return (
      <Image
        src={item.thumbnail_url}
        alt={item.caption?.substring(0, 100) || "Instagram post"}
        fill
        className="object-cover"
        unoptimized
      />
    )
  }

  return (
    <video
      ref={videoRef}
      src={item.media_url}
      className="object-cover w-full h-full relative z-10"
      muted
      loop
      playsInline
      preload="metadata"
    />
  )
}


