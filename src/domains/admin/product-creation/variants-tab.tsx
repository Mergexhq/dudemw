"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ColorPicker } from "@/components/ui/color-picker"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, X, Palette, Ruler, Hash, Settings, Package, RefreshCw, AlertTriangle, Check, ChevronDown, ChevronUp } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

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
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [bulkAction, setBulkAction] = useState<'price' | 'mrp' | 'stock' | 'active'>('price')
  const [bulkValue, setBulkValue] = useState('')
  const [optionsExpanded, setOptionsExpanded] = useState(true)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)

  // Custom dropdown states for bulk edit dialog
  const [fieldDropdownOpen, setFieldDropdownOpen] = useState(false)
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const fieldDropdownRef = useRef<HTMLDivElement>(null)
  const statusDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fieldDropdownRef.current && !fieldDropdownRef.current.contains(event.target as Node)) {
        setFieldDropdownOpen(false)
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setStatusDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Calculate if we can generate variants
  const canGenerateVariants = useMemo(() => {
    return options.length > 0 &&
      options.every(opt => opt.name && opt.values.length > 0) &&
      options.every(opt => opt.values.every(v => v.name))
  }, [options])

  // Calculate expected variant count
  const expectedVariantCount = useMemo(() => {
    if (!canGenerateVariants) return 0
    return options.reduce((total, opt) => total * opt.values.length, 1)
  }, [options, canGenerateVariants])

  // Check if variants are locked (already generated)
  const variantsLocked = variants.length > 0

  const addOption = (type: 'color' | 'size' | 'custom' = 'custom') => {
    const newOption: VariantOption = {
      id: `option-${Date.now()}`,
      name: type === 'color' ? 'Color' : type === 'size' ? 'Size' : '',
      type,
      values: []
    }
    onOptionsChange([...options, newOption])
  }

  const updateOptionName = (optionId: string, name: string) => {
    onOptionsChange(
      options.map(option =>
        option.id === optionId ? { ...option, name } : option
      )
    )
  }

  const removeOption = (optionId: string) => {
    onOptionsChange(options.filter(option => option.id !== optionId))
  }

  const addOptionValue = (optionId: string, valueData?: Partial<VariantValue>) => {
    const newValue: VariantValue = {
      id: `value-${Date.now()}`,
      name: "",
      ...valueData
    }

    onOptionsChange(
      options.map(opt =>
        opt.id === optionId
          ? { ...opt, values: [...opt.values, newValue] }
          : opt
      )
    )
  }

  const addPresetSizes = (optionId: string, sizeType: 'numbers' | 'letters') => {
    const presetSizes = {
      numbers: ['28', '30', '32', '34', '36', '38', '40', '42'],
      letters: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
    }

    const newValues: VariantValue[] = presetSizes[sizeType].map(size => ({
      id: `value-${Date.now()}-${size}`,
      name: size,
      sizeType
    }))

    onOptionsChange(
      options.map(option =>
        option.id === optionId
          ? { ...option, values: [...option.values, ...newValues] }
          : option
      )
    )
  }

  const updateOptionValue = (optionId: string, valueId: string, updates: Partial<VariantValue>) => {
    onOptionsChange(
      options.map(option =>
        option.id === optionId
          ? {
            ...option,
            values: option.values.map(value =>
              value.id === valueId ? { ...value, ...updates } : value
            )
          }
          : option
      )
    )
  }

  const removeOptionValue = (optionId: string, valueId: string) => {
    onOptionsChange(
      options.map(option =>
        option.id === optionId
          ? { ...option, values: option.values.filter(value => value.id !== valueId) }
          : option
      )
    )
  }

  const generateVariants = () => {
    if (options.length === 0) return

    const combinations: { [optionId: string]: string }[] = []

    const generateCombinations = (optionIndex: number, currentCombination: { [optionId: string]: string }) => {
      if (optionIndex >= options.length) {
        combinations.push({ ...currentCombination })
        return
      }

      const option = options[optionIndex]
      for (const value of option.values) {
        generateCombinations(optionIndex + 1, {
          ...currentCombination,
          [option.id]: value.id
        })
      }
    }

    generateCombinations(0, {})

    // Helper function to sanitize SKU parts
    const sanitizeForSKU = (text: string): string => {
      return text
        .toUpperCase()
        .replace(/[–—-]/g, '-')        // Replace all dash types with hyphen
        .replace(/[,;]/g, '-')          // Replace commas/semicolons with hyphen
        .replace(/\s+/g, '-')           // Replace spaces with hyphen
        .replace(/[^A-Z0-9-]/g, '')     // Remove any non-alphanumeric except hyphen
        .replace(/-+/g, '-')            // Collapse multiple hyphens
        .replace(/^-|-$/g, '')          // Remove leading/trailing hyphens
    }

    const newVariants: ProductVariant[] = combinations.map((combination, index) => {
      const variantName = options.map(option => {
        const valueId = combination[option.id]
        const value = option.values.find(v => v.id === valueId)
        return value?.name || ""
      }).join(" / ")

      // Generate SKU with sanitization and unique identifier
      const skuBase = options.map(option => {
        const valueId = combination[option.id]
        const value = option.values.find(v => v.id === valueId)
        return sanitizeForSKU(value?.name || "")
      }).join("-")

      const sku = `PRODUCT-${skuBase}-${index}`

      return {
        id: `variant-${Date.now()}-${index}`,
        name: variantName,
        sku,
        price: "",
        mrp: "",
        stock: "0",
        active: true,
        combinations: combination
      }
    })

    onVariantsChange(newVariants)
    setOptionsExpanded(false) // Collapse options after generation
  }

  const resetVariants = () => {
    onVariantsChange([])
    setOptionsExpanded(true)
    setResetDialogOpen(false)
  }

  const updateVariant = (variantId: string, updates: Partial<ProductVariant>) => {
    onVariantsChange(
      variants.map(variant =>
        variant.id === variantId ? { ...variant, ...updates } : variant
      )
    )
  }

  const bulkUpdateVariants = (field: keyof ProductVariant, value: string | boolean) => {
    onVariantsChange(
      variants.map(variant => ({ ...variant, [field]: value }))
    )
  }

  const handleBulkAction = () => {
    if (bulkAction === 'active') {
      bulkUpdateVariants('active', bulkValue === 'true')
    } else {
      bulkUpdateVariants(bulkAction, bulkValue)
    }
    setBulkDialogOpen(false)
    setBulkValue('')
  }

  const isColorOption = (option: VariantOption) => {
    return option.type === 'color' || option.name.toLowerCase().includes("color") || option.name.toLowerCase().includes("colour")
  }

  const isSizeOption = (option: VariantOption) => {
    return option.type === 'size' || option.name.toLowerCase().includes("size")
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Variant Mode Selector */}
      <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-5 w-5 text-red-600" />
            Product Type
          </CardTitle>
          <CardDescription className="text-gray-600">
            Does this product have multiple variants (colors, sizes, etc.)?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={variantMode}
            onValueChange={(value: VariantMode) => {
              onVariantModeChange(value)
              if (value === 'single') {
                // Clear variants when switching to single mode
                onOptionsChange([])
                onVariantsChange([])
              }
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div
              className={`flex items-start space-x-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${variantMode === 'single'
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 hover:border-gray-300'
                }`}
              onClick={() => {
                onVariantModeChange('single')
                onOptionsChange([])
                onVariantsChange([])
              }}
            >
              <RadioGroupItem value="single" id="single" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="single" className="text-base font-semibold cursor-pointer">
                  Single Product
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  This product has no variants. One price, one stock level.
                </p>
                {variantMode === 'single' && (
                  <Badge className="mt-2 bg-red-600">Selected</Badge>
                )}
              </div>
            </div>

            <div
              className={`flex items-start space-x-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${variantMode === 'variants'
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 hover:border-gray-300'
                }`}
              onClick={() => onVariantModeChange('variants')}
            >
              <RadioGroupItem value="variants" id="variants" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="variants" className="text-base font-semibold cursor-pointer">
                  Product with Variants
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Multiple options like colors, sizes, styles, etc.
                </p>
                {variantMode === 'variants' && (
                  <Badge className="mt-2 bg-red-600">Selected</Badge>
                )}
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Single Product Mode - No configuration needed */}
      {variantMode === 'single' && (
        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-green-50 border-green-100/50">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Single Product Mode</h3>
              <p className="text-sm text-gray-600">
                No variants needed. Set pricing and inventory in the respective tabs.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Variants Mode - Configuration */}
      {variantMode === 'variants' && (
        <>
          {/* Step 2: Variant Options */}
          <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
            <Collapsible open={optionsExpanded} onOpenChange={setOptionsExpanded}>
              <CardHeader className="cursor-pointer" onClick={() => setOptionsExpanded(!optionsExpanded)}>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Hash className="h-5 w-5 text-red-600" />
                      Variant Options
                      {variantsLocked && (
                        <Badge variant="secondary" className="ml-2">
                          {options.length} option{options.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      {variantsLocked
                        ? "Options are locked. Reset variants to modify."
                        : "Define the options (like Color, Size) that create variants"
                      }
                    </CardDescription>
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      {optionsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </CardHeader>

              <CollapsibleContent>
                <CardContent className="space-y-6">
                  {/* Option List */}
                  {options.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                      <Hash className="mx-auto h-12 w-12 text-gray-300" />
                      <p className="text-lg font-medium mt-4 text-gray-900">No options added yet</p>
                      <p className="text-sm text-gray-600 mt-1 mb-4">
                        Add options like Color or Size to create variants
                      </p>
                      <div className="flex justify-center gap-2">
                        <Button
                          onClick={() => addOption('color')}
                          variant="outline"
                          disabled={variantsLocked}
                        >
                          <Palette className="mr-2 h-4 w-4" />
                          Add Colors
                        </Button>
                        <Button
                          onClick={() => addOption('size')}
                          variant="outline"
                          disabled={variantsLocked}
                        >
                          <Ruler className="mr-2 h-4 w-4" />
                          Add Sizes
                        </Button>
                        <Button
                          onClick={() => addOption('custom')}
                          variant="outline"
                          disabled={variantsLocked}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Custom Option
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {options.map((option, optionIndex) => (
                        <div
                          key={option.id}
                          className={`p-4 border rounded-xl space-y-4 ${variantsLocked
                            ? 'bg-gray-50 border-gray-200'
                            : 'border-gray-200 bg-white'
                            }`}
                        >
                          {/* Option Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center text-sm font-bold text-red-600">
                                {optionIndex + 1}
                              </div>
                              {variantsLocked ? (
                                <span className="font-medium text-gray-900">{option.name}</span>
                              ) : (
                                <Input
                                  placeholder="Option name (e.g., Color, Size)"
                                  value={option.name}
                                  onChange={(e) => updateOptionName(option.id, e.target.value)}
                                  className="max-w-xs"
                                />
                              )}
                              {isColorOption(option) && (
                                <Badge variant="secondary" className="text-xs">
                                  <Palette className="w-3 h-3 mr-1" />
                                  Color
                                </Badge>
                              )}
                              {isSizeOption(option) && (
                                <Badge variant="secondary" className="text-xs">
                                  <Ruler className="w-3 h-3 mr-1" />
                                  Size
                                </Badge>
                              )}
                            </div>
                            {!variantsLocked && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeOption(option.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          {/* Size Presets */}
                          {isSizeOption(option) && !variantsLocked && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">Quick add:</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addPresetSizes(option.id, 'letters')}
                              >
                                XS-XXL
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addPresetSizes(option.id, 'numbers')}
                              >
                                28-42
                              </Button>
                            </div>
                          )}

                          {/* Option Values */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">
                              Values ({option.values.length})
                            </Label>
                            <div className="flex flex-wrap gap-2">
                              {option.values.map((value) => (
                                <div
                                  key={value.id}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${variantsLocked
                                    ? 'bg-gray-100 border-gray-200'
                                    : 'bg-white border-gray-200'
                                    }`}
                                >
                                  {isColorOption(option) && (
                                    <div
                                      className="w-5 h-5 rounded border border-gray-300"
                                      style={{ backgroundColor: value.hexColor || "#000000" }}
                                    />
                                  )}
                                  {variantsLocked ? (
                                    <span className="text-sm font-medium">{value.name}</span>
                                  ) : (
                                    <>
                                      <Input
                                        placeholder={isColorOption(option) ? "Color name" : "Value"}
                                        value={value.name}
                                        onChange={(e) => updateOptionValue(option.id, value.id, { name: e.target.value })}
                                        className="w-24 h-8 text-sm"
                                      />
                                      {isColorOption(option) && (
                                        <ColorPicker
                                          label=""
                                          color={value.hexColor || "#000000"}
                                          onChange={(color) => updateOptionValue(option.id, value.id, { hexColor: color })}
                                          isEyeDroppper={true}
                                          className="w-auto"
                                        />
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeOptionValue(option.id, value.id)}
                                        className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              ))}

                              {!variantsLocked && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addOptionValue(option.id, isColorOption(option) ? { hexColor: "#000000" } : {})}
                                  className="h-10"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Add More Options */}
                      {!variantsLocked && options.length < 3 && (
                        <div className="flex gap-2">
                          {!options.some(opt => isColorOption(opt)) && (
                            <Button onClick={() => addOption('color')} variant="outline" size="sm">
                              <Palette className="mr-2 h-3 w-3" />
                              Add Colors
                            </Button>
                          )}
                          {!options.some(opt => isSizeOption(opt)) && (
                            <Button onClick={() => addOption('size')} variant="outline" size="sm">
                              <Ruler className="mr-2 h-3 w-3" />
                              Add Sizes
                            </Button>
                          )}
                          <Button onClick={() => addOption('custom')} variant="outline" size="sm">
                            <Plus className="mr-2 h-3 w-3" />
                            Custom Option
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Generate Variants Button */}
                  {!variantsLocked && options.length > 0 && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          {canGenerateVariants ? (
                            <p className="text-sm text-green-600 flex items-center gap-2">
                              <Check className="h-4 w-4" />
                              Ready! This will create <strong>{expectedVariantCount}</strong> variants
                            </p>
                          ) : (
                            <p className="text-sm text-amber-600 flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" />
                              Fill in all option names and add at least one value to each
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={generateVariants}
                          disabled={!canGenerateVariants}
                          className="bg-red-600 hover:bg-red-700 text-white"
                          size="lg"
                        >
                          Generate {expectedVariantCount} Variants
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Reset Button when locked */}
                  {variantsLocked && (
                    <div className="pt-4 border-t border-gray-200">
                      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reset Variants
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reset Variants?</DialogTitle>
                            <DialogDescription>
                              This will delete all {variants.length} variants and allow you to modify options.
                              All variant data (prices, stock, SKUs) will be lost.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button variant="destructive" onClick={resetVariants}>
                              Reset All Variants
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Step 3: Variant Matrix */}
          {variants.length > 0 && (
            <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Settings className="h-5 w-5 text-red-600" />
                      Variant Matrix
                      <Badge className="bg-red-600 text-white ml-2">
                        {variants.length} variants
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Set pricing, stock, and SKU for each variant
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Bulk Actions */}
                <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Bulk actions:</span>

                  <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Settings className="mr-2 h-3 w-3" />
                        Set All Prices
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Bulk Edit Variants</DialogTitle>
                        <DialogDescription>
                          Apply the same value to all {variants.length} variants.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        {/* Custom Field Dropdown */}
                        <div className="space-y-2">
                          <Label>Field</Label>
                          <div ref={fieldDropdownRef} className="relative">
                            <button
                              type="button"
                              onClick={() => setFieldDropdownOpen(!fieldDropdownOpen)}
                              className="flex h-10 w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            >
                              <span>
                                {bulkAction === 'price' && 'Price (₹)'}
                                {bulkAction === 'mrp' && 'MRP (₹)'}
                                {bulkAction === 'stock' && 'Stock'}
                                {bulkAction === 'active' && 'Active Status'}
                              </span>
                              <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${fieldDropdownOpen ? "rotate-180" : ""}`} />
                            </button>

                            {fieldDropdownOpen && (
                              <div className="absolute top-full left-0 right-0 z-50 mt-1 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                                {[
                                  { value: 'price', label: 'Price (₹)' },
                                  { value: 'mrp', label: 'MRP (₹)' },
                                  { value: 'stock', label: 'Stock' },
                                  { value: 'active', label: 'Active Status' },
                                ].map((item) => (
                                  <button
                                    key={item.value}
                                    type="button"
                                    onClick={() => {
                                      setBulkAction(item.value as 'price' | 'mrp' | 'stock' | 'active')
                                      setBulkValue('')
                                      setFieldDropdownOpen(false)
                                    }}
                                    className={`flex w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-red-50 ${bulkAction === item.value ? "bg-red-50 text-red-700" : "text-gray-700"}`}
                                  >
                                    <span>{item.label}</span>
                                    {bulkAction === item.value && (
                                      <Check className="h-4 w-4 text-red-600" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Custom Value Input/Dropdown */}
                        <div className="space-y-2">
                          <Label>Value</Label>
                          {bulkAction === 'active' ? (
                            <div ref={statusDropdownRef} className="relative">
                              <button
                                type="button"
                                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                                className="flex h-10 w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                              >
                                <span>{bulkValue === 'true' ? 'Active' : bulkValue === 'false' ? 'Inactive' : 'Select status'}</span>
                                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${statusDropdownOpen ? "rotate-180" : ""}`} />
                              </button>

                              {statusDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 z-50 mt-1 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setBulkValue('true')
                                      setStatusDropdownOpen(false)
                                    }}
                                    className={`flex w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-red-50 ${bulkValue === 'true' ? "bg-red-50 text-red-700" : "text-gray-700"}`}
                                  >
                                    <span>Active</span>
                                    {bulkValue === 'true' && <Check className="h-4 w-4 text-red-600" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setBulkValue('false')
                                      setStatusDropdownOpen(false)
                                    }}
                                    className={`flex w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-red-50 ${bulkValue === 'false' ? "bg-red-50 text-red-700" : "text-gray-700"}`}
                                  >
                                    <span>Inactive</span>
                                    {bulkValue === 'false' && <Check className="h-4 w-4 text-red-600" />}
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <Input
                              type="number"
                              step={bulkAction === 'stock' ? '1' : '0.01'}
                              value={bulkValue}
                              onChange={(e) => setBulkValue(e.target.value)}
                              placeholder={`Enter ${bulkAction} value`}
                            />
                          )}
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleBulkAction} disabled={!bulkValue} className="bg-red-600 hover:bg-red-700">
                          Apply to All
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => bulkUpdateVariants("active", true)}
                  >
                    Enable All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => bulkUpdateVariants("active", false)}
                  >
                    Disable All
                  </Button>
                </div>

                {/* Variants Table */}
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Variant</TableHead>
                        <TableHead className="font-semibold">SKU</TableHead>
                        <TableHead className="font-semibold">Price (₹)</TableHead>
                        <TableHead className="font-semibold">MRP (₹)</TableHead>
                        <TableHead className="font-semibold">Stock</TableHead>
                        <TableHead className="font-semibold text-center">Active</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variants.map((variant) => (
                        <TableRow key={variant.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {/* Show color swatch if applicable */}
                              {options.find(opt => isColorOption(opt))?.values.find(v =>
                                v.id === variant.combinations[options.find(opt => isColorOption(opt))?.id || '']
                              )?.hexColor && (
                                  <div
                                    className="w-4 h-4 rounded border border-gray-300"
                                    style={{
                                      backgroundColor: options.find(opt => isColorOption(opt))?.values.find(v =>
                                        v.id === variant.combinations[options.find(opt => isColorOption(opt))?.id || '']
                                      )?.hexColor
                                    }}
                                  />
                                )}
                              {variant.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={variant.sku}
                              onChange={(e) => updateVariant(variant.id, { sku: e.target.value })}
                              className="w-full min-w-[140px]"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={variant.price}
                              onChange={(e) => updateVariant(variant.id, { price: e.target.value })}
                              className="w-full min-w-[100px]"
                              placeholder="0.00"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={variant.mrp}
                              onChange={(e) => updateVariant(variant.id, { mrp: e.target.value })}
                              className="w-full min-w-[100px]"
                              placeholder="0.00"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={variant.stock}
                              onChange={(e) => updateVariant(variant.id, { stock: e.target.value })}
                              className="w-full min-w-[80px]"
                              placeholder="0"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={variant.active}
                              onCheckedChange={(checked) => updateVariant(variant.id, { active: checked })}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Summary */}
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      {variants.filter(v => v.active).length} active variants,
                      {variants.filter(v => v.price).length} with pricing set
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}