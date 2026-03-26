'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Product } from '@/domains/product'
import { AppliedCampaign, CartData } from '@/types/database/campaigns'

export interface CartItem {
  id: string
  product_id: string // The actual product UUID (not variant ID)
  title: string
  price: number
  image: string
  size?: string
  color?: string
  quantity: number
  stock?: number
  freeShipping?: boolean // From products.free_shipping in DB
  variantKey: string // Unique key for variant (e.g., "product-1-M-Black")
  isFBT?: boolean // Flag to identify FBT items
}

export interface ShippingAddress {
  firstName: string
  lastName?: string
  address: string
  address2?: string
  city: string
  state: string
  pincode: string
  phone: string
}

export interface CartContextType {
  cartItems: CartItem[]
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  updateQuantity: (variantKey: string, quantity: number) => void
  removeFromCart: (variantKey: string) => void
  clearCart: () => void
  clearFBTItems: () => void
  totalPrice: number
  itemCount: number
  uniqueVariantCount: number
  getItemByVariant: (variantKey: string) => CartItem | undefined
  shippingAddress: ShippingAddress | null
  setShippingAddress: (address: ShippingAddress) => void
  isLoading: boolean
  refreshStock: () => Promise<void>
  isLoadingStock: boolean
  // Campaign support
  appliedCampaign: AppliedCampaign | null
  campaignDiscount: number
  finalTotal: number
  nearestCampaign: { campaign: any; itemsNeeded?: number; amountNeeded?: number } | null
}

const CartContext = createContext<CartContextType | undefined>(undefined)

// Helper to get product ID from cart item ID (which might be variant ID or product ID)
const getProductId = (id: string) => {
  if (id.includes('-')) {
    const parts = id.split('-')
    // If first part looks like a product ID (numeric or long uuid)
    if (parts[0] && (parts[0].length > 10 || /^\d+$/.test(parts[0]))) {
      return parts[0]
    }
  }
  return id
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingStock, setIsLoadingStock] = useState(false)
  const [appliedCampaign, setAppliedCampaign] = useState<AppliedCampaign | null>(null)
  const [nearestCampaign, setNearestCampaign] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  // Handle mounting state
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load cart from localStorage on mount
  useEffect(() => {
    if (!mounted) return

    const savedCart = localStorage.getItem('cart-items')
    const savedAddress = localStorage.getItem('shipping-address')

    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        if (Array.isArray(parsedCart) && parsedCart.length > 0) {
          // Immediately set loading stock to true since we have items to check
          setIsLoadingStock(true)

          // Ensure we merge and deduplicate
          const deduped = parsedCart.reduce((acc: CartItem[], curr: CartItem) => {
            const existing = acc.find(item => item.variantKey === curr.variantKey)
            if (existing) {
              existing.quantity += curr.quantity
            } else {
              acc.push(curr)
            }
            return acc
          }, [])
          setCartItems(deduped)
        }
      } catch (error) {
        console.error('Error parsing saved cart:', error)
      }
    }

    if (savedAddress) {
      try {
        const parsedAddress = JSON.parse(savedAddress)
        setShippingAddress(parsedAddress)
      } catch (error) {
        console.error('Error parsing saved address:', error)
      }
    }

    setIsLoading(false)
  }, [mounted])

  // Refresh stock on mount
  useEffect(() => {
    // Only run this once, immediately after we've loaded the cart from local storage
    if (mounted && cartItems.length > 0 && isLoadingStock) {
      refreshStock() // This will clear the isLoadingStock flag when done
    }
  }, [mounted, cartItems.length])

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('cart-items', JSON.stringify(cartItems))
    }
  }, [cartItems, mounted])

  // Save address to localStorage whenever it changes
  useEffect(() => {
    if (mounted && shippingAddress) {
      localStorage.setItem('shipping-address', JSON.stringify(shippingAddress))
    }
  }, [shippingAddress, mounted])

  const refreshStock = async () => {
    if (cartItems.length === 0) return

    setIsLoadingStock(true)
    try {
      const { getProductsByIds } = await import('@/lib/actions/products')
      const productIds = Array.from(new Set(cartItems.map(item => getProductId(item.id))))

      const result = await getProductsByIds(productIds)
      if (result.success && result.data) {
        const products = result.data as unknown as Product[]

        setCartItems(prev => prev.map(item => {
          const product = products.find(p => p.id === getProductId(item.id))
          if (!product) return item

          // If it has variants, find the matching one
          if (product.product_variants && product.product_variants.length > 0) {
            const variant = product.product_variants.find(v => {
              // Try matching by variant ID if item.id is a variant ID
              if (v.id === item.id) return true

              // Match by options (size/color)
              // This is a bit simplified, but variantKey usually has this info
              // CartItem has size and color explicitly
              const hasColor = !item.color || v.name?.toLowerCase().includes(item.color.toLowerCase())
              const hasSize = !item.size || v.name?.includes(item.size)

              return hasColor && hasSize
            })

            if (variant) {
              const stock = (variant as any).inventory_items?.quantity ?? (variant as any).stock ?? 0
              return { ...item, stock }
            }
          }

          // Fallback to global stock
          return { ...item, stock: (product as any).global_stock ?? (product as any).stock ?? 0 }
        }))
      }
    } catch (error) {
      console.error('Error refreshing cart stock:', error)
    } finally {
      setIsLoadingStock(false)
    }
  }

  const addToCart = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    const quantity = item.quantity || 1
    const existingItem = cartItems.find(cartItem => cartItem.variantKey === item.variantKey)

    if (existingItem) {
      updateQuantity(item.variantKey, existingItem.quantity + quantity)
    } else {
      const newItem: CartItem = {
        ...item,
        quantity,
      }
      setCartItems(prev => [...prev, newItem])
    }
  }

  const removeFromCart = (variantKey: string) => {
    setCartItems(prev => prev.filter(item => item.variantKey !== variantKey))
  }

  const updateQuantity = (variantKey: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(variantKey)
      return
    }

    setCartItems(prev =>
      prev.map(item =>
        item.variantKey === variantKey ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = () => {
    setCartItems([])
    if (mounted) {
      localStorage.removeItem('cart-items')
    }
  }

  const clearFBTItems = () => {
    setCartItems(prev => prev.filter(item => !item.isFBT))
  }

  const getItemByVariant = (variantKey: string) => {
    return cartItems.find(item => item.variantKey === variantKey)
  }

  const totalPrice = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0)
  const uniqueVariantCount = cartItems.length

  // Campaign evaluation
  const campaignDiscount = appliedCampaign?.discount || 0
  const finalTotal = Math.max(0, totalPrice - campaignDiscount)

  // Evaluate campaigns whenever cart changes (debounced so it doesn't fire on every render)
  useEffect(() => {
    const evaluateCampaigns = async () => {
      if (cartItems.length === 0) {
        setAppliedCampaign(null)
        setNearestCampaign(null)
        return
      }

      const cartData: CartData = {
        items: cartItems.map(item => {
          return {
            id: item.id,
            product_id: item.product_id, // Use the stored product_id directly
            quantity: item.quantity,
            price: item.price,
          }
        }),
        subtotal: totalPrice
      }

      try {
        const response = await fetch('/api/campaigns/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartData })
        })
        const data = await response.json()
        if (data.success) {
          setAppliedCampaign(data.appliedCampaign)
          setNearestCampaign(data.nearestCampaign)
        } else {
          console.error('Campaign evaluation failed:', data.error)
        }
      } catch (error) {
        console.error('Error evaluating campaigns:', error)
      }
    }

    // Debounce: wait 800 ms after the cart stabilises before calling the API.
    const debounceTimer = setTimeout(evaluateCampaigns, 800)
    return () => clearTimeout(debounceTimer)
  }, [cartItems, totalPrice])

  const value: CartContextType = {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    clearFBTItems,
    totalPrice,
    itemCount,
    uniqueVariantCount,
    getItemByVariant,
    shippingAddress,
    setShippingAddress,
    isLoading,
    refreshStock,
    isLoadingStock,
    appliedCampaign,
    campaignDiscount,
    finalTotal,
    nearestCampaign
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
