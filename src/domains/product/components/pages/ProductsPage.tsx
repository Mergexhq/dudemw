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
import { createClient } from '@/lib/supabase/client'
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
  const [collections, setCollections] = useState<{ title: string; slug: string; products: Product[] }[]>([])
  const [loading, setLoading] = useState(true)

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
            .from('collection_products')
            .select(`
              *,
              product:products (
                *,
                product_images (*)
              )
            `)
            .eq('collection_id', collection)
            .order('sort_order', { ascending: true })

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
                .from('collection_products')
                .select(`
                  *,
                  product:products (
                    *,
                    product_images (*)
                  )
                `)
                .eq('collection_id', col.id)
                .order('sort_order', { ascending: true })
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
