import { CampaignRule, CartData, CartItem } from '@/types/database/campaigns'

/**
 * Evaluate if a min_items rule matches the cart
 * Value format: { count: number }
 */
export function evaluateMinItems(rule: CampaignRule, cart: CartData): boolean {
    const productIds = rule.value.product_ids as string[] | undefined
    const categoryIds = rule.value.category_ids as string[] | undefined
    
    const itemsToCount = cart.items.filter(item => {
        if (productIds && !productIds.includes(item.product_id)) return false
        if (categoryIds && !categoryIds.includes(item.category_id || '')) return false
        return true
    })

    const totalItems = itemsToCount.reduce((sum, item) => sum + item.quantity, 0)
    const requiredCount = rule.value.count as number

    switch (rule.operator) {
        case '>=':
            return totalItems >= requiredCount
        case '>':
            return totalItems > requiredCount
        case '=':
            return totalItems === requiredCount
        case '<':
            return totalItems < requiredCount
        case '<=':
            return totalItems <= requiredCount
        default:
            return false
    }
}

/**
 * Evaluate if a min_cart_value rule matches the cart
 * Value format: { amount: number }
 */
export function evaluateMinCartValue(rule: CampaignRule, cart: CartData): boolean {
    const requiredAmount = rule.value.amount as number

    switch (rule.operator) {
        case '>=':
            return cart.subtotal >= requiredAmount
        case '>':
            return cart.subtotal > requiredAmount
        case '=':
            return cart.subtotal === requiredAmount
        case '<':
            return cart.subtotal < requiredAmount
        case '<=':
            return cart.subtotal <= requiredAmount
        default:
            return false
    }
}

/**
 * Evaluate if a category rule matches the cart
 * Value format: { category_id: string }
 */
export function evaluateCategory(rule: CampaignRule, cart: CartData): boolean {
    const targetCategoryId = rule.value.category_id as string | undefined
    const targetCategoryIds = rule.value.category_ids as string[] | undefined

    return cart.items.some(item => {
        if (targetCategoryId) return item.category_id === targetCategoryId
        if (targetCategoryIds) {
            const isIn = targetCategoryIds.includes(item.category_id || '')
            return rule.operator === 'not_in' ? !isIn : isIn
        }
        return false
    })
}

/**
 * Evaluate if a collection rule matches the cart
 * Value format: { collection_id: string }
 */
export function evaluateCollection(rule: CampaignRule, cart: CartData): boolean {
    const targetCollectionId = rule.value.collection_id as string | undefined
    const targetCollectionIds = rule.value.collection_ids as string[] | undefined

    return cart.items.some(item => {
        if (targetCollectionId) return item.collection_id === targetCollectionId
        if (targetCollectionIds) {
            const isIn = targetCollectionIds.includes(item.collection_id || '')
            return rule.operator === 'not_in' ? !isIn : isIn
        }
        return false
    })
}

/**
 * Evaluate if a product rule matches the cart
 * Value format: { product_id: string }
 */
export function evaluateProduct(rule: CampaignRule, cart: CartData): boolean {
    const targetProductId = rule.value.product_id as string | undefined
    const targetProductIds = rule.value.product_ids as string[] | undefined

    return cart.items.some(item => {
        if (targetProductId) return item.product_id === targetProductId
        if (targetProductIds) {
            const isIn = targetProductIds.includes(item.product_id)
            return rule.operator === 'not_in' ? !isIn : isIn
        }
        return false
    })
}

/**
 * Master rule evaluator - routes to specific evaluator based on rule type
 */
export function evaluateRule(rule: CampaignRule, cart: CartData): boolean {
    switch (rule.rule_type) {
        case 'min_items':
            return evaluateMinItems(rule, cart)
        case 'min_cart_value':
            return evaluateMinCartValue(rule, cart)
        case 'category':
            return evaluateCategory(rule, cart)
        case 'collection':
            return evaluateCollection(rule, cart)
        case 'product':
            return evaluateProduct(rule, cart)
        default:
            return false
    }
}
