import { CampaignRule, CartData, CartItem } from '@/types/database/campaigns'

/**
 * Evaluate if a min_items rule matches the cart
 * Value format: { count: number }
 */
export function evaluateMinItems(rule: CampaignRule, cart: CartData): boolean {
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0)
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
    const targetCategoryId = rule.value.category_id as string
    return cart.items.some(item => item.category_id === targetCategoryId)
}

/**
 * Evaluate if a collection rule matches the cart
 * Value format: { collection_id: string }
 */
export function evaluateCollection(rule: CampaignRule, cart: CartData): boolean {
    const targetCollectionId = rule.value.collection_id as string
    return cart.items.some(item => item.collection_id === targetCollectionId)
}

/**
 * Evaluate if a product rule matches the cart
 * Value format: { product_id: string }
 */
export function evaluateProduct(rule: CampaignRule, cart: CartData): boolean {
    const targetProductId = rule.value.product_id as string
    return cart.items.some(item => item.product_id === targetProductId)
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
