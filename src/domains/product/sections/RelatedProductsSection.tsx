'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { ProductCard } from '@/domains/product'
import { ProductService } from '@/lib/services/products'

interface RelatedProductsSectionProps {
    productId: string
    productFamilyId?: string | null
}

export default function RelatedProductsSection({ productId, productFamilyId }: RelatedProductsSectionProps) {
    const [products, setProducts] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchRelatedProducts() {
            if (!productFamilyId) {
                setIsLoading(false)
                return
            }

            setIsLoading(true)
            try {
                const result = await ProductService.getProductsByFamily(
                    productId,
                    productFamilyId,
                    5  // Show 5 related products max
                )

                if (result.success) {
                    setProducts(result.data || [])
                }
            } catch (error) {
                console.error('Error fetching related products:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchRelatedProducts()
    }, [productId, productFamilyId])

    // Don't render if no family ID or no related products found
    if (!productFamilyId || (!isLoading && products.length === 0)) {
        return null
    }

    if (isLoading) {
        return (
            <section className="py-16 md:py-24 bg-white">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-heading tracking-wider mb-8 text-center">
                        RELATED PRODUCTS
                    </h2>
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                </div>
            </section>
        )
    }

    return (
        <section className="py-16 md:py-24 bg-white">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl md:text-4xl font-heading tracking-wider mb-8 text-center">
                    RELATED PRODUCTS
                </h2>

                {/* Grid layout: 5 columns desktop, 2 columns mobile */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    )
}
