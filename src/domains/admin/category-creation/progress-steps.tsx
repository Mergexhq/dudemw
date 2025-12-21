"use client"

import { Card, CardContent } from "@/components/ui/card"

interface ProgressStepsProps {
  currentStep: number
  totalSteps: number
}

export function ProgressSteps({ currentStep, totalSteps }: ProgressStepsProps) {
  const stepTitles = ["Basic Information", "Media Assets", "Banner Settings", "Select Products", "Preview & Save"]

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between w-full">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div className="flex items-center w-full">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mx-auto ${step === currentStep
                    ? "bg-red-600 text-white"
                    : step < currentStep
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}>
                  {step}
                </div>
              </div>
              {step < totalSteps && (
                <div className={`flex-1 h-0.5 mx-4 ${step < currentStep ? "bg-green-600" : "bg-gray-200"
                  }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-4 w-full">
          {stepTitles.slice(0, totalSteps).map((title, index) => (
            <div key={index} className="flex-1 text-center">
              <span className={`text-sm ${index + 1 === currentStep
                  ? "font-medium text-red-600"
                  : "text-gray-500"
                }`}>
                {title}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}