import { Product } from '@/domains/product'

export const getColorFromProduct = (product: Product): string => {
    // First try to get from product_options if available
    const colorOption = product.product_options?.find(
        (opt: any) => opt.name.toLowerCase() === 'color'
    )
    if (colorOption?.product_option_values?.[0]?.name) {
        return colorOption.product_option_values[0].name
    }

    // Fallback: Extract color from title
    // Common color patterns in titles
    const title = product.title.toLowerCase()
    const colorPatterns = [
        'black', 'white', 'gray', 'grey', 'navy', 'blue', 'red', 'green',
        'yellow', 'orange', 'purple', 'pink', 'brown', 'beige', 'khaki',
        'olive', 'maroon', 'teal', 'lavender', 'silver', 'gold', 'charcoal',
        'dark gray', 'light gray', 'navy blue', 'light blue', 'dark blue',
        'silver white', 'olive green', 'mustard', 'cream', 'off white',
        'wine', 'burgundy', 'rust', 'camel', 'tan', 'mehandi', 'peach'
    ]

    // Sort by length (descending) to match longer patterns first
    const sortedPatterns = colorPatterns.sort((a, b) => b.length - a.length)

    for (const color of sortedPatterns) {
        if (title.includes(color)) {
            // Capitalize first letter of each word
            return color
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
        }
    }

    return 'Default'
}
