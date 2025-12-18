export interface TaxSettings {
  id?: string
  tax_enabled: boolean
  price_includes_tax: boolean
  default_gst_rate: number
  store_state: string
  gstin: string
}

export interface CategoryTaxRule {
  id: string
  category_id: string
  category_name?: string
  gst_rate: number
  isNew?: boolean
}

export interface Category {
  id: string
  name: string
}

// Indian states list
export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
]

// Common GST rates in India
export const GST_RATES = [0, 5, 12, 18, 28]