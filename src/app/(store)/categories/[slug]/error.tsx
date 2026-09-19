"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function CategoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[CategoryPage] Error:", error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <h1 className="font-heading text-3xl font-medium text-gray-900 mb-4">
        Something went wrong
      </h1>
      <p className="text-gray-600 mb-8 text-center max-w-md">
        We couldn&apos;t load this category right now. Please try again.
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="rounded-lg bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          Try Again
        </button>
        <Link
          href="/products"
          className="rounded-lg border-2 border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-black hover:text-black"
        >
          Browse All Products
        </Link>
      </div>
    </div>
  )
}
