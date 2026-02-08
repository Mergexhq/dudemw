"use client"

import Link from "next/link"
import Image from "next/image"
import { MapPin, Mail, Phone } from "lucide-react"
import { useEffect, useState } from "react"
import { Category } from "@/domains/product"
import { createClient } from '@/lib/supabase/client'

interface StoreLocation {
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  pincode: string | null
  email: string | null
  phone: string | null
  latitude: number | null
  longitude: number | null
}

// Fallback store location
const FALLBACK_LOCATION: StoreLocation = {
  address_line1: 'Sankari Main Rd',
  address_line2: 'Tharamangalam',
  city: 'Salem',
  state: 'Tamil Nadu',
  pincode: '636502',
  email: 'hello@dudemw.com',
  phone: '+91 97866 27616',
  latitude: null,
  longitude: null
}

export default function Footer() {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const supabase = createClient()

        // Fetch categories
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('*')
          .order('name')
        setCategories((categoriesData || []).slice(0, 5)) // Limit to 5 categories for footer
      } catch (error) {
        console.error('Failed to fetch footer categories:', error)
      }
    }

    fetchCategories()
  }, [])

  return (
    <footer className="hidden border-t-2 border-black bg-white lg:block">
      <div className="mx-auto max-w-[1600px] px-6 py-12">
        {/* Main Footer Content */}
        <div className="mb-8 grid grid-cols-4 gap-12">
          {/* Store Location & Contact */}
          <div>
            <h4 className="mb-4 font-heading text-lg tracking-wider">
              VISIT US
            </h4>
            <div className="space-y-3 font-body text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 flex-shrink-0 text-black" />
                <div>
                  <p className="font-medium text-black">Store Location</p>
                  <p className="text-gray-700">
                    {FALLBACK_LOCATION.address_line1}{FALLBACK_LOCATION.address_line2 && `, ${FALLBACK_LOCATION.address_line2}`}<br />
                    {FALLBACK_LOCATION.city}, {FALLBACK_LOCATION.state}<br />
                    India - {FALLBACK_LOCATION.pincode}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 flex-shrink-0 text-black" />
                <a href={`mailto:${FALLBACK_LOCATION.email}`} className="text-gray-700 hover:text-red-600">
                  {FALLBACK_LOCATION.email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 flex-shrink-0 text-black" />
                <a href={`tel:${FALLBACK_LOCATION.phone?.replace(/\s/g, '')}`} className="text-gray-700 hover:text-red-600">
                  {FALLBACK_LOCATION.phone}
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 font-heading text-lg tracking-wider">
              TAKE ME TO...
            </h4>
            <ul className="space-y-2 font-body text-sm">
              <li>
                <Link href="/products" className="hover:text-red-600">
                  Shop All
                </Link>
              </li>
              {categories.map((category) => (
                <li key={category.id}>
                  <Link href={`/products?category=${category.slug}`} className="hover:text-red-600">
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="mb-4 font-heading text-lg tracking-wider">
              MAY I HELP YOU?
            </h4>
            <ul className="space-y-2 font-body text-sm">
              <li>
                <Link href="/profile?section=track-order" className="hover:text-red-600">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-red-600">
                  Returns
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-red-600">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-red-600">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-red-600">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Dude World */}
          <div>
            <h4 className="mb-4 font-heading text-lg tracking-wider">
              DUDE WORLD
            </h4>
            <ul className="space-y-2 font-body text-sm">
              <li>
                <Link href="/about" className="hover:text-red-600">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/size-guide" className="hover:text-red-600">
                  Size Guide
                </Link>
              </li>
              <li>
                <Link href="/stores" className="hover:text-red-600">
                  Store Locator
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t-2 border-gray-200 pt-6">
          {/* Logo Center */}
          <div className="mb-4 flex flex-col items-center justify-center gap-4">
            <Image
              src="/logo/typography-logo.png"
              alt="Dude Mens Wear"
              width={240}
              height={72}
              className="h-auto w-60"
            />
            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-1">
              <span className="text-lg">🇮🇳</span>
              <span className="font-body text-xs font-medium text-gray-700">Proudly Made in India</span>
            </div>
          </div>

          {/* Copyright and Payment */}
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="flex items-center gap-1 font-body text-sm text-gray-600">
              © 2025 Dude Mens Wear. All rights reserved. | Crafted by{" "}
              <a
                href="https://mergex.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-red-600 transition-colors hover:text-red-700"
              >
                Mergex <span className="text-base">⚡</span>
              </a>
            </p>
            <div className="flex items-center gap-4">
              <span className="font-body text-xs text-gray-500">100% Secure Payment:</span>
              <div className="flex gap-2">
                <div className="flex items-center gap-1 rounded border border-gray-300 px-3 py-1 font-body text-xs font-medium bg-white">
                  <span className="text-green-600">✓</span> Razorpay
                </div>
                <div className="flex items-center gap-1 rounded border border-gray-300 px-3 py-1 font-body text-xs font-medium bg-white">
                  <span className="text-green-600">✓</span> UPI
                </div>
                <div className="flex items-center gap-1 rounded border border-gray-300 px-3 py-1 font-body text-xs font-medium bg-white">
                  <span className="text-green-600">✓</span> Cards
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
