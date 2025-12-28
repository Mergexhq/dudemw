"use client"

import { useEffect } from "react"

export default function InstagramFeed() {
  useEffect(() => {
    // Load Elfsight platform script
    const script = document.createElement('script')
    script.src = 'https://elfsightcdn.com/platform.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      // Cleanup script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  return (
    <section className="overflow-hidden bg-white py-16" suppressHydrationWarning>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-8 flex flex-col items-center justify-center gap-4 text-center">
          <h2 className="font-heading text-3xl md:text-4xl tracking-wide text-black text-center">
            AS SEEN ON INSTAGRAM
          </h2>
        </div>

        {/* Elfsight Instagram Feed Widget */}
        <div
          className="elfsight-app-af4df63c-c77e-4f99-b8fa-e6149d9196a1"
          data-elfsight-app-lazy
          suppressHydrationWarning
        />
      </div>
    </section>
  )
}
