import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { TaxSettings, CategoryTaxRule, Category } from "../types"

export function useTaxSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [taxSettings, setTaxSettings] = useState<TaxSettings>({
    tax_enabled: true,
    price_includes_tax: true,
    default_gst_rate: 18,
    store_state: "Tamil Nadu",
    gstin: ""
  })
  const [categoryRules, setCategoryRules] = useState<CategoryTaxRule[]>([])

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient()

        // Fetch tax settings
        const { data: settings } = await supabase
          .from('tax_settings')
          .select('*')
          .limit(1)
          .single()

        if (settings) {
          setTaxSettings(settings)
        }

        // Fetch categories
        const { data: cats } = await supabase
          .from('categories')
          .select('id, name')
          .order('name')

        if (cats) {
          setCategories(cats)
        }

        // Fetch category tax rules
        const { data: rules } = await supabase
          .from('category_tax_rules')
          .select(`
            id,
            category_id,
            gst_rate,
            categories(name)
          `)

        if (rules) {
          setCategoryRules(rules.map((r: any) => ({
            id: r.id,
            category_id: r.category_id,
            category_name: r.categories?.name || 'Unknown',
            gst_rate: r.gst_rate
          })))
        }
      } catch (error) {
        console.error('Failed to fetch tax settings:', error)
      } finally {
        setIsFetching(false)
      }
    }

    fetchData()
  }, [])

  const saveTaxSettings = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('tax_settings')
        .upsert({
          id: taxSettings.id || crypto.randomUUID(),
          tax_enabled: taxSettings.tax_enabled,
          price_includes_tax: taxSettings.price_includes_tax,
          default_gst_rate: taxSettings.default_gst_rate,
          store_state: taxSettings.store_state,
          gstin: taxSettings.gstin,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
      toast.success('Tax settings saved successfully')
    } catch (error) {
      console.error('Failed to save tax settings:', error)
      toast.error('Failed to save tax settings')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    taxSettings,
    setTaxSettings,
    categoryRules,
    setCategoryRules,
    categories,
    isLoading,
    isFetching,
    saveTaxSettings
  }
}