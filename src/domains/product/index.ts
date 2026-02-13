// Main Pages
export * from './components/pages'

// Product Detail Components
export * from './components/detail'

// Product Cards & Grid
export * from './components/cards'

// Product Listing Components
export * from './components/listing'

// Banners & Categories
export * from './components/banners'

// Sections  
export { default as RelatedProducts } from './sections/RelatedProducts'
export { default as FrequentlyBoughtTogether } from './sections/FrequentlyBoughtTogether'
export { default as ProductHighlights } from './sections/ProductHighlights'
export { default as ProductReviews } from './sections/ProductReviews'
export { default as ProductGridSection } from './sections/ProductGridSection'
export { default as TrustBadges } from './sections/TrustBadges'

// Hooks
export { useRecentlyViewed } from './hooks/useRecentlyViewed'
export { FilterProvider } from './hooks/FilterContext'

// Types
export type { Product, Category } from './types/index'
