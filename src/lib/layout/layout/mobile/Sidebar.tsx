"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Home,
  ShoppingBag,
  Shirt,
  Flame,
  MapPin,
  Info,
  Mail,
  HelpCircle,
  RotateCcw,
  Truck,
  FileText,
  Instagram,
  Phone
} from "lucide-react"
import { Category } from "@/domains/product"
import { createClient } from '@/lib/supabase/client'
import { supabase } from "@/lib/supabase/supabase"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('categories')
          .select('*')
          .order('name')
        setCategories(data || [])
      } catch (error) {
        console.error('Failed to fetch categories:', error)
        setCategories([])
      }
    }

    fetchCategories()
  }, [])

  const toggleMenu = (menu: string) => {
    setExpandedMenu(expandedMenu === menu ? null : menu)
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Fullscreen Sidebar */}
      <div
        className={`fixed inset-0 z-50 bg-white transition-transform duration-300 lg:hidden ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex h-full flex-col">
          {/* Header with Logo */}
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <div className="relative h-10 w-40">
              <Image
                src="/logo/typography-logo.png"
                alt="Dude Mens Wear"
                fill
                className="object-contain"
                priority
              />
            </div>
            <button
              onClick={onClose}
              className="p-2 transition-colors hover:text-red-600"
              aria-label="Close menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto p-4 pb-20">
            <nav className="space-y-1">
              <Link
                href="/"
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-4 py-3 font-body font-medium transition-colors hover:bg-gray-100"
              >
                <Home className="h-5 w-5" />
                <span>Home</span>
              </Link>

              <Link
                href="/products"
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-4 py-3 font-body font-medium transition-colors hover:bg-gray-100"
              >
                <ShoppingBag className="h-5 w-5" />
                <span>Shop All</span>
              </Link>

              {/* Shop All with Submenu */}
              <div>
                <button
                  onClick={() => toggleMenu("shop")}
                  className="flex w-full items-center justify-between rounded-lg px-4 py-3 font-body font-medium transition-colors hover:bg-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <Shirt className="h-5 w-5" />
                    <span>Categories</span>
                  </div>
                  <svg
                    className={`h-5 w-5 transition-transform ${expandedMenu === "shop" ? "rotate-180" : ""
                      }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {expandedMenu === "shop" && (
                  <div className="ml-8 space-y-1 border-l-2 border-gray-200 pl-4">
                    {categories.length > 0 ? (
                      categories.map((category) => (
                        <Link
                          key={category.id}
                          href={`/products?category=${category.slug}`}
                          onClick={onClose}
                          className="block rounded-lg px-4 py-2 font-body text-sm transition-colors hover:bg-gray-100"
                        >
                          {category.name}
                        </Link>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-400">
                        Loading categories...
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Link
                href="/products#new-drops"
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-4 py-3 font-body font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <Flame className="h-5 w-5" />
                <span>New Drops</span>
              </Link>

              <Link
                href="/stores"
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-4 py-3 font-body font-medium transition-colors hover:bg-gray-100"
              >
                <MapPin className="h-5 w-5" />
                <span>Our Stores</span>
              </Link>

              <Link
                href="/about"
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-4 py-3 font-body font-medium transition-colors hover:bg-gray-100"
              >
                <Info className="h-5 w-5" />
                <span>About Us</span>
              </Link>

              <Link
                href="/contact"
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-4 py-3 font-body font-medium transition-colors hover:bg-gray-100"
              >
                <Mail className="h-5 w-5" />
                <span>Contact Us</span>
              </Link>

              <Link
                href="/faq"
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-4 py-3 font-body font-medium transition-colors hover:bg-gray-100"
              >
                <HelpCircle className="h-5 w-5" />
                <span>FAQ's</span>
              </Link>

              <Link
                href="/refund-policy"
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-4 py-3 font-body font-medium transition-colors hover:bg-gray-100"
              >
                <RotateCcw className="h-5 w-5" />
                <span>Refunds & Cancellations</span>
              </Link>

              <Link
                href="/shipping"
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-4 py-3 font-body font-medium transition-colors hover:bg-gray-100"
              >
                <Truck className="h-5 w-5" />
                <span>Shipping Policy</span>
              </Link>

              <Link
                href="/terms"
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-4 py-3 font-body font-medium transition-colors hover:bg-gray-100"
              >
                <FileText className="h-5 w-5" />
                <span>Terms & Conditions</span>
              </Link>
            </nav>
          </div>

          {/* Social Media Icons - Bottom */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Connect With Us
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://instagram.com/dudemw"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 text-white transition-transform hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="h-6 w-6" />
              </a>
              <a
                href="https://wa.me/919876543210"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white transition-transform hover:scale-110"
                aria-label="WhatsApp"
              >
                <Phone className="h-6 w-6" />
              </a>
              <a
                href="mailto:info@dudemw.com"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-800 text-white transition-transform hover:scale-110"
                aria-label="Email"
              >
                <Mail className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
