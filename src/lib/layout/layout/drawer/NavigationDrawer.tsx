"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { createClient } from '@/lib/supabase/client'
import { Category } from "@/domains/product"

interface NavigationDrawerProps {
    isOpen: boolean
    onClose: () => void
}

export default function NavigationDrawer({ isOpen, onClose }: NavigationDrawerProps) {
    const [categories, setCategories] = useState<Category[]>([])

    useEffect(() => {
        const fetchCategories = async () => {
            const supabase = createClient()
            const { data } = await supabase.from('categories').select('*').order('name')
            if (data) setCategories(data)
        }
        if (isOpen) { // Only fetch when drawer is opened to save resources, or just once on mount
            fetchCategories()
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/50 transition-opacity"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 z-50 h-full w-full md:w-96 bg-white shadow-2xl transition-transform duration-300 ease-out">
                <div className="flex h-full flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                        <h2 className="text-lg font-semibold">Menu</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            aria-label="Close menu"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Navigation Content */}
                    <nav className="flex-1 overflow-y-auto px-6 py-6">
                        <div className="flex flex-col">
                            {/* Home */}
                            <Link
                                href="/"
                                onClick={onClose}
                                className="block border-b border-gray-100 px-4 py-3 text-sm font-medium transition-colors hover:text-red-600"
                            >
                                Home
                            </Link>

                            {/* Shop All - Moved next to Home */}
                            <Link
                                href="/products"
                                onClick={onClose}
                                className="block border-b border-gray-100 px-4 py-3 text-sm font-medium transition-colors hover:text-red-600"
                            >
                                Shop All
                            </Link>

                            {/* Dynamic Categories */}
                            <div className="py-2">
                                <h3 className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Categories
                                </h3>
                                {categories.map((category) => (
                                    <Link
                                        key={category.id}
                                        href={`/products?category=${category.slug}`}
                                        onClick={onClose}
                                        className="block px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded-md transition-colors"
                                    >
                                        {category.name}
                                    </Link>
                                ))}
                            </div>

                            {/* Divider before utility links */}
                            <div className="my-2 border-t border-gray-100"></div>

                            {/* About Us */}
                            <Link
                                href="/about"
                                onClick={onClose}
                                className="block px-4 py-3 text-sm font-medium transition-colors hover:text-red-600"
                            >
                                About Us
                            </Link>

                            {/* Track Order */}
                            <Link
                                href="/profile?section=track-order"
                                onClick={onClose}
                                className="block border-b border-gray-100 px-4 py-3 text-sm font-medium transition-colors hover:text-red-600"
                            >
                                Track Order
                            </Link>

                            {/* Help / WhatsApp Us */}
                            <Link
                                href="https://wa.me/919786627616?text=Hello!%20I%20would%20like%20to%20know%20more%20about%20your%20products."
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={onClose}
                                className="block px-4 py-3 text-sm font-medium transition-colors hover:text-red-600"
                            >
                                Help / WhatsApp Us
                            </Link>
                        </div>

                        {/* Help & Policies Section */}
                        <div className="mt-6 border-t border-gray-100 pt-6 pb-20">
                            <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                Help & Policies
                            </h3>
                            <Link
                                href="/contact"
                                onClick={onClose}
                                className="block px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded-md transition-colors"
                            >
                                Contact Us
                            </Link>
                            <Link
                                href="/faq"
                                onClick={onClose}
                                className="block px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded-md transition-colors"
                            >
                                FAQ
                            </Link>
                            <Link
                                href="/shipping"
                                onClick={onClose}
                                className="block px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded-md transition-colors"
                            >
                                Shipping Policy
                            </Link>
                            <Link
                                href="/returns"
                                onClick={onClose}
                                className="block px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded-md transition-colors"
                            >
                                Returns
                            </Link>
                            <Link
                                href="/privacy"
                                onClick={onClose}
                                className="block px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded-md transition-colors"
                            >
                                Privacy Policy
                            </Link>
                            <Link
                                href="/refund-policy"
                                onClick={onClose}
                                className="block px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded-md transition-colors"
                            >
                                Refund Policy
                            </Link>
                        </div>
                    </nav>
                </div>
            </div>
        </>
    )
}
