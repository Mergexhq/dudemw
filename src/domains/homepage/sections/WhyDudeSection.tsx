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
    <section className="bg-white py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="font-heading text-4xl tracking-wider text-black md:text-5xl">
            WHY <span className="text-brand-red">DUDE</span>?
          </h2>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
          {features.map((feature) => {
            const IconComponent = getIconComponent(feature.icon_name)
            return (
              <div key={feature.id} className="text-center">
                <div className="mb-3 flex justify-center">
                  <IconComponent className="h-10 w-10 text-black md:h-12 md:w-12" strokeWidth={1.5} />
                </div>
                <h3 className="mb-1.5 font-heading text-base tracking-wider text-black md:text-lg">
                  {feature.title}
                </h3>
                <p className="font-body text-xs text-gray-800 md:text-sm">
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
