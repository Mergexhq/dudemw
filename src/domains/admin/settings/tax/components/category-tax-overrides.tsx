"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { IndianRupee, Plus, Edit2, Trash2, X, CheckCircle2, Info } from "lucide-react"
import { GST_RATES, type CategoryTaxRule, type Category, type TaxSettings } from "../types"
import { useCategoryTaxRules } from "../hooks/use-category-tax-rules"

interface CategoryTaxOverridesProps {
  taxSettings: TaxSettings
  categoryRules: CategoryTaxRule[]
  setCategoryRules: (rules: CategoryTaxRule[]) => void
  categories: Category[]
}

export function CategoryTaxOverrides({ 
  taxSettings, 
  categoryRules, 
  setCategoryRules, 
  categories 
}: CategoryTaxOverridesProps) {
  const [editingRule, setEditingRule] = useState<string | null>(null)
  const [newRule, setNewRule] = useState<{ category_id: string; gst_rate: number } | null>(null)

  const { addCategoryRule, updateCategoryRule, deleteCategoryRule, getAvailableCategories } = 
    useCategoryTaxRules(categoryRules, setCategoryRules, categories)

  if (!taxSettings.tax_enabled) return null

  const handleAddCategoryRule = async () => {
    if (!newRule) return
    await addCategoryRule(newRule)
    setNewRule(null)
  }

  const handleUpdateCategoryRule = async (rule: CategoryTaxRule) => {
    await updateCategoryRule(rule)
    setEditingRule(null)
  }

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-emerald-50 dark:from-gray-900 dark:to-emerald-950/20 border-emerald-100/50 dark:border-emerald-900/20 hover:shadow-md transition-all duration-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <IndianRupee className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Category Tax Overrides</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Set different GST rates for specific product categories
              </CardDescription>
            </div>
          </div>
          {!newRule && getAvailableCategories().length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setNewRule({ category_id: '', gst_rate: 18 })}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Override
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead className="font-semibold">GST Rate</TableHead>
                <TableHead className="font-semibold text-center">Override</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Default rate row */}
              <TableRow className="bg-gray-50/50 dark:bg-gray-800/30">
                <TableCell className="font-medium text-gray-500">All Categories (Default)</TableCell>
                <TableCell>
                  <Badge variant="secondary">{taxSettings.default_gst_rate}%</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="text-gray-500">No</Badge>
                </TableCell>
                <TableCell className="text-right text-gray-400 text-sm">
                  Edit in Global Settings
                </TableCell>
              </TableRow>

              {/* Category rules */}
              {categoryRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.category_name}</TableCell>
                  <TableCell>
                    {editingRule === rule.id ? (
                      <Select
                        value={rule.gst_rate.toString()}
                        onValueChange={(value) => {
                          setCategoryRules(categoryRules.map(r =>
                            r.id === rule.id ? { ...r, gst_rate: parseInt(value) } : r
                          ))
                        }}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GST_RATES.map((rate) => (
                            <SelectItem key={rate} value={rate.toString()}>
                              {rate}%
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        {rule.gst_rate}%
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Yes
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {editingRule === rule.id ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingRule(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleUpdateCategoryRule(rule)}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingRule(rule.id)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => deleteCategoryRule(rule.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}

              {/* New rule row */}
              {newRule && (
                <TableRow className="bg-emerald-50/50 dark:bg-emerald-950/20">
                  <TableCell>
                    <Select
                      value={newRule.category_id}
                      onValueChange={(value) => setNewRule({ ...newRule, category_id: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableCategories().map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={newRule.gst_rate.toString()}
                      onValueChange={(value) => setNewRule({ ...newRule, gst_rate: parseInt(value) })}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GST_RATES.map((rate) => (
                          <SelectItem key={rate} value={rate.toString()}>
                            {rate}%
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">New</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setNewRule(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddCategoryRule}
                        disabled={!newRule.category_id}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        Add
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {categoryRules.length === 0 && !newRule && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    No category overrides configured. All products use the default GST rate of {taxSettings.default_gst_rate}%.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex items-start gap-2 text-sm text-gray-500">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            Category overrides take precedence over the default GST rate.
            Products can also have individual GST rate overrides in their product settings.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}