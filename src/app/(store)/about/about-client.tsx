'use client'

import { motion } from 'framer-motion'

export default function AboutClient({
  cmsContent
}: {
  cmsContent?: string
}) {
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
          className="bg-white rounded-xl p-8 md:p-12 shadow-sm border border-gray-200"
        >
          <h2 className="text-3xl font-bold mb-6">Our Story</h2>
          {cmsContent ? (
            <div
              className="prose prose-red max-w-none text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: cmsContent }}
            />
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
      </div>
    </div>
  )
}
