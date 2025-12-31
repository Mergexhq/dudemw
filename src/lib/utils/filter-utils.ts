/**
 * Utility functions for filter operations
 */

export interface ActiveFilter {
    key: string
    value: string
    label: string
}

/**
 * Format filter value to human-readable label
 */
export function formatFilterLabel(key: string, value: string): string {
    // Handle common filter value patterns
    if (value === "all") return "All"

    // Convert snake_case and kebab-case to Title Case
    return value
        .replace(/[-_]/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
}

/**
 * Get filter display name
 */
export function getFilterDisplayName(key: string): string {
    const displayNames: Record<string, string> = {
        search: "Search",
        status: "Status",
        paymentStatus: "Payment",
        payment_status: "Payment",
        stockStatus: "Stock",
        stock_status: "Stock",
        customerType: "Type",
        customer_type: "Type",
        category: "Category",
        dateFrom: "From Date",
        date_from: "From Date",
        dateTo: "To Date",
        date_to: "To Date",
    }

    return displayNames[key] || formatFilterLabel(key, key)
}

/**
 * Check if a filter value is active (not default)
 */
export function isFilterActive(value: string, defaultValue: string = "all"): boolean {
    return value !== defaultValue && value !== "" && value !== "all"
}

/**
 * Serialize filters to URL search params
 */
export function filtersToSearchParams(
    filters: Record<string, string>,
    defaults: Record<string, string>
): URLSearchParams {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
        if (isFilterActive(value, defaults[key])) {
            params.set(key, value)
        }
    })

    return params
}

/**
 * Deserialize URL search params to filters
 */
export function searchParamsToFilters(
    searchParams: URLSearchParams,
    defaults: Record<string, string>
): Record<string, string> {
    const filters = { ...defaults }

    searchParams.forEach((value, key) => {
        if (key in defaults) {
            filters[key] = value
        }
    })

    return filters
}

/**
 * Get active filters with labels
 */
export function getActiveFiltersWithLabels(
    filters: Record<string, string>,
    defaults: Record<string, string>
): ActiveFilter[] {
    return Object.entries(filters)
        .filter(([key, value]) => isFilterActive(value, defaults[key]))
        .map(([key, value]) => ({
            key,
            value,
            label: `${getFilterDisplayName(key)}: ${formatFilterLabel(key, value)}`,
        }))
}
