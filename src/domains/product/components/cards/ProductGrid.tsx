import ProductCard from "./ProductCard"
import { Product } from "@/domains/product"

interface ProductGridProps {
  products: Product[]
  selectedColor?: string
  selectedSize?: string
}

export default function ProductGrid({ products, selectedColor, selectedSize }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          badge={product.is_bestseller ? "BESTSELLER" : product.is_new_drop ? "NEW" : undefined}
          badgeColor={product.is_bestseller ? "red" : "black"}
          selectedColor={selectedColor}
          selectedSize={selectedSize}
        />
      ))}
    </div>
  )
}

