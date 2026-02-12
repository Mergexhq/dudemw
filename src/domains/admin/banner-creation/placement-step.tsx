"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Monitor, ShoppingBag, Tag, Megaphone } from "lucide-react"

type BannerPlacement = "homepage-carousel" | "top-marquee-banner"

interface PlacementStepProps {
  selectedPlacement?: BannerPlacement
  onPlacementChange: (placement: BannerPlacement) => void
}

const placementOptions = [
  {
    id: "homepage-carousel" as BannerPlacement,
    title: "Homepage Carousel",
    aspectRatio: "16:6 or 16:7",
    icon: Monitor,
  },
  {
    id: "top-marquee-banner" as BannerPlacement,
    title: "Top Marquee Banner",
    aspectRatio: "Full width scrolling",
    icon: Megaphone,
  }
]

export function PlacementStep({ selectedPlacement, onPlacementChange }: PlacementStepProps) {
  return (
    <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900">Choose Placement</CardTitle>
        <CardDescription className="text-gray-600">
          Select where your banner will appear on the website
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 w-full">
          {placementOptions.map((option) => {
            const Icon = option.icon
            return (
              <div
                key={option.id}
                className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${selectedPlacement === option.id
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 hover:border-gray-300"
                  }`}
                onClick={() => onPlacementChange(option.id)}
              >
                <div className="text-center space-y-3">
                  <div className={`inline-flex p-3 rounded-lg ${selectedPlacement === option.id
                      ? "bg-red-100"
                      : "bg-gray-100"
                    }`}>
                    <Icon className={`h-6 w-6 ${selectedPlacement === option.id
                        ? "text-red-600"
                        : "text-gray-600"
                      }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{option.title}</h3>
                    <p className="text-sm text-gray-600">{option.aspectRatio}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}