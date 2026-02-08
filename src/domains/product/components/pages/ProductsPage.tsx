"use client"

import { useEffect, useState, Suspense, useMemo } from "react"
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
  initialProducts?: Product[] // Added
  totalCount?: number         // Added
}

// ... (FilteredProductGrid remains same or moved) ...

export default function ProductsPage({
  searchParams,
  category,
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
  const [collections, setCollections] = useState<{ title: string; slug: string; products: Product[] }[]>([])
  const [loading, setLoading] = useState(initialProducts.length === 0)

  // Fetch products and collections
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

        // For "All Products" variant, fetch collections from DB
        if (!categoryParam && !collection && !query) {
          // Fetch active collections from database
          const { data: dbCollections } = await supabase
            .from('collections')
            .select('id, title, slug')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(4)

          const collectionsWithProducts: { title: string; slug: string; products: Product[] }[] = []

          if (dbCollections && dbCollections.length > 0) {
            // Fetch products for each collection
            for (const col of dbCollections) {
              const { data: colProducts } = await supabase
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
                .eq('collection_id', col.id)
                .order('position', { ascending: true })
                .limit(8)

              const products = colProducts?.map(cp => cp.product).filter(Boolean) || []
              if (products.length > 0) {
                collectionsWithProducts.push({
                  title: col.title,
                  slug: col.slug,
                  products: transformProducts(products).slice(0, 8)
                })
              }
            }
          }

          // Fallback: If no collections with products, create sections from product flags
          if (collectionsWithProducts.length === 0 && allProducts.length > 0) {
            const newDrops = allProducts.filter(p => p.is_new_drop).slice(0, 8)
            const bestsellers = allProducts.filter(p => p.is_bestseller).slice(0, 8)
            const featured = allProducts.filter(p => p.is_featured).slice(0, 8)

            if (newDrops.length > 0) {
              collectionsWithProducts.push({ title: 'New Drops', slug: 'new-drops', products: newDrops })
            }
            if (bestsellers.length > 0) {
              collectionsWithProducts.push({ title: 'Best Sellers', slug: 'best-sellers', products: bestsellers })
            }
            if (featured.length > 0) {
              collectionsWithProducts.push({ title: 'Featured', slug: 'featured', products: featured })
            }

            // If still empty, just show recent products
            if (collectionsWithProducts.length === 0) {
              collectionsWithProducts.push({
                title: 'Latest Products',
                slug: 'latest',
                products: allProducts.slice(0, 8)
              })
            }
          }

          setCollections(collectionsWithProducts)
        }
      } catch (error) {
        console.error('Failed to fetch products:', error)
        setProducts([])
        setCollections([])
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
      {/* 1. ALL PRODUCTS VARIANT */}
      {isAllProducts && (
        <>
          <BannerCarousel placement="product-listing-carousel" />
          <CategoryLite />

          {/* Dynamic Collection Sections from DB */}
          <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
            {collections.length > 0 ? (
              collections.map((col, index) => (
                <HorizontalProductScroll
                  key={col.slug}
                  id={col.slug}
                  title={col.title}
                  products={col.products}
                  badge={index === 0 ? 'NEW' : undefined}
                  badgeColor={index === 0 ? 'red' : 'black'}
                />
              ))
            ) : (
              /* Fallback if no collections */
              products.length > 0 && (
                <HorizontalProductScroll
                  title="Our Products"
                  products={products.slice(0, 8)}
                />
              )
            )}

            {/* Divider */}
            <div className="my-8 border-t-2 border-gray-200 md:my-12" />
          </section>
        </>
      )}

      {/* 2. CATEGORY VARIANT */}
      {isCategory && <CategoryTitleBanner handle={category} />}

      {/* 3. SEARCH VARIANT */}
      {isSearch && hasResults && <RelatedSearches query={query!} />}

      <section className={`mx-auto max-w-7xl px-4 pb-12 md:px-6 ${isAllProducts ? 'pt-4' : 'pt-12'}`}>
        {/* Breadcrumbs - Show on category and search pages */}
        {(isCategory || isSearch) && (
          <Breadcrumbs
            items={[
              { name: 'Home', url: '/' },
              { name: 'Products', url: '/products' },
              ...(isCategory && categoryParam ? [{ name: categoryParam.replace('-', ' ').toUpperCase(), url: `/categories/${categoryParam}` }] : []),
              ...(isSearch && query ? [{ name: `Search: ${query}`, url: '' }] : [])
            ]}
          />
        )}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading products...</p>
            </div>
          </div>
        ) : (
          <ServerFilteredProductGrid
            categorySlug={categoryParam}
            collectionSlug={collection}
            query={query}
            initialProducts={products} // Pass existing filtered products
            totalCount={totalCount}
          />
        )}
      </section>
    </FilterProvider>
  )
}
