import { toast } from "sonner"
import type { CategoryTaxRule, Category } from "../types"
import { createCategoryTaxRule, updateCategoryTaxRule, deleteCategoryTaxRule as deleteTaxRule } from "@/lib/actions/tax"

export function useCategoryTaxRules(
  categoryRules: CategoryTaxRule[],
  setCategoryRules: (rules: CategoryTaxRule[]) => void,
  categories: Category[]
) {
  const addCategoryRule = async (newRule: { category_id: string; gst_rate: number }) => {
    try {
      const result = await createCategoryTaxRule({
        category_id: newRule.category_id,
        gst_rate: newRule.gst_rate
      })

      if (!result.success || !(result as any).data) throw new Error(result.error)

      setCategoryRules([...categoryRules, (result as any).data])

      toast.success('Category tax rule added')
    } catch (error) {
      console.error('Failed to add category rule:', error)
      toast.error('Failed to add category rule')
    }
  }

  const updateCategoryRule = async (rule: CategoryTaxRule) => {
    try {
      const result = await updateCategoryTaxRule(rule.id, rule.gst_rate)
      if (!result.success) throw new Error(result.error)
      toast.success('Category tax rule updated')
    } catch (error) {
      console.error('Failed to update category rule:', error)
      toast.error('Failed to update category rule')
    }
  }

  const deleteCategoryRule = async (ruleId: string) => {
    try {
      const result = await deleteTaxRule(ruleId)
      if (!result.success) throw new Error(result.error)

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