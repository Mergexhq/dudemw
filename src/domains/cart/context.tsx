'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Product } from '@/domains/product'
import { AppliedCampaign, CartData } from '@/types/database/campaigns'

export interface CartItem {
  id: string
  title: string
  price: number
  image: string
  size?: string
  color?: string
  quantity: number
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
  // Campaign support
  appliedCampaign: AppliedCampaign | null
  campaignDiscount: number
  finalTotal: number
  nearestCampaign: { campaign: any; itemsNeeded?: number; amountNeeded?: number } | null
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
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
        // Deduplicate by variantKey — merge quantities if the same variant appears twice
        const deduped = parsedCart.reduce((acc: CartItem[], item: CartItem) => {
          const existing = acc.find(i => i.variantKey === item.variantKey)
          if (existing) {
            existing.quantity += item.quantity
          } else {
            acc.push(item)
          }
          return acc
        }, [])
        setCartItems(deduped)
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

  // Evaluate campaigns whenever cart changes
  useEffect(() => {
    const evaluateCampaigns = async () => {
      if (cartItems.length === 0) {
        setAppliedCampaign(null)
        setNearestCampaign(null)
        return
      }

      const cartData: CartData = {
        items: cartItems.map(item => {
          // Extract product ID from variant key or use the item ID directly
          let productId = item.id

          // If the ID contains a hyphen, try to extract product ID
          if (item.id.includes('-')) {
            const parts = item.id.split('-')
            // Take the first part as product ID if it looks like a UUID or number
            if (parts[0] && (parts[0].length > 10 || /^\d+$/.test(parts[0]))) {
              productId = parts[0]
            }
          }

          return {
            id: item.id,
            product_id: productId,
            quantity: item.quantity,
            price: item.price,
          }
        }),
        subtotal: totalPrice
      }

      console.log('Evaluating campaigns for cart:', cartData)

      try {
        // Call API route instead of direct server function
        const response = await fetch('/api/campaigns/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartData })
        })

        const data = await response.json()

        console.log('Campaign evaluation response:', data)

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

    evaluateCampaigns()
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
