export interface Product {
    id: string
    title: string
    price: number | null
    description: string | null
    images: string[] | null
    image_url?: string | null
    product_images?: {
        image_url: string
        is_primary: boolean
        alt_text: string | null
    }[]
    product_variants?: {
        id: string
        sku: string
        price: number
        discount_price: number | null
        stock: number
        active: boolean
        name: string | null
    }[]
    status?: string
    is_active?: boolean
}

export interface SelectedProduct {
    product: Product
}
