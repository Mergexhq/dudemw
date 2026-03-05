'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { getProductImage, PLACEHOLDER_IMAGE } from '@/domains/product/utils/getProductImage'

interface ProductImageGalleryProps {
  images: string[]
  mainImage: string
  title: string
  className?: string
}

export default function ProductImageGallery({
  images,
  mainImage,
  title,
  className = ''
}: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0)

  return (
    <div className={className}>
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-lg">
        <Image
          src={getProductImage(null, images.length > 0 ? [images[selectedImage]] : [mainImage])}
          fill
          alt={title}
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover object-center"
          priority
        />

        {/* Thumbnail Images - Bottom Overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {images.slice(0, 4).map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === idx
                  ? 'border-white scale-105'
                  : 'border-white/40'
                  }`}
              >
                <Image
                  src={getProductImage(null, [img])}
                  fill
                  alt={`View ${idx + 1}`}
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
