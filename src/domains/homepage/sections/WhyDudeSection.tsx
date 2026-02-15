"use client"

import { useEffect, useState } from "react"
import { getIconComponent } from "@/lib/utils/icons"
import { WhyDudeFeature } from "@/types/database"
import { createClient } from "@/lib/supabase/client"

export default function WhyDudeSection() {
  const [features, setFeatures] = useState<WhyDudeFeature[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFeatures()
  }, [])

  const loadFeatures = async () => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('why_dude_sections')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) {
        console.error('Error fetching Why Dude features:', error)
        return
      }

      setFeatures(data || [])
    } catch (error) {
      console.error('Error loading Why Dude features:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="font-heading text-4xl tracking-wider text-black md:text-5xl">
              WHY <span className="text-brand-red">DUDE</span>?
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center animate-pulse">
                <div className="mb-3 flex justify-center">
                  <div className="h-10 w-10 bg-gray-200 rounded md:h-12 md:w-12" />
                </div>
                <div className="mb-1.5 h-4 bg-gray-200 rounded" />
                <div className="h-3 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (features.length === 0) {
    return null // Don't render section if no features
  }
  return (
    <section className="bg-gradient-to-b from-white to-gray-50 py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-4 text-center">
          <h2 className="font-heading text-xl md:text-5xl tracking-wider text-black whitespace-nowrap">
            WHY CHOOSE <span className="text-brand-red">DUDE</span>?
          </h2>
          <p className="mt-3 font-body text-base text-gray-600 md:text-lg">
            Curated Style. Best Prices. Delivered Nationwide.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-4 gap-2 md:gap-12 mt-8 md:mt-12">
          {features.map((feature) => {
            const IconComponent = getIconComponent(feature.icon_name)
            return (
              <div key={feature.id} className="text-center group">
                <div className="mb-4 flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-600/10 rounded-full blur-xl group-hover:bg-red-600/20 transition-all" />
                    <IconComponent className="relative h-8 w-8 text-black md:h-14 md:w-14 group-hover:text-red-600 transition-colors" strokeWidth={1.5} />
                  </div>
                </div>
                <h3 className="mb-1 font-heading text-xs tracking-wider text-black md:text-lg font-bold uppercase">
                  {feature.title}
                </h3>
                <p className="font-body text-[10px] text-gray-700 md:text-base leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
