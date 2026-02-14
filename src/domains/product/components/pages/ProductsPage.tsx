"use client"

import { useEffect, useState, Suspense, useMemo } from "react"

import SidebarFilters from "../listing/SidebarFilters"
import ProductGrid from "../cards/ProductGrid"
import ProductCardSkeleton from "../cards/ProductCardSkeleton"
import RelatedSearches from "../listing/RelatedSearches"
import EmptyState from "../listing/EmptyState"
import MinimalPagination from "../listing/MinimalPagination"
import AppliedFiltersChips from "../listing/AppliedFiltersChips"
// import ProductGridSection from "@/domains/product/sections/ProductGridSection"
import MobileFilterButton from "../listing/MobileFilterButton"
import ServerFilteredProductGrid from "../listing/ServerFilteredProductGrid"
import { FilterProvider, useFilters } from "../../hooks/FilterContext"
// ... (imports remain)
import { Product } from "@/domains/product"
import { createClient } from '@/lib/supabase/client'
import { transformProducts } from '@/domains/product/utils/productUtils'
import Breadcrumbs from '@/components/ui/Breadcrumbs'

interface ProductsPageProps {
  searchParams?: {
    q?: string
    page?: string
    sort?: string
    collection?: string
    category?: string
    size?: string
    color?: string
    min_price?: string
    max_price?: string
  }
  category?: string
  pageTitle?: string  // Added
  initialProducts?: Product[] // Added
  totalCount?: number         // Added
}

// ... (FilteredProductGrid remains same or moved) ...

export default function ProductsPage({
  searchParams,
  category,
  pageTitle,
  initialProducts = [],
  totalCount = 0
}: ProductsPageProps) {
  const query = searchParams?.q?.trim() || undefined
  const page = searchParams?.page ? Number(searchParams.page) : 1
  const collection = searchParams?.collection || undefined
  const categoryParam = searchParams?.category || category

  // Detect Variant
  const isSearch = !!query
  const isCategory = !!categoryParam && !isSearch && !collection
  const isCollection = !!collection && !isSearch
  const isAllProducts = !isSearch && !isCategory && !isCollection

  // State for products - use initial data if provided
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [loading, setLoading] = useState(initialProducts.length === 0)

  // Fetch products
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const supabase = createClient()
        let allProducts: Product[] = []

        // Fetch data based on variant
        if (categoryParam) {
          // Get category ID first
          const { data: categoryData } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', categoryParam)
            .single()

          if (categoryData) {
            // Fetch products by category via product_categories junction
            const { data: productCats } = await supabase
              .from('product_categories')
              .select('product_id')
              .eq('category_id', categoryData.id)

            if (productCats && productCats.length > 0) {
              const productIds = productCats.map(pc => pc.product_id)
              const { data: products } = await supabase
                .from('products')
                .select(`
                  *,
                  product_images(*),
                  product_variants!product_variants_product_id_fkey(*),
                  default_variant:product_variants!products_default_variant_id_fkey(*)
                `)
                .in('id', productIds)
                .eq('status', 'published')

              allProducts = transformProducts(products || [])
            }
          }
        } else if (collection) {
          // Fetch products from collection
          const { data: collectionProducts } = await supabase
            .from('product_collections')
            .select(`
              *,
              product:products (
              *,
              product_images (*),
              product_variants!product_variants_product_id_fkey(*),
              default_variant:product_variants!products_default_variant_id_fkey(*)
              )
            `)
            .eq('collection_id', collection)
            .order('position', { ascending: true })

          const products = collectionProducts?.map(cp => cp.product).filter(Boolean) || []
          allProducts = transformProducts(products)
        } else if (query) {
          // Search products
          const { data: products } = await supabase
            .from('products')
            .select(`
              *,
              product_images(*),
              product_variants!product_variants_product_id_fkey(*),
              default_variant:product_variants!products_default_variant_id_fkey(*)
            `)
            .eq('status', 'published')
            .ilike('title', `%${query}%`)

          allProducts = transformProducts(products || [])
        } else {
          // Get all active products
          const { data: products } = await supabase
            .from('products')
            .select(`
              *,
              product_images(*),
              product_variants!product_variants_product_id_fkey(*),
              default_variant:product_variants!products_default_variant_id_fkey(*)
            `)
            .eq('status', 'published')
            .order('created_at', { ascending: false })

          allProducts = transformProducts(products || [])
        }

        setProducts(allProducts)
      } catch (error) {
        console.error('Failed to fetch products:', error)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [query, category, page, categoryParam, collection])

  const total = products.length
  const hasMore = false // Implement pagination logic if needed
  const hasResults = products.length > 0

  return (
    <FilterProvider>
      {/* 1. Header Section (Replaces Banners) */}
      <div className="bg-white pt-8 pb-4 md:pt-12 md:pb-6 text-center">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <h1 className="font-heading text-3xl font-medium tracking-tight text-gray-900 sm:text-4xl md:text-5xl uppercase mb-2">
            {pageTitle || (isSearch ? `Search Results: ${query}` : (isCategory ? categoryParam?.replace(/-/g, ' ') : 'All Products'))}
          </h1>

          {/* Breadcrumbs - Centered below title */}
          <div className="flex justify-center mt-2">
            <Breadcrumbs
              items={[
                { name: 'Home', url: '/' },
                { name: 'Products', url: '/products' },
                ...(isCategory && categoryParam ? [{ name: pageTitle || categoryParam.replace(/-/g, ' '), url: `/categories/${categoryParam}` }] : []),
                ...(isSearch && query ? [{ name: `Search`, url: '' }] : [])
              ]}
              className="flex justify-center"
            />
          </div>
        </div>
      </div>



      {/* 3. SEARCH VARIANT */}
      {isSearch && hasResults && <RelatedSearches query={query!} />}

      <section className={`mx-auto max-w-7xl px-4 pb-12 md:px-6 pt-4`}>
        {/* Breadcrumbs moved to top */}
        {loading ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 md:gap-y-10 lg:grid-cols-4 lg:gap-x-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <ServerFilteredProductGrid
            categorySlug={categoryParam}
            collectionSlug={collection}
            query={query}
            initialProducts={products}
            totalCount={products.length}
          />
        )}
      </section>
    </FilterProvider >
  )
}
