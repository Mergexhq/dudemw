export interface CartItem {
  id: string
  title: string
  price: number
  image: string
  size?: string
  color?: string
  quantity: number
  stock?: number
  variantKey: string // Unique key for variant (e.g., "product-1-M-Black")
  isFBT?: boolean // Flag to identify FBT items
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
}
