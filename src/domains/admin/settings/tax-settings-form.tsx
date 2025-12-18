"use client"

import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Save } from "lucide-react"
import { useTaxSettings } from "./tax/hooks/use-tax-settings"
import { GlobalTaxSettings } from "./tax/components/global-tax-settings"
import { StoreLocationSettings } from "./tax/components/store-location-settings"
import { CategoryTaxOverrides } from "./tax/components/category-tax-overrides"
import { TaxCalculationPreview } from "./tax/components/tax-calculation-preview"

export function TaxSettingsForm() {
  const {
    taxSettings,
    setTaxSettings,
    categoryRules,
    setCategoryRules,
    categories,
    isLoading,
    isFetching,
    saveTaxSettings
  } = useTaxSettings()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await saveTaxSettings()
  }

  return (
    <TooltipProvider>
      {isFetching ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8 w-full max-w-full overflow-x-hidden">
          <GlobalTaxSettings 
            taxSettings={taxSettings} 
            setTaxSettings={setTaxSettings} 
          />
          
          <StoreLocationSettings 
            taxSettings={taxSettings} 
            setTaxSettings={setTaxSettings} 
          />
          
          <CategoryTaxOverrides
            taxSettings={taxSettings}
            categoryRules={categoryRules}
            setCategoryRules={setCategoryRules}
            categories={categories}
          />
          
          <TaxCalculationPreview taxSettings={taxSettings} />

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25"
            >
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? "Saving..." : "Save Tax Settings"}
            </Button>
          </div>
        </form>
      )}
    </TooltipProvider>
  )
}