"use client"

import { useState } from "react"

interface SizeGuideModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SizeGuideModal({ isOpen, onClose }: SizeGuideModalProps) {
  if (!isOpen) return null

  const sizeChart = [
    { size: "S", chest: "36-38", length: "27", shoulder: "16" },
    { size: "M", chest: "38-40", length: "28", shoulder: "17" },
    { size: "L", chest: "40-42", length: "29", shoulder: "18" },
    { size: "XL", chest: "42-44", length: "30", shoulder: "19" },
    { size: "XXL", chest: "44-46", length: "31", shoulder: "20" },
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-2xl animate-fade-in bg-white p-6 md:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-2xl text-gray-800 hover:text-brand-red"
          aria-label="Close size guide"
        >
          ✕
        </button>

        {/* Header */}
        <h2 className="mb-6 font-heading text-2xl tracking-wider text-black md:text-3xl">
          SIZE GUIDE
        </h2>

        {/* Size Chart */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-black text-white">
                <th className="border border-gray-300 px-4 py-3 font-heading text-sm tracking-wider">
                  SIZE
                </th>
                <th className="border border-gray-300 px-4 py-3 font-heading text-sm tracking-wider">
                  CHEST (inches)
                </th>
                <th className="border border-gray-300 px-4 py-3 font-heading text-sm tracking-wider">
                  LENGTH (inches)
                </th>
                <th className="border border-gray-300 px-4 py-3 font-heading text-sm tracking-wider">
                  SHOULDER (inches)
                </th>
              </tr>
            </thead>
            <tbody>
              {sizeChart.map((row) => (
                <tr key={row.size} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3 text-center font-heading text-sm">
                    {row.size}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center font-body text-sm">
                    {row.chest}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center font-body text-sm">
                    {row.length}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center font-body text-sm">
                    {row.shoulder}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* How to Measure */}
        <div className="mt-6 rounded bg-gray-50 p-4">
          <h3 className="mb-2 font-heading text-lg tracking-wider text-black">
            HOW TO MEASURE
          </h3>
          <ul className="space-y-2 font-body text-sm text-gray-800">
            <li>• <strong>Chest:</strong> Measure around the fullest part</li>
            <li>• <strong>Length:</strong> From shoulder to bottom hem</li>
            <li>• <strong>Shoulder:</strong> From shoulder seam to seam</li>
          </ul>
        </div>

        {/* WhatsApp CTA */}
        <div className="mt-6 text-center">
          <p className="mb-3 font-body text-sm text-gray-800">
            Still confused? We're here to help!
          </p>
          <a
            href="https://wa.me/919488924935"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#25D366] px-6 py-3 font-heading text-sm tracking-wider text-white transition-colors hover:bg-[#20BA5A]"
          >
            CHAT ON WHATSAPP
          </a>
        </div>
      </div>
    </div>
  )
}
