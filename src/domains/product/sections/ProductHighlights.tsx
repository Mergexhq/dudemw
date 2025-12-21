'use client'

import { motion } from 'framer-motion'
import { Zap, Droplet, Wind, Shield, Star, Truck, RefreshCw, Package } from 'lucide-react'

interface Highlight {
  icon: React.ReactNode
  text: string
}

interface ProductHighlightsProps {
  highlights?: string[]
  material?: string | null
  fabricWeight?: string | null
}

// Map highlight keywords to icons
const getIconForHighlight = (text: string) => {
  const lowerText = text.toLowerCase()
  if (lowerText.includes('cotton') || lowerText.includes('gsm') || lowerText.includes('fabric')) {
    return <Zap className="w-5 h-5" />
  }
  if (lowerText.includes('wash') || lowerText.includes('bio')) {
    return <Droplet className="w-5 h-5" />
  }
  if (lowerText.includes('breathable') || lowerText.includes('comfort')) {
    return <Wind className="w-5 h-5" />
  }
  if (lowerText.includes('shrink') || lowerText.includes('durable') || lowerText.includes('quality')) {
    return <Shield className="w-5 h-5" />
  }
  if (lowerText.includes('premium') || lowerText.includes('best')) {
    return <Star className="w-5 h-5" />
  }
  if (lowerText.includes('delivery') || lowerText.includes('shipping')) {
    return <Truck className="w-5 h-5" />
  }
  if (lowerText.includes('return') || lowerText.includes('exchange')) {
    return <RefreshCw className="w-5 h-5" />
  }
  return <Package className="w-5 h-5" />
}

export default function ProductHighlights({
  highlights: propsHighlights,
  material,
  fabricWeight
}: ProductHighlightsProps) {
  // Build highlights from props or use defaults
  let highlightTexts: string[] = []

  if (propsHighlights && propsHighlights.length > 0) {
    highlightTexts = propsHighlights
  } else {
    // Build from product attributes
    if (fabricWeight) {
      highlightTexts.push(`${fabricWeight} Premium Cotton`)
    } else {
      highlightTexts.push('Premium Cotton')
    }

    if (material) {
      highlightTexts.push(material)
    } else {
      highlightTexts.push('Bio-washed')
    }

    highlightTexts.push('Breathable Fabric')
    highlightTexts.push('Anti-shrink')
  }

  const highlights: Highlight[] = highlightTexts.map(text => ({
    icon: getIconForHighlight(text),
    text
  }))

  if (highlights.length === 0) {
    return null
  }

  return (
    <section className="pt-0 pb-8 md:py-12 px-4 md:px-8 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto max-w-7xl">
        <h2 className="text-2xl md:text-3xl font-heading tracking-wider mb-6 md:mb-8 text-center">
          PRODUCT HIGHLIGHTS
        </h2>
        <div className="flex justify-center gap-2 md:gap-3 flex-wrap">
          {highlights.map((highlight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-2 md:gap-3 bg-white px-3 py-2 md:px-6 md:py-4 rounded-full border-2 border-gray-200 whitespace-nowrap shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-red-600">
                <div className="w-4 h-4 md:w-5 md:h-5">{highlight.icon}</div>
              </div>
              <span className="font-body font-medium text-xs md:text-base">{highlight.text}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

