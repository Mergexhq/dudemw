"use client"

import { useEffect, useState, Suspense } from "react"
import BannerCarousel from "../banners/BannerCarousel"
import CategoryLite from "../banners/CategoryLite"
import CategoryTitleBanner from "../banners/CategoryTitleBanner"
import SidebarFilters from "../listing/SidebarFilters"
import ProductGrid from "../cards/ProductGrid"
import RelatedSearches from "../listing/RelatedSearches"
import EmptyState from "../listing/EmptyState"
import MinimalPagination from "../listing/MinimalPagination"
import AppliedFiltersChips from "../listing/AppliedFiltersChips"
import HorizontalProductScroll from "../cards/HorizontalProductScroll"
import MobileFilterButton from "../listing/MobileFilterButton"
import { FilterProvider } from "../../hooks/FilterContext"
import { Product } from "@/domains/product"
import { ProductService } from '@/lib/services/products'
import { CollectionService } from '@/lib/services/collections'
import { supabase } from '@/lib/supabase/supabase'
import { transformProducts } from '@/domains/product/utils/productUtils'

interface ProductsPageProps {
  searchParams?: {
    q?: string
    page?: string
    sort?: string
    collection?: string
    category?: string
  }
  category?: string
}

export default function ProductsPage({ searchParams, category }: ProductsPageProps) {
  const query = searchParams?.q?.trim() || undefined
  const page = searchParams?.page ? Number(searchParams.page) : 1
  const collection = searchParams?.collection || undefined
  const categoryParam = searchParams?.category || category

  // Detect Variant
  const isSearch = !!query
  const isCategory = !!categoryParam && !isSearch && !collection
  const isCollection = !!collection && !isSearch
  const isAllProducts = !isSearch && !isCategory && !isCollection

  // State for products
  const [products, setProducts] = useState<Product[]>([])
  const [newDrops, setNewDrops] = useState<Product[]>([])
  const [bestSellers, setBestSellers] = useState<Product[]>([])
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch products using ProductService
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        let allProducts: Product[] = []
        let newArrivals: Product[] = []
        let bestsellers: Product[] = []

        // Fetch data based on variant using ProductService
        if (categoryParam) {
          // Get category ID first
          const { data: categoryData } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', categoryParam)
            .single()
          
          if (categoryData) {
            const result = await ProductService.getProducts({
              categoryId: categoryData.id,
              status: 'active'
            })
            allProducts = result.success ? transformProducts(result.data) : []
          }
        } else if (collection) {
          // Fetch products from collection
          const result = await CollectionService.getCollectionProducts(collection)
          allProducts = result.success ? transformProducts(result.data) : []
        } else if (query) {
          // Search products
          const result = await ProductService.getProducts({
            search: query,
            status: 'active'
          })
          allProducts = result.success ? transformProducts(result.data) : []
        } else {
          // Get all products
          const result = await ProductService.getProducts({
            status: 'active'
          })
          allProducts = result.success ? transformProducts(result.data) : []
        }

        // Fetch new arrivals using ProductService
        const newArrivalsResult = await ProductService.getNewArrivals(5)
        newArrivals = newArrivalsResult.success ? transformProducts(newArrivalsResult.data) : []

        // Fetch bestsellers using ProductService
        const bestsellersResult = await ProductService.getBestSellers(5)
        bestsellers = bestsellersResult.success ? transformProducts(bestsellersResult.data) : []

        setProducts(allProducts)
        setNewDrops(newArrivals)
        setBestSellers(bestsellers)
        
        // Mix of new drops and best sellers for trending (ensure unique products)
        const trendingCandidates = [
          ...newArrivals.slice(0, 3),
          ...bestsellers.slice(0, 2),
        ]
        
        // Remove duplicates by ID
        const uniqueTrending = trendingCandidates.filter((product, index, self) => 
          index === self.findIndex(p => p.id === product.id)
        )
        
        setTrendingProducts(uniqueTrending)
      } catch (error) {
        console.error('Failed to fetch products:', error)
        setProducts([])
        setNewDrops([])
        setBestSellers([])
        setTrendingProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [query, category, page])

  const total = products.length
  const hasMore = false // Implement pagination logic if needed
  const hasResults = products.length > 0

  return (
    <FilterProvider>
      {/* 1. ALL PRODUCTS VARIANT */}
      {isAllProducts && (
        <>
          <BannerCarousel />
          <CategoryLite />

          {/* Curated Product Sections - Horizontal Scroll */}
          <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
            <HorizontalProductScroll
              title="New Drops"
              products={newDrops}
              badge="NEW"
              badgeColor="red"
              viewAllLink="/collections/new-arrivals"
            />
            <HorizontalProductScroll
              title="Best Sellers"
              products={bestSellers}
              badge="BESTSELLER"
              badgeColor="black"
              viewAllLink="/collections/best-sellers"
            />
            <HorizontalProductScroll
              title="Trending Now"
              products={trendingProducts}
              badgeColor="red"
              viewAllLink="/collections/trending"
            />

            {/* Divider */}
            <div className="my-8 border-t-2 border-gray-200 md:my-12" />

            {/* All Products Title */}
            <h2 className="mb-4 font-heading text-2xl font-bold tracking-wide text-black md:mb-6 md:text-3xl">
              All Products
            </h2>

            {/* Mobile Filter Button - Below Title */}
            <div className="lg:hidden">
              <MobileFilterButton />
            </div>
          </section>
        </>
      )}

      {/* 2. CATEGORY VARIANT */}
      {isCategory && <CategoryTitleBanner handle={category} />}

      {/* 3. SEARCH VARIANT */}
      {isSearch && hasResults && <RelatedSearches query={query!} />}

      <section className={`mx-auto max-w-7xl px-4 pb-12 md:px-6 ${isAllProducts ? 'pt-4' : 'pt-12'}`}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading products...</p>
            </div>
          </div>
        ) : (
          <div className="flex gap-10 lg:gap-12">
            {/* Sidebar Filters – Show for all product lists (All Products, Category, Search) */}
            {hasResults && (
              <div className="hidden lg:block lg:w-64">
                <SidebarFilters />
              </div>
            )}

            {/* Main Content */}
            <div className={hasResults ? "flex-1" : "w-full"}>
              {hasResults ? (
                <>
                  {/* Product Count */}
                  <div className="mb-4 flex items-center justify-between">
                    <p className="font-body text-gray-600">
                      Showing {products.length} of {total} products
                    </p>
                  </div>

                  {/* Applied Filters Chips */}
                  <AppliedFiltersChips />

                  {/* Product Grid */}
                  <div className="mt-6">
                    <ProductGrid products={products} />
                  </div>

                  {/* Pagination */}
                  {hasMore && (
                    <Suspense fallback={<div className="mt-12 flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div></div>}>
                      <MinimalPagination current={page} total={4} />
                    </Suspense>
                  )}
                </>
              ) : (
                <EmptyState query={query} category={category} />
              )}
            </div>
          </div>
        )}
      </section>
    </FilterProvider>
  )
}
