"use client"

import { useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

interface NavigationDrawerProps {
    isOpen: boolean
    onClose: () => void
}

export default function NavigationDrawer({ isOpen, onClose }: NavigationDrawerProps) {
    if (!isOpen) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/50 transition-opacity"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-white shadow-2xl transition-transform duration-300 ease-out">
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

                            {/* New Drops */}
                            <Link
                                href="/collections/new-drops"
                                onClick={onClose}
                                className="block border-b border-gray-100 px-4 py-3 text-sm font-medium transition-colors hover:text-red-600"
                            >
                                New Drops
                            </Link>

                            {/* Best Sellers */}
                            <Link
                                href="/collections/best-sellers"
                                onClick={onClose}
                                className="block border-b border-gray-100 px-4 py-3 text-sm font-medium transition-colors hover:text-red-600"
                            >
                                Best Sellers
                            </Link>

                            {/* Shop All */}
                            <Link
                                href="/products"
                                onClick={onClose}
                                className="block border-b border-gray-100 px-4 py-3 text-sm font-medium transition-colors hover:text-red-600"
                            >
                                Shop All
                            </Link>

                            {/* Accordions for Topwear and Bottomwear */}
                            <Accordion type="single" collapsible className="w-full">
                                {/* Topwear Accordion */}
                                <AccordionItem value="topwear" className="border-b border-gray-100">
                                    <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:text-red-600 hover:no-underline">
                                        Topwear
                                    </AccordionTrigger>
                                    <AccordionContent className="bg-gray-50 px-4 pb-2">
                                        <div className="space-y-1 pl-4 pt-2">
                                            <Link
                                                href="/categories/t-shirts"
                                                onClick={onClose}
                                                className="block rounded-lg px-3 py-2 text-sm transition-colors hover:text-red-600"
                                            >
                                                T-Shirts
                                            </Link>
                                            <Link
                                                href="/categories/shirts"
                                                onClick={onClose}
                                                className="block rounded-lg px-3 py-2 text-sm transition-colors hover:text-red-600"
                                            >
                                                Shirts
                                            </Link>
                                            <Link
                                                href="/categories/hoodies"
                                                onClick={onClose}
                                                className="block rounded-lg px-3 py-2 text-sm transition-colors hover:text-red-600"
                                            >
                                                Hoodies
                                            </Link>
                                            <Link
                                                href="/categories/jackets"
                                                onClick={onClose}
                                                className="block rounded-lg px-3 py-2 text-sm transition-colors hover:text-red-600"
                                            >
                                                Jackets
                                            </Link>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                {/* Bottomwear Accordion */}
                                <AccordionItem value="bottomwear" className="border-b border-gray-100">
                                    <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:text-red-600 hover:no-underline">
                                        Bottomwear
                                    </AccordionTrigger>
                                    <AccordionContent className="bg-gray-50 px-4 pb-2">
                                        <div className="space-y-1 pl-4 pt-2">
                                            <Link
                                                href="/categories/jeans"
                                                onClick={onClose}
                                                className="block rounded-lg px-3 py-2 text-sm transition-colors hover:text-red-600"
                                            >
                                                Jeans
                                            </Link>
                                            <Link
                                                href="/categories/track-pants"
                                                onClick={onClose}
                                                className="block rounded-lg px-3 py-2 text-sm transition-colors hover:text-red-600"
                                            >
                                                Track Pants
                                            </Link>
                                            <Link
                                                href="/categories/cargo-pants"
                                                onClick={onClose}
                                                className="block rounded-lg px-3 py-2 text-sm transition-colors hover:text-red-600"
                                            >
                                                Cargo Pants
                                            </Link>
                                            <Link
                                                href="/categories/shorts"
                                                onClick={onClose}
                                                className="block rounded-lg px-3 py-2 text-sm transition-colors hover:text-red-600"
                                            >
                                                Shorts
                                            </Link>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>

                            {/* Combos / Bundles */}
                            <Link
                                href="/collections/combos"
                                onClick={onClose}
                                className="block border-b border-gray-100 px-4 py-3 text-sm font-medium transition-colors hover:text-red-600"
                            >
                                Combos / Bundles
                            </Link>

                            {/* Under ₹999 Store */}
                            <Link
                                href="/collections/under-999"
                                onClick={onClose}
                                className="block border-b border-gray-100 px-4 py-3 text-sm font-medium transition-colors hover:text-red-600"
                            >
                                Under ₹999 Store
                            </Link>

                            {/* About Us */}
                            <Link
                                href="/about"
                                onClick={onClose}
                                className="block border-b border-gray-100 px-4 py-3 text-sm font-medium transition-colors hover:text-red-600"
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
                                href="/help"
                                onClick={onClose}
                                className="block px-4 py-3 text-sm font-medium transition-colors hover:text-red-600"
                            >
                                Help / WhatsApp Us
                            </Link>
                        </div>
                    </nav>
                </div>
            </div>
        </>
    )
}
