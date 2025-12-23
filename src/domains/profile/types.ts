// Profile domain types

// ProfileSection is a string union representing the different profile sections
export type ProfileSection = 'overview' | 'orders' | 'wishlist' | 'addresses' | 'settings' | 'track-order'

export interface Address {
    id: string
    user_id: string
    name: string
    phone: string
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    pincode: string
    isDefault?: boolean
    created_at?: string | null
    updated_at?: string | null
}

export interface Order {
    id: string
    orderNumber?: string
    status?: 'processing' | 'shipped' | 'delivered' | 'cancelled'
    order_status?: 'processing' | 'shipped' | 'delivered' | 'cancelled'
    payment_status?: 'pending' | 'paid' | 'failed'
    total_amount: number
    date?: string
    created_at?: string
    items: OrderItem[]
}

export interface OrderItem {
    id: string
    order_id?: string
    product_id?: string
    variant_id?: string
    quantity: number
    price: number
    name?: string
    image?: string
    size?: string
    color?: string
}

export interface WishlistItem {
    id: string
    product_id: string
    name: string
    price: number
    image?: string
    slug: string
}

export type OrderStatus = 'processing' | 'shipped' | 'delivered' | 'cancelled'
