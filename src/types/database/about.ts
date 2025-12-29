export interface AboutFeature {
    id: string
    title: string
    description: string
    icon_name: string
    sort_order: number
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface AboutStat {
    id: string
    value: string
    label: string
    sort_order: number
    is_active: boolean
    created_at: string
    updated_at: string
}
