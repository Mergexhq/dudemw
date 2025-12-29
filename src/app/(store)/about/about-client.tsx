'use client'

import { motion } from 'framer-motion'
import * as LucideIcons from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { AboutFeature, AboutStat } from '@/types/database'

export default function AboutClient({
  cmsContent,
  features,
  stats
}: {
  cmsContent?: string
  features: AboutFeature[]
  stats: AboutStat[]
}) {
  const getIconComponent = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Heart
    return IconComponent
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-r from-red-600 to-red-700 text-white py-20"
      >
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-6xl font-heading font-bold mb-6"
          >
            About Dude Mens Wear
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-red-100"
          >
            Redefining men's fashion with style, comfort, and confidence
          </motion.p>
        </div>
      </motion.div>

      {/* Our Story */}
      <div className="container mx-auto px-4 max-w-6xl py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-xl p-8 md:p-12 shadow-sm border border-gray-200 mb-12"
        >
          <h2 className="text-3xl font-bold mb-6">Our Story</h2>
          {cmsContent ? (
            <div className="prose prose-red max-w-none text-gray-700 leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{cmsContent}</ReactMarkdown>
            </div>
          ) : (
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                Founded in 2020, Dude Mens Wear started with a simple mission: to provide high-quality,
                stylish menswear that doesn't compromise on comfort or affordability. What began as a
                small online store has grown into a trusted brand serving thousands of customers across India.
              </p>
              <p>
                We believe that every man deserves to look and feel his best, whether he's heading to
                the office, hitting the gym, or enjoying a casual weekend. That's why we carefully curate
                our collection to include versatile pieces that work for every occasion.
              </p>
              <p>
                Our commitment to quality, customer satisfaction, and sustainable practices has made us
                a favorite among modern Indian men who value both style and substance.
              </p>
            </div>
          )}
        </motion.div>

        {/* Features - Dynamic */}
        <div className={`grid md:grid-cols-2 lg:grid-cols-${Math.min(features.length, 4)} gap-6 mb-16`}>
          {features.map((feature, index) => {
            const Icon = getIconComponent(feature.icon_name)
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center"
              >
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">
                  {feature.description}
                </p>
              </motion.div>
            )
          })}
        </div>

        {/* Stats - Dynamic */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-8 md:p-12 text-white"
        >
          <div className={`grid grid-cols-2 md:grid-cols-${Math.min(stats.length, 4)} gap-8 text-center`}>
            {stats.map((stat) => (
              <div key={stat.id}>
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-red-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
