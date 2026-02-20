"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, Heart, Check } from 'lucide-react'
import { Product } from '@/domains/product'
import { useCart } from '@/domains/cart'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useWishlist } from '@/domains/wishlist'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

interface QuickAddDialogProps {
    product: Product
    open: boolean
    onOpenChange: (open: boolean) => void
}

// Helper functions
const getSizesFromProduct = (product: Product): string[] => {
    // 1. Try product_options (Standard way)
    const sizeOption = product.product_options?.find((opt: any) => opt.name.toLowerCase() === 'size')
    if (sizeOption?.product_option_values) {
        return sizeOption.product_option_values.map((v: any) => v.name)
    }

    // 2. Fallback: Extract from product_variants
    if (product.product_variants && product.product_variants.length > 0) {
        const uniqueSizes = new Set<string>()

        product.product_variants.forEach((variant: any) => {
            // Try variant options column if it exists and is an array
            if (Array.isArray(variant.options)) {
                const s = variant.options.find((o: any) => o.name.toLowerCase() === 'size')
                if (s && s.value) {
                    uniqueSizes.add(s.value)
                    return
                }
            }

            // Try parsing name if it looks like a size
            const name = variant.name
            if (name) {
                const cleanName = name.trim()
                // Common size patterns: S, M, L, XL, XXL, 28, 30, 32, etc.
                if (/^(XXS|XS|S|M|L|XL|XXL|3XL|4XL|[0-9]{2})$/i.test(cleanName)) {
                    uniqueSizes.add(cleanName)
                }
                // Handle "Color / Size" or "Color - Size" formats
                else {
                    const parts = cleanName.split(/[\/\-]/).map((p: string) => p.trim())
                    const sizePart = parts.find((p: string) => /^(XXS|XS|S|M|L|XL|XXL|3XL|4XL|[0-9]{2})$/i.test(p))
                    if (sizePart) uniqueSizes.add(sizePart)
                }
            }
        })

        if (uniqueSizes.size > 0) {
            // Sort standard sizes
            const sizeOrder = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL']
            return Array.from(uniqueSizes).sort((a, b) => {
                const idxA = sizeOrder.indexOf(a.toUpperCase())
                const idxB = sizeOrder.indexOf(b.toUpperCase())
                if (idxA !== -1 && idxB !== -1) return idxA - idxB
                return a.localeCompare(b)
            })
        }
    }

    return []
}

import { getProduct } from '@/domains/product/actions/get-product'

// ... (imports)

export default function QuickAddDialog({ product: initialProduct, open, onOpenChange }: QuickAddDialogProps) {
    const router = useRouter()
    const { addToCart } = useCart()
    const { isWishlisted, toggleWishlist } = useWishlist()

    const [product, setProduct] = useState<Product>(initialProduct)
    const [isLoading, setIsLoading] = useState(false)

    // Fetch full product details on open to get complete variant/option data
    useEffect(() => {
        if (open) {
            const fetchFullProduct = async () => {
                setIsLoading(true)
                try {
                    const fullProduct = await getProduct(initialProduct.id)
                    if (fullProduct) {
                        setProduct(fullProduct)
                    }
                } catch (error) {
                    console.error('Failed to fetch full product details', error)
                } finally {
                    setIsLoading(false)
                }
            }
            fetchFullProduct()
        } else {
            // Reset to initial product when closed (optional, but good for cleanup)
            setProduct(initialProduct)
        }
    }, [open, initialProduct.id])

    const sizes = getSizesFromProduct(product)

    const [selectedSize, setSelectedSize] = useState<string>('')
    const [quantity, setQuantity] = useState(1)
    const [isAdding, setIsAdding] = useState(false)
    const [showConfirmation, setShowConfirmation] = useState(false)

    const isInWishlist = isWishlisted(product.id)

    // Reset selection when dialog opens
    useEffect(() => {
        if (open) {
            setSelectedSize('')
            setQuantity(1)
            setShowConfirmation(false)
        }
    }, [open])

    const handleAddToCart = async () => {
        if (!selectedSize && sizes.length > 0) {
            toast.error('Please select a size')
            return
        }

        setIsAdding(true)
        try {
            addToCart({
                id: product.id,
                title: product.title,
                price: product.price,
                image: (product.images && product.images[0]) || '',
                size: selectedSize,
                color: '',
                quantity: quantity,
                variantKey: `${product.id}-${selectedSize}`,
            })

            setShowConfirmation(true)
        } catch (error) {
            console.error('Failed to add to cart:', error)
            toast.error('Failed to add to cart')
        } finally {
            setIsAdding(false)
        }
    }

    const totalPrice = product.price * quantity

    // Confirmation Dialog
    if (showConfirmation) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-lg p-6 pt-10">
                    <div className="flex items-start justify-between mb-4">
                        <h2 className="text-lg font-semibold">1 item added to your cart</h2>
                    </div>

                    <div className="flex gap-4 mb-6">
                        <div className="relative w-20 h-24 flex-shrink-0 bg-gray-100 rounded">
                            {product.images && product.images[0] && (
                                <Image
                                    src={product.images[0]}
                                    alt={product.title}
                                    fill
                                    className="object-cover rounded"
                                />
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-sm uppercase mb-2">
                                {product.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-1">
                                Quantity: {quantity}
                            </p>
                            <p className="text-sm font-semibold">
                                Cart Subtotal: <span className="text-black">MRP ₹{totalPrice.toLocaleString()}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => onOpenChange(false)}
                            className="flex-1 py-3 bg-black text-white font-bold rounded hover:bg-gray-900 transition-colors"
                        >
                            CONTINUE SHOPPING
                        </button>
                        <button
                            onClick={() => {
                                onOpenChange(false)
                                router.push('/cart')
                            }}
                            className="flex-1 py-3 bg-red-600 text-white font-bold rounded hover:bg-red-700 transition-colors"
                        >
                            PROCEED TO CART
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    // Price logic
    const currentPrice = product.price
    const originalPrice = product.compare_price || null
    const discountPercent = originalPrice && originalPrice > currentPrice
        ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
        : 0

    // Main Dialog
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl p-8">
                <DialogHeader>
                    <DialogTitle className="text-xl font-normal text-left mb-2">
                        {product.title}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Price and Stock */}
                    <div>
                        <div className="flex flex-wrap items-baseline gap-2 mb-1">
                            <span className="text-2xl font-bold text-black">
                                ₹{currentPrice.toLocaleString()}
                            </span>
                            {originalPrice && discountPercent > 0 && (
                                <>
                                    <span className="text-lg text-gray-500 line-through">
                                        MRP ₹{originalPrice.toLocaleString()}
                                    </span>
                                    <span className="text-lg font-bold text-red-600">
                                        ({discountPercent}% OFF)
                                    </span>
                                </>
                            )}
                        </div>
                        <p className="text-xs text-gray-500">(Inclusive of All Taxes)</p>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1.5 text-green-700">
                                <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center border border-green-200">
                                    <Check className="w-2.5 h-2.5 text-green-700" strokeWidth={3} />
                                </div>
                                <span className="text-sm font-semibold">In stock</span>
                            </div>
                        </div>
                    </div>

                    {/* Size Selection */}
                    {isLoading ? (
                        <div className="space-y-3">
                            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                            <div className="flex gap-2">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-12 h-12 rounded-full bg-gray-100 animate-pulse" />
                                ))}
                            </div>
                        </div>
                    ) : sizes.length > 0 && (
                        <div>
                            <label className="block text-sm font-semibold mb-3 text-gray-900">
                                Size
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {sizes.map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => setSelectedSize(size)}
                                        className={`min-w-[3rem] px-2 h-12 rounded-full border-2 font-medium text-sm transition-all ${selectedSize === size
                                            ? 'border-black bg-black text-white'
                                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                            }`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions Row */}
                    <div className="flex items-center gap-4">
                        {/* Wishlist */}
                        <button
                            onClick={(e) => {
                                e.preventDefault()
                                toggleWishlist(product.id)
                            }}
                            className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all ${isInWishlist
                                ? 'border-red-600 bg-red-600 text-white'
                                : 'border-gray-300 text-gray-700 hover:border-red-600 hover:text-red-600'
                                }`}
                            aria-label="Add to wishlist"
                        >
                            <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-current' : ''}`} />
                        </button>

                        {/* Quantity Selector */}
                        <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-10 h-12 flex items-center justify-center hover:bg-gray-100 text-xl font-semibold"
                            >
                                −
                            </button>
                            <div className="w-12 h-12 flex items-center justify-center border-x-2 border-gray-300 font-semibold">
                                {quantity}
                            </div>
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-10 h-12 flex items-center justify-center hover:bg-gray-100 text-xl font-semibold"
                            >
                                +
                            </button>
                        </div>

                        {/* Add to Cart Button */}
                        <button
                            onClick={handleAddToCart}
                            disabled={isAdding || (!selectedSize && sizes.length > 0)}
                            className="flex-1 h-12 bg-black text-white font-bold rounded-lg hover:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isAdding ? 'ADDING...' : 'ADD TO CART'}
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
