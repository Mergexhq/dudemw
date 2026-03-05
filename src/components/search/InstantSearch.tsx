"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search } from "lucide-react"

interface SearchResult {
    id: string
    title: string
    slug: string
    price: number
    original_price: number | null
    primary_image: string | null
    rank: number
}

interface InstantSearchProps {
    query: string
    onClose: () => void
}

export default function InstantSearch({ query, onClose }: InstantSearchProps) {
    const [results, setResults] = useState<SearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!query || query.length < 2) {
            setResults([])
            return
        }

        const fetchResults = async () => {
            setLoading(true)
            try {
                const response = await fetch(`/api/search/instant?q=${encodeURIComponent(query)}`)
                if (response.ok) {
                    const data = await response.json()
                    setResults(data.results || [])
                }
            } catch (error) {
                console.error('Instant search error:', error)
            } finally {
                setLoading(false)
            }
        }

        // Debounce search
        const timer = setTimeout(fetchResults, 300)
        return () => clearTimeout(timer)
    }, [query])

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose()
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [onClose])

    if (!query || query.length < 2) return null

    return (
        <div
            ref={dropdownRef}
            className="absolute left-0 right-0 top-full mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-xl z-50 max-h-96 overflow-y-auto"
        >
            {loading ? (
                <div className="p-4 text-center text-gray-500">
                    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-red-600 border-r-transparent" />
                    <span className="ml-2">Searching...</span>
                </div>
            ) : results.length > 0 ? (
                <>
                    <div className="p-2">
                        {results.map((result) => (
                            <Link
                                key={result.id}
                                href={`/products/${result.slug}`}
                                onClick={onClose}
                                className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50 transition-colors"
                            >
                                <div className="relative h-12 w-12 flex-shrink-0 rounded bg-gray-100">
                                    {result.primary_image ? (
                                        <Image
                                            src={result.primary_image}
                                            alt={result.title}
                                            fill
                                            sizes="48px"
                                            className="object-cover rounded"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                                            <Search className="h-5 w-5" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-gray-900 truncate">{result.title}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="font-semibold text-sm text-red-600">
                                            ₹{result.price.toLocaleString()}
                                        </span>
                                        {result.original_price && result.original_price > result.price && (
                                            <span className="text-xs text-gray-500 line-through">
                                                ₹{result.original_price.toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                    <div className="border-t border-gray-200 p-3 bg-gray-50">
                        <Link
                            href={`/products?q=${encodeURIComponent(query)}`}
                            onClick={onClose}
                            className="block text-center text-sm font-medium text-red-600 hover:text-red-700"
                        >
                            View all results for "{query}"
                        </Link>
                    </div>
                </>
            ) : (
                <div className="p-4 text-center text-gray-500">
                    <p>No products found for "{query}"</p>
                    <Link
                        href="/products"
                        onClick={onClose}
                        className="mt-2 inline-block text-sm text-red-600 hover:text-red-700"
                    >
                        Browse all products
                    </Link>
                </div>
            )}
        </div>
    )
}
