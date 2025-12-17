"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Category, Product } from "@/domains/product"
import { createClient } from '@/lib/supabase/client'

interface MegaMenuProps {
  onClose?: () => void
}

interface CategorySectionProps {
  category: Category
}

function CategorySection({ category }: CategorySectionProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const supabase = createClient()
        const { data: categoryData } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', category.slug)
          .single()
        
        let categoryProducts: Product[] = []
        if (categoryData) {
          const { data } = await supabase
            .from('products')
            .select('*')
            .eq('category_id', categoryData.id)
            .eq('in_stock', true)
            .limit(8)
          categoryProducts = (data || []).map(product => ({
            ...product,
            in_stock: product.in_stock ?? false,
            is_bestseller: product.is_bestseller ?? false,
            is_new_drop: product.is_new_drop ?? false
          }))
        }
        setProducts(categoryProducts)
      } catch (error) {
        console.error('Failed to fetch category products:', error)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchProducts()
  }, [category.slug])

  return (
    <div id={category.slug} className="mb-12">
      <h3 className="mb-6 font-heading text-2xl tracking-wider">
        {category.name}
      </h3>
      {category.description && (
        <p className="mb-4 text-sm text-gray-600">{category.description}</p>
      )}
      <div className="grid grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-4 py-8 text-center text-gray-500">
            Loading products...
          </div>
        ) : products.length > 0 ? (
          products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="group"
            >
              <div className="relative mb-3 aspect-square overflow-hidden rounded-xl bg-gray-100">
                {product.images && product.images[0] && (
                  <Image
                    src={product.images[0]}
                    alt={product.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                )}
                {(product.is_bestseller || product.is_new_drop) && (
                  <span className="absolute left-2 top-2 z-10 rounded bg-red-600 px-2 py-1 text-xs font-bold text-white">
                    {product.is_bestseller ? 'BESTSELLER' : 'NEW'}
                  </span>
                )}
              </div>
              <h4 className="mb-1 font-body text-sm font-medium line-clamp-2">
                {product.title}
              </h4>
              <p className="font-heading text-base text-red-600">
                ₹{product.price.toLocaleString()}
              </p>
            </Link>
          ))
        ) : (
          <div className="col-span-4 py-8 text-center text-gray-500">
            No products available in this category
          </div>
        )}
      </div>
    </div>
  )
}

export default function MegaMenu({ onClose }: MegaMenuProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [activeSection, setActiveSection] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const rightRef = useRef<HTMLDivElement>(null)
  const leftRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient()
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('*')
          .order('name')
        setCategories(categoriesData || [])
        if (categoriesData && categoriesData.length > 0) {
          setActiveSection(categoriesData[0].slug)
        }
      } catch (error) {
        console.error('Failed to fetch megamenu data:', error)
        setCategories([])
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [])

  const scrollToSection = (slug: string) => {
    const element = document.getElementById(slug)
    if (element && rightRef.current) {
      rightRef.current.scrollTo({
        top: element.offsetTop - 100,
        behavior: "smooth",
      })
      setActiveSection(slug)
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      if (!rightRef.current || !leftRef.current || categories.length === 0) return
      const scrollTop = rightRef.current.scrollTop
      const scrollHeight = rightRef.current.scrollHeight
      const clientHeight = rightRef.current.clientHeight
      const leftSidebar = leftRef.current

      // Check if scrolled to bottom - auto close
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        onClose?.()
        return
      }

      let foundActive = false
      categories.forEach((category, index) => {
        const element = document.getElementById(category.slug)
        if (element && !foundActive) {
          const offsetTop = element.offsetTop - 150
          const offsetBottom = offsetTop + element.offsetHeight
          if (scrollTop >= offsetTop && scrollTop < offsetBottom) {
            setActiveSection(category.slug)
            foundActive = true
          }
        }
      })
    }

    const ref = rightRef.current
    ref?.addEventListener("scroll", handleScroll)
    return () => ref?.removeEventListener("scroll", handleScroll)
  }, [onClose, categories])

  if (isLoading) {
    return (
      <div className="h-[70vh] w-full border-t-4 border-red-600 bg-white shadow-2xl flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  // All categories are parent categories
  const parentCategories = categories

  return (
    <div className="h-[70vh] w-full border-t-4 border-red-600 bg-white shadow-2xl">
      <div className="flex h-full w-full">
        {/* LEFT SIDEBAR */}
        <div ref={leftRef} className="w-80 border-r border-gray-200 bg-gray-50 p-8 overflow-y-auto">
          <div className="space-y-8">
            {/* Shop Categories */}
            <div id="left-shop-categories">
              <h3 className="mb-4 font-body text-xs font-medium uppercase tracking-wider text-gray-600">
                Shop Categories
              </h3>
              <ul className="space-y-3">
                {parentCategories.map((category) => (
                  <li key={category.id}>
                    <button
                      onClick={() => scrollToSection(category.slug)}
                      className={`w-full text-left font-body text-lg font-medium transition-all ${
                        activeSection === category.slug
                          ? "font-bold text-red-600"
                          : "text-black hover:text-red-600"
                      }`}
                    >
                      {category.name}
                      <span
                        className={`mt-1 block h-0.5 transition-all ${
                          activeSection === category.slug
                            ? "w-full bg-red-600"
                            : "bg-transparent"
                        }`}
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* View All Button */}
            <Link
              href="/collections/all"
              className="block w-full rounded-full bg-red-600 py-3 text-center font-heading text-sm tracking-wider text-white transition-colors hover:bg-black"
            >
              VIEW ALL PRODUCTS
            </Link>
          </div>
        </div>

        {/* RIGHT CONTENT - SPY SCROLL */}
        <div
          ref={rightRef}
          className="scrollbar-thin scrollbar-thumb-red-600 flex-1 overflow-y-auto p-8"
        >
          {parentCategories.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-gray-500">No categories available</p>
            </div>
          ) : (
            parentCategories.map((category) => (
              <CategorySection key={category.id} category={category} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
