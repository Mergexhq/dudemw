"use client";

/**
 * Shared hook for guest profile functionality
 * Consolidates logic used by both mobile and desktop guest views
 */

import { useState, useEffect } from 'react'
import { Product } from '@/domains/product'
import { supabase } from '@/lib/supabase/supabase'
import { useWishlist } from '@/domains/wishlist'
import { useRecentlyViewed } from '@/domains/product'

export function useGuestProfile(productCount: number = 6) {
  const [trackingData, setTrackingData] = useState({
    email: '',
    orderNumber: '',
  })
  const [fallbackProducts, setFallbackProducts] = useState<Product[]>([])

  const { wishlist: userWishlist, count: wishlistCount } = useWishlist()
  const { recentlyViewed: userRecentlyViewed, count: recentlyViewedCount } = useRecentlyViewed()

  // Fetch fallback products from Supabase
  useEffect(() => {
    async function fetchFallbackProducts() {
      try {
        const { data: products } = await supabase
          .from('products')
          .select('*')
          .eq('is_bestseller', true)
          .eq('in_stock', true)
          .limit(productCount)
        setFallbackProducts((products || []).map(product => ({
          ...product,
          price: product.price || 0,
          in_stock: product.in_stock ?? false,
          is_bestseller: product.is_bestseller ?? false,
          is_new_drop: product.is_new_drop ?? false,
          images: (product.images as string[]) || [],
          sizes: (product.sizes as string[]) || [],
          colors: (product.colors as string[]) || [],
          slug: product.slug || '',
          highlights: (product.highlights as string[]) || []
        })))
      } catch (error) {
        console.error('Failed to fetch fallback products:', error)
        setFallbackProducts([])
      }
    }
    fetchFallbackProducts()
  }, [productCount])

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement order tracking API integration
    // This would call your backend API to track the order
  }

  // Transform wishlist items to product format
  const wishlistProducts: Product[] = userWishlist.length > 0
    ? userWishlist.slice(0, Math.floor(productCount / 2)).map(item => ({
      id: item.id,
      title: item.title,
      images: [item.image],
      slug: item.slug,
      description: '',
      price: item.price,
      original_price: undefined,
      category_id: '',
      sizes: [],
      colors: [],
      in_stock: true,
      is_bestseller: false,
      is_new_drop: false,
      created_at: '',
      updated_at: ''
    }))
    : fallbackProducts.slice(0, Math.floor(productCount / 2))

  // Transform recently viewed items to product format
  const recentlyViewedProducts: Product[] = userRecentlyViewed.length > 0
    ? userRecentlyViewed.slice(0, Math.floor(productCount / 2)).map(item => ({
      id: item.id,
      title: item.title,
      images: [item.image],
      slug: item.slug,
      description: '',
      price: item.price,
      original_price: undefined,
      category_id: '',
      sizes: [],
      colors: [],
      in_stock: true,
      is_bestseller: false,
      is_new_drop: false,
      created_at: '',
      updated_at: ''
    }))
    : fallbackProducts.slice(Math.floor(productCount / 2), productCount)

  return {
    trackingData,
    setTrackingData,
    handleTrackOrder,
    wishlistProducts,
    recentlyViewedProducts,
    wishlistCount,
    recentlyViewedCount,
  }
}
