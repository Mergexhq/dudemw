import Link from "next/link"
import Image from "next/image"

export default function FooterLite() {
  return (
    <footer className="border-t-2 border-black bg-white pb-20 lg:hidden">
      <div className="px-4 py-8">
        {/* Quick Links */}


        {/* Copyright */}
        <div className="text-center">
          <div className="mb-6 flex flex-col items-center gap-3">
            <Image
              src="/logo/typography-logo.png"
              alt="Dude Mens Wear"
              width={160}
              height={53}
              className="h-auto w-40 opacity-80 grayscale"
            />

          </div>

          <div className="mb-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="flex items-center gap-1 rounded border border-gray-200 px-2 py-0.5 font-body text-[10px] bg-white text-gray-500">
                <span className="text-green-600">✓</span> UPI
              </div>
              <div className="flex items-center gap-1 rounded border border-gray-200 px-2 py-0.5 font-body text-[10px] bg-white text-gray-500">
                <span className="text-green-600">✓</span> Cards
              </div>

            </div>
          </div>

          <p className="font-body text-xs text-gray-600">
            © 2025 Dude Mens Wear. All rights reserved.
          </p>
          <p className="mt-1 flex items-center justify-center gap-1 font-body text-xs text-gray-500">
            Crafted by{" "}
            <a
              href="https://mergex.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 font-medium text-red-600"
            >
              MergeX <span>⚡</span>
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
