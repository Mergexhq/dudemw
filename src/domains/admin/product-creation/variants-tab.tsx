"use client"

/**
 * VariantsTab - Refactored Version
 * Main component for managing product variants
 * Reduced from 966 lines to ~200 lines by extracting components
 */

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, AlertTriangle, Package } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp } from "lucide-react"

// Extracted components
import { VariantOptionsManager } from "./components/VariantOptionsManager"
import { VariantMatrixTable } from "./components/VariantMatrixTable"
import { BulkEditDialog } from "./components/BulkEditDialog"

// Extracted hook
import { useVariantGeneration } from "@/hooks/useVariantGeneration"

interface VariantOption {
  id: string
  name: string
  type: 'color' | 'size' | 'custom'
  values: VariantValue[]
}

interface VariantValue {
  id: string
  name: string
  hexColor?: string
  swatchImage?: string
  sizeType?: 'numbers' | 'letters' | 'custom'
}

interface ProductVariant {
  id: string
  name: string
  sku: string
  price: string
  mrp: string
  stock: string
  active: boolean
  image?: string
  combinations: { [optionId: string]: string }
}

type VariantMode = 'single' | 'variants'

interface VariantsTabProps {
  options: VariantOption[]
  variants: ProductVariant[]
  variantMode: VariantMode
  onOptionsChange: (options: VariantOption[]) => void
  onVariantsChange: (variants: ProductVariant[]) => void
  onVariantModeChange: (mode: VariantMode) => void
}

export function VariantsTab({
  options,
  variants,
  variantMode,
  onOptionsChange,
  onVariantsChange,
  onVariantModeChange
}: VariantsTabProps) {
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [optionsExpanded, setOptionsExpanded] = useState(true)

  // Use the extracted variant generation hook
  const { generateVariants, mergeVariants, needsRegeneration } = useVariantGeneration(options, variants)

  // Handle variant generation
  const handleGenerateVariants = () => {
    const newVariants = generateVariants()
    const merged = mergeVariants(newVariants)
    onVariantsChange(merged)
  }

  // Handle variant reset
  const handleResetVariants = () => {
    onVariantsChange([])
    setResetDialogOpen(false)
  }

  // Handle individual variant update
  const handleVariantUpdate = (variantId: string, updates: Partial<ProductVariant>) => {
    onVariantsChange(
      variants.map(v => v.id === variantId ? { ...v, ...updates } : v)
    )
  }

  // Handle bulk update
  const handleBulkUpdate = (field: keyof ProductVariant, value: string | boolean) => {
    onVariantsChange(
      variants.map(v => ({ ...v, [field]: value }))
    )
  }

  return (
    <div className="space-y-6">
      {/* Variant Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Product Type</CardTitle>
          <CardDescription>
            Choose whether this product has variants or is a single item
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={variantMode} onValueChange={(value) => onVariantModeChange(value as VariantMode)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="single" id="single" className="text-red-600 border-gray-400 data-[state=checked]:border-red-600 [&_svg]:!fill-red-600 [&_svg]:text-red-600" />
              <Label htmlFor="single" className="font-normal cursor-pointer">
                Single Product (No variants)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="variants" id="variants" className="text-red-600 border-gray-400 data-[state=checked]:border-red-600 [&_svg]:!fill-red-600 [&_svg]:text-red-600" />
              <Label htmlFor="variants" className="font-normal cursor-pointer">
                Product with Variants (e.g., different colors, sizes)
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Variant Options & Management */}
      {variantMode === 'variants' && (
        <>
          {/* Options Section - Collapsible */}
          <Collapsible open={optionsExpanded} onOpenChange={setOptionsExpanded}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Variant Options</CardTitle>
                      <CardDescription>
                        {options.length === 0
                          ? "Add options to create variants"
                          : `${options.length} option${options.length !== 1 ? 's' : ''} defined`}
                      </CardDescription>
                    </div>
                    {optionsExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <VariantOptionsManager
                    options={options}
                    onOptionsChange={onOptionsChange}
                  />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Generate Variants Button */}
          {options.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Generate Variants</p>
                    <p className="text-sm text-muted-foreground">
                      Create all possible combinations from your options
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {variants.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setResetDialogOpen(true)}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reset
                      </Button>
                    )}
                    <Button
                      type="button"
                      onClick={handleGenerateVariants}
                    >
                      <Package className="mr-2 h-4 w-4" />
                      {variants.length > 0 ? 'Regenerate' : 'Generate'} Variants
                    </Button>
                  </div>
                </div>

                {needsRegeneration && variants.length > 0 && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span>
                      Options have changed. Regenerate variants to update combinations.
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Variants Table */}
          {variants.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Variant Matrix</h3>
                  <p className="text-sm text-muted-foreground">
                    {variants.length} variant{variants.length !== 1 ? 's' : ''} generated
                  </p>
                </div>
                <BulkEditDialog
                  variants={variants}
                  onBulkUpdate={handleBulkUpdate}
                />
              </div>

              <VariantMatrixTable
                variants={variants}
                onVariantUpdate={handleVariantUpdate}
              />
            </div>
          )}
        </>
      )}

      {/* Reset Confirmation Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset All Variants?</DialogTitle>
            <DialogDescription>
              This will delete all {variants.length} variants and their data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleResetVariants}>
              Reset Variants
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}