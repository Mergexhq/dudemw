/**
 * VariantOptionsManager Component
 * Manages variant options (color, size, custom) with add/edit/remove functionality
 * Extracted from variants-tab.tsx
 */

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ColorPicker } from "@/components/ui/color-picker"
import { Plus, X, Palette, Ruler, Hash } from "lucide-react"

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

interface VariantOptionsManagerProps {
    options: VariantOption[]
    onOptionsChange: (options: VariantOption[]) => void
}

const SIZE_PRESETS = {
    numbers: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
    letters: ['28', '30', '32', '34', '36', '38', '40', '42']
}

export function VariantOptionsManager({ options, onOptionsChange }: VariantOptionsManagerProps) {
    const addOption = (type: 'color' | 'size' | 'custom' = 'custom') => {
        const newOption: VariantOption = {
            id: `option-${Date.now()}`,
            name: type === 'color' ? 'Color' : type === 'size' ? 'Size' : 'Option',
            type,
            values: []
        }
        onOptionsChange([...options, newOption])
    }

    const updateOptionName = (optionId: string, name: string) => {
        onOptionsChange(
            options.map(opt => opt.id === optionId ? { ...opt, name } : opt)
        )
    }

    const removeOption = (optionId: string) => {
        onOptionsChange(options.filter(opt => opt.id !== optionId))
    }

    const addOptionValue = (optionId: string, valueData?: Partial<VariantValue>) => {
        onOptionsChange(
            options.map(opt => {
                if (opt.id === optionId) {
                    const newValue: VariantValue = {
                        id: `value-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                        name: valueData?.name || '',
                        ...valueData
                    }
                    return { ...opt, values: [...opt.values, newValue] }
                }
                return opt
            })
        )
    }

    const addPresetSizes = (optionId: string, sizeType: 'numbers' | 'letters') => {
        const presetSizes = SIZE_PRESETS[sizeType]
        onOptionsChange(
            options.map(opt => {
                if (opt.id === optionId) {
                    const newValues = presetSizes.map(size => ({
                        id: `value-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                        name: size,
                        sizeType
                    }))
                    return { ...opt, values: newValues }
                }
                return opt
            })
        )
    }

    const updateOptionValue = (optionId: string, valueId: string, updates: Partial<VariantValue>) => {
        onOptionsChange(
            options.map(opt => {
                if (opt.id === optionId) {
                    return {
                        ...opt,
                        values: opt.values.map(val =>
                            val.id === valueId ? { ...val, ...updates } : val
                        )
                    }
                }
                return opt
            })
        )
    }

    const removeOptionValue = (optionId: string, valueId: string) => {
        onOptionsChange(
            options.map(opt => {
                if (opt.id === optionId) {
                    return { ...opt, values: opt.values.filter(val => val.id !== valueId) }
                }
                return opt
            })
        )
    }

    const isColorOption = (option: VariantOption) => option.type === 'color'
    const isSizeOption = (option: VariantOption) => option.type === 'size'

    return (
        <Card>
            <CardHeader>
                <CardTitle>Variant Options</CardTitle>
                <CardDescription>
                    Define options like color, size, or material to create product variants
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Add Option Buttons */}
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addOption('color')}
                    >
                        <Palette className="mr-2 h-4 w-4" />
                        Add Color
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addOption('size')}
                    >
                        <Ruler className="mr-2 h-4 w-4" />
                        Add Size
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addOption('custom')}
                    >
                        <Hash className="mr-2 h-4 w-4" />
                        Add Custom
                    </Button>
                </div>

                {/* Options List */}
                {options.map((option) => (
                    <div key={option.id} className="space-y-4 rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Input
                                    value={option.name}
                                    onChange={(e) => updateOptionName(option.id, e.target.value)}
                                    className="w-40"
                                    placeholder="Option name"
                                />
                                <Badge variant="secondary">
                                    {option.type === 'color' && <Palette className="mr-1 h-3 w-3" />}
                                    {option.type === 'size' && <Ruler className="mr-1 h-3 w-3" />}
                                    {option.type === 'custom' && <Hash className="mr-1 h-3 w-3" />}
                                    {option.type}
                                </Badge>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeOption(option.id)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Size Presets */}
                        {isSizeOption(option) && option.values.length === 0 && (
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addPresetSizes(option.id, 'numbers')}
                                >
                                    Use Letter Sizes (XS-3XL)
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addPresetSizes(option.id, 'letters')}
                                >
                                    Use Number Sizes (28-42)
                                </Button>
                            </div>
                        )}

                        {/* Values */}
                        <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Values</Label>
                            <div className="space-y-2">
                                {option.values.map((value) => (
                                    <div key={value.id} className="flex items-center gap-2">
                                        {isColorOption(option) && (
                                            <ColorPicker
                                                label="Color"
                                                color={value.hexColor || '#000000'}
                                                onChange={(color) =>
                                                    updateOptionValue(option.id, value.id, { hexColor: color })
                                                }
                                            />
                                        )}
                                        <Input
                                            value={value.name}
                                            onChange={(e) =>
                                                updateOptionValue(option.id, value.id, { name: e.target.value })
                                            }
                                            placeholder="Value name"
                                            className="flex-1"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeOptionValue(option.id, value.id)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addOptionValue(option.id)}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Value
                            </Button>
                        </div>
                    </div>
                ))}

                {options.length === 0 && (
                    <div className="rounded-lg border border-dashed p-8 text-center">
                        <p className="text-sm text-muted-foreground">
                            No options added yet. Add color, size, or custom options to create variants.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
