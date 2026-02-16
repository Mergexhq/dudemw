'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ProductService } from '@/lib/services/products'
import { Product } from '@/domains/product'
import { getProductImage } from '@/domains/product/utils/getProductImage'
import { getColorFromProduct } from '@/domains/product/utils/getColorFromProduct'

interface ColorVariantSelectorProps {
    currentProductId: string
    productFamilyId?: string | null
    currentColorName?: string
    currentProduct: Product
}

export default function ColorVariantSelector({
    currentProductId,
    productFamilyId,
    currentColorName,
    currentProduct
}: ColorVariantSelectorProps) {
    const [variants, setVariants] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        async function fetchVariants() {
            if (!productFamilyId) {
                setIsLoading(false)
                return
            }

            setIsLoading(true)
            try {
                const result = await ProductService.getProductsByFamily(
                    currentProductId,
                    productFamilyId,
                    10 // Get up to 10 variants
                )

                if (result.success && result.data) {
                    setVariants(result.data)
                }
            } catch (error) {
                console.error('Error fetching color variants:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchVariants()
    }, [currentProductId, productFamilyId])

    // Don't render if no family ID or no variants found
    if (!productFamilyId || (!isLoading && variants.length === 0)) {
        return null
    }

    // Include current product in the list
    const allVariants = [currentProduct, ...variants]

    // Get display color name
    const displayColorName = currentColorName || getColorFromProduct(currentProduct)

    const handleVariantClick = (product: Product) => {
        if (product.id === currentProductId) return // Already on this product

        // Navigate to the product page
        router.push(`/products/${product.slug}`)
    }

    return (
        <div className="mb-6">
            {/* Label */}
            <div className="mb-3">
                <span className="text-sm font-medium text-gray-700">
                    Choose Color: <span className="text-gray-900 font-semibold">{displayColorName}</span>
                </span>
            </div>

            {/* Color Variant Images */}
            <div className="flex flex-wrap gap-3">
                {allVariants.map((variant) => {
                    const isSelected = variant.id === currentProductId
                    const variantImage = getProductImage(null, variant.images)

                    return (
                        <button
                            key={variant.id}
                            onClick={() => handleVariantClick(variant)}
                            disabled={isSelected}
                            className={`relative w-16 h-16 md:w-20 md:h-20 rounded-md overflow-hidden transition-all duration-200 ${isSelected
                                ? 'border-2 border-black opacity-100'
                                : 'border border-gray-200 hover:border-gray-400 opacity-90 hover:opacity-100'
                                }`}
                            title={variant.title}
                        >
                            <Image
                                src={variantImage || '/images/placeholder-product.jpg'}
                                fill
                                alt={variant.title}
                                className="object-cover"
                                sizes="80px"
                            />
                        </button>
                    )
                })}

                {/* Loading state placeholders - Rendered inline */}
                {isLoading && variants.length === 0 && (
                    <>
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="w-16 h-16 md:w-20 md:h-20 rounded-md bg-gray-100 animate-pulse border border-gray-200"
                            />
                        ))}
                    </>
                )}
            </div>
        </div>
    )
}
