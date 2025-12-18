export type Supplier = {
  id: string
  name: string
  contact_person: string | null
  email: string | null
  phone: string | null
  address: string | null
  website: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type SupplierProduct = {
  id: string
  supplier_id: string
  product_id: string
  variant_id: string | null
  supplier_sku: string | null
  cost_price: number | null
  lead_time_days: number | null
  min_order_quantity: number | null
  created_at: string
  updated_at: string
}

export type CreateSupplierInput = Omit<Supplier, 'id' | 'created_at' | 'updated_at'>
export type UpdateSupplierInput = Partial<CreateSupplierInput>

export type SupplierFilters = {
  search?: string
  is_active?: boolean
}
