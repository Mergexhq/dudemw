"use client"

import { Card, CardContent } from "@/components/ui/card"
import { motion } from "motion/react"

interface ProductTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  { id: "general", label: "General" },
  { id: "media", label: "Media" },
  { id: "variants", label: "Variants" },
  { id: "pricing", label: "Pricing" },
  { id: "inventory", label: "Inventory" },
  { id: "organization", label: "Organization" },
  { id: "seo", label: "SEO" }
]

export function ProductTabs({ activeTab, onTabChange }: ProductTabsProps) {
  return (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
      <CardContent className="p-4">
        <div className="w-full">
          <div className="flex items-center w-full dark:bg-red-950/30 bg-red-50 p-1 dark:text-white text-black rounded-md border border-red-100/50 dark:border-red-900/20">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative flex-1 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-200 ${activeTab === tab.id ? 'text-white' : 'text-red-600/70 dark:text-red-300/70 hover:text-red-700 dark:hover:text-red-200'
                  }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeProductTab"
                    className="absolute inset-0 bg-red-600 dark:bg-red-700 rounded-md shadow-sm"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30
                    }}
                  />
                )}
                <span className="relative z-2 uppercase text-xs font-semibold">
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}