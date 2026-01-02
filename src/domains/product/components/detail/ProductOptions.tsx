'use client'

import { Star } from 'lucide-react'

interface ProductColor {
  name: string
  hex: string
  image: string
}

interface ProductOptionsProps {
  sizes: string[]
  colors: ProductColor[]
  rating?: number
  reviews?: number
  selectedSize: string
  selectedColor: ProductColor
  onSizeSelect: (size: string) => void
  onColorSelect: (color: ProductColor) => void
  variant?: 'mobile' | 'desktop'
}

export default function ProductOptions({
  sizes,
  colors,
  rating,
  reviews,
  selectedSize,
  selectedColor,
  onSizeSelect,
  onColorSelect,
  variant = 'mobile'
}: ProductOptionsProps) {
  const isMobile = variant === 'mobile'

  return (
    <>
      {/* Size Selection - Only show if sizes exist */}
      {sizes && sizes.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
            SIZE
          </h3>
          <div className="flex gap-2 flex-wrap">
            {sizes.map((size) => (
              <button
                key={size}
                onClick={() => onSizeSelect(size)}
                className={`px-4 py-2 rounded-lg border-2 font-medium text-sm transition-all min-w-[2.5rem] ${selectedSize === size
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
                  }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color Selection - Only show if colors exist */}
      {colors && colors.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
            {isMobile ? 'COLOR' : 'COLOUR'}
          </h3>
          <div className={`flex ${isMobile ? 'gap-3' : 'gap-2'}`}>
            {colors.map((color) => (
              <button
                key={color.name}
                onClick={() => onColorSelect(color)}
                className={`${isMobile ? 'w-12 h-12' : 'w-10 h-10'
                  } rounded-full border-2 transition-all ${selectedColor.name === color.name
                    ? 'border-black scale-110'
                    : 'border-gray-300 hover:border-gray-500'
                  }`}
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
          </div>
        </div>
      )}

      {/* Reviews - Only show if reviews exist */}
      {rating && reviews && reviews > 0 && (
        <div className={`flex items-center ${isMobile ? 'gap-2 mb-6' : 'gap-1'}`}>
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i < Math.floor(rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                  }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">({reviews} reviews)</span>
        </div>
      )}
    </>
  )
}
