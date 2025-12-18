'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  showBackButton?: boolean
}

export default function AuthLayout({ 
  children, 
  title, 
  subtitle,
  showBackButton = true 
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Testimonial Card */}
      <div className="hidden lg:flex lg:flex-1 p-8">
        <div className="relative w-full overflow-hidden rounded-2xl shadow-2xl md:rounded-3xl">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`
            }}
          />
          
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          
          {/* Top Navigation Overlay */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-8">
            {/* Logo/Brand - Top Left */}
            <Link href="/" className="inline-block">
              <img 
                src="/logo/typography-logo.png" 
                alt="Dude Mens Wear" 
                className="h-8 w-auto"
              />
            </Link>

            {/* Back Button - Top Right */}
            {showBackButton && (
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-black/20 backdrop-blur-sm rounded-lg px-4 py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Home</span>
              </Link>
            )}
          </div>
          
          {/* Content */}
          <div className="relative h-full flex flex-col justify-end p-12">
            {/* Testimonial */}
            <div className="max-w-md">
              <blockquote className="text-white mb-8">
                <p className="font-heading text-4xl leading-tight tracking-tighter mb-6">
                  "Best shopping experience ever!"
                </p>
                <p className="text-lg leading-relaxed opacity-90">
                  Amazing quality clothes and super fast delivery. Dude Mens Wear has become my go-to store for all fashion needs.
                </p>
              </blockquote>
              
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-white font-heading font-bold">RK</span>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-white font-heading font-semibold tracking-wide">Rajesh Kumar</div>
                  <div className="text-white/80 text-sm">Fashion Enthusiast</div>
                  <div className="text-white/60 text-sm">Chennai, India</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 bg-white lg:bg-gray-50">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Header */}
          <div className="mb-8">
            <h2 className="font-heading text-3xl font-bold text-gray-900 mb-2 tracking-wide">{title}</h2>
            {subtitle && (
              <p className="text-gray-600">{subtitle}</p>
            )}
          </div>

          {/* Content */}
          {children}
        </div>
      </div>
    </div>
  )
}
