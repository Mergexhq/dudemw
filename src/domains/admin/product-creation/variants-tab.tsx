"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TabsProvider, TabsBtn, TabsContent } from "@/components/core/tab"
import { ColorPicker } from "@/components/ui/color-picker"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, X, Palette, Image, Ruler, Hash, Settings, GripVertical } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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

interface VariantsTabProps {
  options: VariantOption[]
  variants: ProductVariant[]
  onOptionsChange: (options: VariantOption[]) => void
  onVariantsChange: (variants: ProductVariant[]) => void
}

export function VariantsTab({ options, variants, onOptionsChange, onVariantsChange }: VariantsTabProps) {
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [bulkAction, setBulkAction] = useState<'price' | 'mrp' | 'stock' | 'active'>('price')
  const [bulkValue, setBulkValue] = useState('')
  const [draggedCell, setDraggedCell] = useState<{rowId: string, field: string} | null>(null)

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
    // TODO: Regenerate variants when option is removed
  }

  const addOptionValue = (optionId: string, valueData?: Partial<VariantValue>) => {
    const option = options.find(opt => opt.id === optionId)
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
    
    // Generate all combinations
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

    // Create variants from combinations
    const newVariants: ProductVariant[] = combinations.map((combination, index) => {
      const variantName = options.map(option => {
        const valueId = combination[option.id]
        const value = option.values.find(v => v.id === valueId)
        return value?.name || ""
      }).join(" / ")

      const sku = `PRODUCT-${options.map(option => {
        const valueId = combination[option.id]
        const value = option.values.find(v => v.id === valueId)
        return value?.name?.toUpperCase().replace(/\s+/g, "-") || ""
      }).join("-")}`

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

  const handleCornerDrag = (startRowId: string, startField: string, endRowId: string, endField: string) => {
    const startRowIndex = variants.findIndex(v => v.id === startRowId)
    const endRowIndex = variants.findIndex(v => v.id === endRowId)
    
    if (startRowIndex === -1 || endRowIndex === -1) return
    
    const startValue = variants[startRowIndex][startField as keyof ProductVariant]
    const minIndex = Math.min(startRowIndex, endRowIndex)
    const maxIndex = Math.max(startRowIndex, endRowIndex)
    
    // Fill down the value to all selected cells
    const updatedVariants = variants.map((variant, index) => {
      if (index >= minIndex && index <= maxIndex && startField === endField) {
        return { ...variant, [startField]: startValue }
      }
      return variant
    })
    
    onVariantsChange(updatedVariants)
  }

  const isColorOption = (option: VariantOption) => {
    return option.type === 'color' || option.name.toLowerCase().includes("color") || option.name.toLowerCase().includes("colour")
  }

  const isSizeOption = (option: VariantOption) => {
    return option.type === 'size' || option.name.toLowerCase().includes("size")
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Variant Options Setup */}
      <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 dark:from-gray-900 dark:to-red-950/20 border-red-100/50 dark:border-red-900/20 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Product Variants</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Create and manage product variants with colors, sizes, and custom options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TabsProvider defaultValue="current">
            <div className="w-full mb-6">
              <div className="flex items-center w-full dark:bg-red-950/30 bg-red-50 p-1 dark:text-white text-black rounded-md border border-red-100/50 dark:border-red-900/20">
                <TabsBtn value="current" className="flex-1 text-red-600/70 dark:text-red-300/70">
                  <span className="relative z-2 uppercase text-xs font-semibold">Current Options</span>
                </TabsBtn>
                <TabsBtn value="color" className="flex-1 text-red-600/70 dark:text-red-300/70">
                  <span className="relative z-2 uppercase text-xs font-semibold">Color Variants</span>
                </TabsBtn>
                <TabsBtn value="size" className="flex-1 text-red-600/70 dark:text-red-300/70">
                  <span className="relative z-2 uppercase text-xs font-semibold">Size Variants</span>
                </TabsBtn>
              </div>
            </div>

            {/* Current Options Tab */}
            <TabsContent value="current" className="space-y-4">
              {options.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="mb-4">
                    <Hash className="mx-auto h-12 w-12 text-gray-300" />
                  </div>
                  <p className="text-lg font-medium mb-2">No variant options yet</p>
                  <p className="text-sm mb-4">Add color or size variants to get started</p>
                  <div className="flex justify-center space-x-2">
                    <Button onClick={() => addOption('color')} variant="outline">
                      <Palette className="mr-2 h-4 w-4" />
                      Add Colors
                    </Button>
                    <Button onClick={() => addOption('size')} variant="outline">
                      <Ruler className="mr-2 h-4 w-4" />
                      Add Sizes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {options.map((option, optionIndex) => (
                    <div key={option.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1">
                          <Label>Option {optionIndex + 1}:</Label>
                          <Input
                            placeholder="e.g., Color, Size"
                            value={option.name}
                            onChange={(e) => updateOptionName(option.id, e.target.value)}
                            className="max-w-xs"
                          />
                          {isColorOption(option) && (
                            <Badge variant="secondary" className="text-xs">
                              <Palette className="w-3 h-3 mr-1" />
                              Color Option
                            </Badge>
                          )}
                          {isSizeOption(option) && (
                            <Badge variant="secondary" className="text-xs">
                              <Ruler className="w-3 h-3 mr-1" />
                              Size Option
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(option.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Option Values */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Values:</Label>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {option.values.map((value) => (
                            <div key={value.id} className="flex items-center space-x-2">
                              <Input
                                placeholder="e.g., Red, Large"
                                value={value.name}
                                onChange={(e) => updateOptionValue(option.id, value.id, { name: e.target.value })}
                                className="flex-1"
                              />
                              {isColorOption(option) && (
                                <div
                                  className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                                  style={{ backgroundColor: value.hexColor || "#000000" }}
                                  onClick={() => {
                                    // Color picker will be handled in the color tab
                                  }}
                                />
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeOptionValue(option.id, value.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addOptionValue(option.id)}
                          className="w-full"
                        >
                          <Plus className="mr-2 h-3 w-3" />
                          Add Value
                        </Button>
                      </div>
                    </div>
                  ))}

                  {options.length > 0 && options.every(opt => opt.name && opt.values.length > 0) && (
                    <Button
                      onClick={generateVariants}
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                    >
                      Generate Variants ({options.reduce((total, opt) => total * opt.values.length, 1)} combinations)
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Color Variants Tab */}
            <TabsContent value="color" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Color Variants</h3>
                    <p className="text-sm text-gray-600">Add color options with advanced color picker</p>
                  </div>
                  <Button
                    onClick={() => addOption('color')}
                    disabled={options.some(opt => opt.type === 'color')}
                  >
                    <Palette className="mr-2 h-4 w-4" />
                    Add Color Option
                  </Button>
                </div>

                {options.filter(opt => isColorOption(opt)).map((option) => (
                  <div key={option.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{option.name || 'Color'}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(option.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {option.values.map((value) => (
                        <div key={value.id} className="space-y-2">
                          <Input
                            placeholder="Color name"
                            value={value.name}
                            onChange={(e) => updateOptionValue(option.id, value.id, { name: e.target.value })}
                          />
                          <ColorPicker
                            color={value.hexColor || "#000000"}
                            onChange={(color) => updateOptionValue(option.id, value.id, { hexColor: color })}
                            label=""
                            className="w-full"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOptionValue(option.id, value.id)}
                            className="w-full text-red-600 hover:text-red-700"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => addOptionValue(option.id, { hexColor: "#000000" })}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Color
                    </Button>
                  </div>
                ))}

                {!options.some(opt => isColorOption(opt)) && (
                  <div className="text-center py-8 text-gray-500">
                    <Palette className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-lg font-medium mb-2">No color variants</p>
                    <p className="text-sm">Add a color option to start creating color variants</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Size Variants Tab */}
            <TabsContent value="size" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Size Variants</h3>
                    <p className="text-sm text-gray-600">Add size options with preset or custom values</p>
                  </div>
                  <Button
                    onClick={() => addOption('size')}
                    disabled={options.some(opt => opt.type === 'size')}
                  >
                    <Ruler className="mr-2 h-4 w-4" />
                    Add Size Option
                  </Button>
                </div>

                {options.filter(opt => isSizeOption(opt)).map((option) => (
                  <div key={option.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{option.name || 'Size'}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(option.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Preset Size Options */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Quick Add Sizes:</Label>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addPresetSizes(option.id, 'numbers')}
                        >
                          <Hash className="mr-1 h-3 w-3" />
                          Numbers (28-42)
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addPresetSizes(option.id, 'letters')}
                        >
                          Letters (XS-XXL)
                        </Button>
                      </div>
                    </div>

                    {/* Size Values */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Size Values:</Label>
                      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
                        {option.values.map((value) => (
                          <div key={value.id} className="flex items-center space-x-2">
                            <Input
                              placeholder="e.g., M, 32, Custom"
                              value={value.name}
                              onChange={(e) => updateOptionValue(option.id, value.id, { name: e.target.value })}
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOptionValue(option.id, value.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addOptionValue(option.id)}
                        className="w-full"
                      >
                        <Plus className="mr-2 h-3 w-3" />
                        Add Custom Size
                      </Button>
                    </div>
                  </div>
                ))}

                {!options.some(opt => isSizeOption(opt)) && (
                  <div className="text-center py-8 text-gray-500">
                    <Ruler className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-lg font-medium mb-2">No size variants</p>
                    <p className="text-sm">Add a size option to start creating size variants</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </TabsProvider>
        </CardContent>
      </Card>

      {/* Variant Matrix */}
      {variants.length > 0 && (
        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 dark:from-gray-900 dark:to-red-950/20 border-red-100/50 dark:border-red-900/20 hover:shadow-md transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
              Variant Matrix ({variants.length} variants)
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Manage pricing, stock, and settings for each variant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Bulk Actions */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <span className="text-sm font-medium">Bulk actions:</span>
              
              <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-3 w-3" />
                    Bulk Edit
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Bulk Edit Variants</DialogTitle>
                    <DialogDescription>
                      Apply the same value to all variants for the selected field.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="field" className="text-right">
                        Field
                      </Label>
                      <Select value={bulkAction} onValueChange={(value: 'price' | 'mrp' | 'stock' | 'active') => setBulkAction(value)}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="price">Price (₹)</SelectItem>
                          <SelectItem value="mrp">MRP (₹)</SelectItem>
                          <SelectItem value="stock">Stock</SelectItem>
                          <SelectItem value="active">Active Status</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="value" className="text-right">
                        Value
                      </Label>
                      {bulkAction === 'active' ? (
                        <Select value={bulkValue} onValueChange={setBulkValue}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Active</SelectItem>
                            <SelectItem value="false">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id="value"
                          type={bulkAction === 'stock' ? 'number' : 'number'}
                          step={bulkAction === 'stock' ? '1' : '0.01'}
                          value={bulkValue}
                          onChange={(e) => setBulkValue(e.target.value)}
                          className="col-span-3"
                          placeholder={`Enter ${bulkAction} value`}
                        />
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" onClick={handleBulkAction} disabled={!bulkValue}>
                      Apply to All Variants
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variant</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Price (₹)</TableHead>
                    <TableHead>MRP (₹)</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Image</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variants.map((variant) => (
                    <TableRow key={variant.id} data-variant-id={variant.id}>
                      <TableCell className="font-medium">{variant.name}</TableCell>
                      <TableCell>
                        <Input
                          value={variant.sku}
                          onChange={(e) => updateVariant(variant.id, { sku: e.target.value })}
                          className="w-full min-w-[150px]"
                        />
                      </TableCell>
                      <TableCell className="relative group">
                        <Input
                          type="number"
                          step="0.01"
                          value={variant.price}
                          onChange={(e) => updateVariant(variant.id, { price: e.target.value })}
                          className="w-full min-w-[100px]"
                        />
                        <div
                          className="absolute bottom-0 right-0 w-2 h-2 bg-red-600 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
                          draggable
                          onDragStart={() => setDraggedCell({ rowId: variant.id, field: 'price' })}
                          onDragEnd={(e) => {
                            const target = e.target as HTMLElement
                            const cell = target.closest('td')
                            const row = cell?.closest('tr')
                            if (row && draggedCell) {
                              const targetVariantId = row.getAttribute('data-variant-id')
                              if (targetVariantId) {
                                handleCornerDrag(draggedCell.rowId, draggedCell.field, targetVariantId, 'price')
                              }
                            }
                            setDraggedCell(null)
                          }}
                        />
                      </TableCell>
                      <TableCell className="relative group">
                        <Input
                          type="number"
                          step="0.01"
                          value={variant.mrp}
                          onChange={(e) => updateVariant(variant.id, { mrp: e.target.value })}
                          className="w-full min-w-[100px]"
                        />
                        <div
                          className="absolute bottom-0 right-0 w-2 h-2 bg-red-600 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
                          draggable
                          onDragStart={() => setDraggedCell({ rowId: variant.id, field: 'mrp' })}
                          onDragEnd={(e) => {
                            const target = e.target as HTMLElement
                            const cell = target.closest('td')
                            const row = cell?.closest('tr')
                            if (row && draggedCell) {
                              const targetVariantId = row.getAttribute('data-variant-id')
                              if (targetVariantId) {
                                handleCornerDrag(draggedCell.rowId, draggedCell.field, targetVariantId, 'mrp')
                              }
                            }
                            setDraggedCell(null)
                          }}
                        />
                      </TableCell>
                      <TableCell className="relative group">
                        <Input
                          type="number"
                          value={variant.stock}
                          onChange={(e) => updateVariant(variant.id, { stock: e.target.value })}
                          className="w-full min-w-[80px]"
                        />
                        <div
                          className="absolute bottom-0 right-0 w-2 h-2 bg-red-600 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
                          draggable
                          onDragStart={() => setDraggedCell({ rowId: variant.id, field: 'stock' })}
                          onDragEnd={(e) => {
                            const target = e.target as HTMLElement
                            const cell = target.closest('td')
                            const row = cell?.closest('tr')
                            if (row && draggedCell) {
                              const targetVariantId = row.getAttribute('data-variant-id')
                              if (targetVariantId) {
                                handleCornerDrag(draggedCell.rowId, draggedCell.field, targetVariantId, 'stock')
                              }
                            }
                            setDraggedCell(null)
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={variant.active}
                          onCheckedChange={(checked) => updateVariant(variant.id, { active: checked })}
                        />
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Image className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}