import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { CategoryTaxRule, Category } from "../types"

export function useCategoryTaxRules(
  categoryRules: CategoryTaxRule[],
  setCategoryRules: (rules: CategoryTaxRule[]) => void,
  categories: Category[]
) {
  const addCategoryRule = async (newRule: { category_id: string; gst_rate: number }) => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('category_tax_rules')
        .insert({
          category_id: newRule.category_id,
          gst_rate: newRule.gst_rate
        })
        .select(`
          id,
          category_id,
          gst_rate,
          categories(name)
        `)
        .single()

      if (error) throw error

      if (data) {
        setCategoryRules([...categoryRules, {
          id: data.id,
          category_id: data.category_id,
          category_name: (data as any).categories?.name || 'Unknown',
          gst_rate: data.gst_rate
        }])
      }

      toast.success('Category tax rule added')
    } catch (error) {
      console.error('Failed to add category rule:', error)
      toast.error('Failed to add category rule')
    }
  }

  const updateCategoryRule = async (rule: CategoryTaxRule) => {
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('category_tax_rules')
        .update({ gst_rate: rule.gst_rate })
        .eq('id', rule.id)

      if (error) throw error
      toast.success('Category tax rule updated')
    } catch (error) {
      console.error('Failed to update category rule:', error)
      toast.error('Failed to update category rule')
    }
  }

  const deleteCategoryRule = async (ruleId: string) => {
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('category_tax_rules')
        .delete()
        .eq('id', ruleId)

      if (error) throw error

      setCategoryRules(categoryRules.filter(r => r.id !== ruleId))
      toast.success('Category tax rule deleted')
    } catch (error) {
      console.error('Failed to delete category rule:', error)
      toast.error('Failed to delete category rule')
    }
  }

  const getAvailableCategories = () => {
    const usedCategoryIds = categoryRules.map(r => r.category_id)
    return categories.filter(c => !usedCategoryIds.includes(c.id))
  }

  return {
    addCategoryRule,
    updateCategoryRule,
    deleteCategoryRule,
    getAvailableCategories
  }
}