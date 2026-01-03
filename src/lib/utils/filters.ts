/**
 * Filter utility functions for admin panel
 * Handles query building, URL serialization, and validation
 */

export interface FilterValue {
    key: string
    value: any
    operator?: 'eq' | 'gte' | 'lte' | 'in' | 'ilike' | 'between'
}

/**
 * Parse filters from URL search params
 */
export function parseFiltersFromURL(searchParams: URLSearchParams): Record<string, any> {
    const filters: Record<string, any> = {}

    searchParams.forEach((value, key) => {
        // Skip pagination and search params
        if (key === 'page' || key === 'search' || key === 'sort') return

        // Handle range filters (e.g., price_min, price_max)
        if (key.endsWith('_min') || key.endsWith('_max')) {
            const baseKey = key.replace(/_min|_max$/, '')
            if (!filters[baseKey]) {
                filters[baseKey] = {}
            }
            filters[baseKey][key.endsWith('_min') ? 'min' : 'max'] = value
        }
        // Handle date range filters
        else if (key.endsWith('_from') || key.endsWith('_to')) {
            const baseKey = key.replace(/_from|_to$/, '')
            if (!filters[baseKey]) {
                filters[baseKey] = {}
            }
            filters[baseKey][key.endsWith('_from') ? 'from' : 'to'] = value
        }
        // Handle multi-select (comma-separated)
        else if (value.includes(',')) {
            filters[key] = value.split(',')
        }
        // Handle single value
        else {
            filters[key] = value
        }
    })

    return filters
}

/**
 * Serialize filters to URL search params
 */
export function serializeFiltersToURL(filters: Record<string, any>): URLSearchParams {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') return

        // Handle range objects
        if (typeof value === 'object' && !Array.isArray(value)) {
            if (value.min !== undefined && value.min !== '') {
                params.set(`${key}_min`, String(value.min))
            }
            if (value.max !== undefined && value.max !== '') {
                params.set(`${key}_max`, String(value.max))
            }
            if (value.from !== undefined && value.from !== '') {
                params.set(`${key}_from`, String(value.from))
            }
            if (value.to !== undefined && value.to !== '') {
                params.set(`${key}_to`, String(value.to))
            }
        }
        // Handle arrays (multi-select)
        else if (Array.isArray(value) && value.length > 0) {
            params.set(key, value.join(','))
        }
        // Handle single values
        else {
            params.set(key, String(value))
        }
    })

    return params
}

/**
 * Build Supabase query from filters
 * This is a helper for backend API routes
 */
export function buildSupabaseFilters(
    query: any,
    filters: Record<string, any>
): any {
    let filteredQuery = query

    Object.entries(filters).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') return

        // Handle range objects
        if (typeof value === 'object' && !Array.isArray(value)) {
            if (value.min !== undefined && value.min !== '') {
                filteredQuery = filteredQuery.gte(key, value.min)
            }
            if (value.max !== undefined && value.max !== '') {
                filteredQuery = filteredQuery.lte(key, value.max)
            }
            if (value.from !== undefined && value.from !== '') {
                filteredQuery = filteredQuery.gte(key, value.from)
            }
            if (value.to !== undefined && value.to !== '') {
                filteredQuery = filteredQuery.lte(key, value.to)
            }
        }
        // Handle arrays (IN query)
        else if (Array.isArray(value) && value.length > 0) {
            filteredQuery = filteredQuery.in(key, value)
        }
        // Handle single values (equality)
        else {
            filteredQuery = filteredQuery.eq(key, value)
        }
    })

    return filteredQuery
}

/**
 * Validate filter value based on type
 */
export function validateFilterValue(
    value: any,
    type: 'enum' | 'date_range' | 'number_range' | 'boolean' | 'multi_select'
): boolean {
    if (value === null || value === undefined) return true

    switch (type) {
        case 'enum':
            return typeof value === 'string'

        case 'boolean':
            return typeof value === 'boolean' || value === 'true' || value === 'false'

        case 'number_range':
            if (typeof value === 'object') {
                const { min, max } = value
                return (
                    (min === undefined || !isNaN(Number(min))) &&
                    (max === undefined || !isNaN(Number(max)))
                )
            }
            return !isNaN(Number(value))

        case 'date_range':
            if (typeof value === 'object') {
                const { from, to } = value
                return (
                    (from === undefined || !isNaN(Date.parse(from))) &&
                    (to === undefined || !isNaN(Date.parse(to)))
                )
            }
            return !isNaN(Date.parse(value))

        case 'multi_select':
            return Array.isArray(value)

        default:
            return true
    }
}

/**
 * Get display value for filter chip
 */
export function getFilterDisplayValue(
    value: any,
    type: 'enum' | 'date_range' | 'number_range' | 'boolean' | 'multi_select',
    options?: { label: string; value: string }[]
): string {
    if (value === null || value === undefined) return ''

    switch (type) {
        case 'enum':
            const option = options?.find(opt => opt.value === value)
            return option?.label || value

        case 'boolean':
            return value === true || value === 'true' ? 'Yes' : 'No'

        case 'number_range':
            if (typeof value === 'object') {
                const { min, max } = value
                if (min && max) return `${min} - ${max}`
                if (min) return `≥ ${min}`
                if (max) return `≤ ${max}`
            }
            return String(value)

        case 'date_range':
            if (typeof value === 'object') {
                const { from, to } = value
                if (from && to) {
                    return `${new Date(from).toLocaleDateString()} - ${new Date(to).toLocaleDateString()}`
                }
                if (from) return `From ${new Date(from).toLocaleDateString()}`
                if (to) return `Until ${new Date(to).toLocaleDateString()}`
            }
            return new Date(value).toLocaleDateString()

        case 'multi_select':
            if (Array.isArray(value)) {
                return value
                    .map(v => options?.find(opt => opt.value === v)?.label || v)
                    .join(', ')
            }
            return String(value)

        default:
            return String(value)
    }
}

/**
 * Count active filters
 */
export function countActiveFilters(filters: Record<string, any>): number {
    let count = 0

    Object.entries(filters).forEach(([_, value]) => {
        if (value === null || value === undefined || value === '') return

        if (typeof value === 'object' && !Array.isArray(value)) {
            // Count range filters only if they have values
            if (value.min !== undefined && value.min !== '') count++
            if (value.max !== undefined && value.max !== '') count++
            if (value.from !== undefined && value.from !== '') count++
            if (value.to !== undefined && value.to !== '') count++
        } else if (Array.isArray(value) && value.length > 0) {
            count++
        } else {
            count++
        }
    })

    return count
}
