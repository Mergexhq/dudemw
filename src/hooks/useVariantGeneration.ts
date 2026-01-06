/**
 * Custom hook for variant generation logic
 * Extracted from variants-tab.tsx to improve maintainability
 */

import { useMemo, useCallback } from 'react'

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

export function useVariantGeneration(options: VariantOption[], existingVariants: ProductVariant[]) {
    /**
     * Helper function to sanitize SKU parts
     */
    const sanitizeForSKU = useCallback((text: string): string => {
        return text
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .substring(0, 10)
    }, [])

    /**
     * Generate all possible variant combinations from options
     */
    const generateVariants = useCallback((): ProductVariant[] => {
        if (options.length === 0) {
            return []
        }

        const allCombinations: ProductVariant[] = []

        // Recursive function to generate combinations
        function generateCombinations(
            optionIndex: number,
            currentCombination: { [optionId: string]: string }
        ) {
            if (optionIndex === options.length) {
                // Create variant from combination
                const option = options[optionIndex - 1]
                const valueId = currentCombination[option.id]
                const value = option.values.find(v => v.id === valueId)

                if (value) {
                    allCombinations.push({
                        id: `variant-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                        name: Object.entries(currentCombination)
                            .map(([optId, valId]) => {
                                const opt = options.find(o => o.id === optId)
                                const val = opt?.values.find(v => v.id === valId)
                                return val?.name || ''
                            })
                            .filter(Boolean)
                            .join(' / '),
                        sku: Object.entries(currentCombination)
                            .map(([optId, valId]) => {
                                const opt = options.find(o => o.id === optId)
                                const val = opt?.values.find(v => v.id === valId)
                                return sanitizeForSKU(val?.name || '')
                            })
                            .filter(Boolean)
                            .join('-'),
                        price: '',
                        mrp: '',
                        stock: '0',
                        active: true,
                        combinations: currentCombination
                    })
                }
                return
            }

            const currentOption = options[optionIndex]
            for (const value of currentOption.values) {
                generateCombinations(optionIndex + 1, {
                    ...currentCombination,
                    [currentOption.id]: value.id
                })
            }
        }

        generateCombinations(0, {})
        return allCombinations
    }, [options, sanitizeForSKU])

    /**
     * Merge new variants with existing ones
     * Preserves data for variants that still exist
     */
    const mergeVariants = useCallback((newVariants: ProductVariant[]): ProductVariant[] => {
        const merged: ProductVariant[] = []

        for (const newVariant of newVariants) {
            // Check if this combination already exists
            const existing = existingVariants.find(v => {
                return JSON.stringify(v.combinations) === JSON.stringify(newVariant.combinations)
            })

            if (existing) {
                // Preserve existing data
                merged.push(existing)
            } else {
                // Add new variant
                merged.push(newVariant)
            }
        }

        return merged
    }, [existingVariants])

    /**
     * Check if variants need regeneration
     */
    const needsRegeneration = useMemo(() => {
        if (options.length === 0) return false
        if (existingVariants.length === 0) return true

        // Calculate expected variant count
        const expectedCount = options.reduce((acc, opt) => acc * opt.values.length, 1)
        return expectedCount !== existingVariants.length
    }, [options, existingVariants])

    return {
        generateVariants,
        mergeVariants,
        needsRegeneration,
        sanitizeForSKU
    }
}
