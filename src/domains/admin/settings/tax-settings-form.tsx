"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Save,
    Info,
    AlertCircle,
    CheckCircle2,
    IndianRupee,
    Building2,
    Truck,
    Calculator,
    Plus,
    Trash2,
    Edit2,
    X
} from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

// Indian states list
const INDIAN_STATES = [
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
const GST_RATES = [0, 5, 12, 18, 28]

interface TaxSettings {
    id?: string
    tax_enabled: boolean
    price_includes_tax: boolean
    default_gst_rate: number
    store_state: string
    gstin: string
}

interface CategoryTaxRule {
    id: string
    category_id: string
    category_name?: string
    gst_rate: number
    isNew?: boolean
}

export function TaxSettingsForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])

    // Global tax settings
    const [taxSettings, setTaxSettings] = useState<TaxSettings>({
        tax_enabled: true,
        price_includes_tax: true,
        default_gst_rate: 18,
        store_state: "Tamil Nadu",
        gstin: ""
    })

    // Category tax rules
    const [categoryRules, setCategoryRules] = useState<CategoryTaxRule[]>([])
    const [editingRule, setEditingRule] = useState<string | null>(null)
    const [newRule, setNewRule] = useState<{ category_id: string; gst_rate: number } | null>(null)

    // Fetch initial data
    useEffect(() => {
        async function fetchData() {
            try {
                const supabase = createClient()

                // Fetch tax settings (using 'as any' because table needs SQL migration)
                const { data: settings } = await (supabase as any)
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

                // Fetch category tax rules (using 'as any' because table needs SQL migration)
                const { data: rules } = await (supabase as any)
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const supabase = createClient()

            // Upsert tax settings (single row table)
            const { error: settingsError } = await supabase
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

            if (settingsError) throw settingsError

            toast.success('Tax settings saved successfully')
        } catch (error) {
            console.error('Failed to save tax settings:', error)
            toast.error('Failed to save tax settings')
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddCategoryRule = async () => {
        if (!newRule) return

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

            setNewRule(null)
            toast.success('Category tax rule added')
        } catch (error) {
            console.error('Failed to add category rule:', error)
            toast.error('Failed to add category rule')
        }
    }

    const handleUpdateCategoryRule = async (rule: CategoryTaxRule) => {
        try {
            const supabase = createClient()

            const { error } = await supabase
                .from('category_tax_rules')
                .update({ gst_rate: rule.gst_rate })
                .eq('id', rule.id)

            if (error) throw error

            setEditingRule(null)
            toast.success('Category tax rule updated')
        } catch (error) {
            console.error('Failed to update category rule:', error)
            toast.error('Failed to update category rule')
        }
    }

    const handleDeleteCategoryRule = async (ruleId: string) => {
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

    return (
        <TooltipProvider>
            {isFetching ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-8 w-full max-w-full overflow-x-hidden">

                    {/* Global Tax Settings */}
                    <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 dark:from-gray-900 dark:to-red-950/20 border-red-100/50 dark:border-red-900/20 hover:shadow-md transition-all duration-200">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                    <Calculator className="w-5 h-5 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Global Tax Settings</CardTitle>
                                    <CardDescription className="text-gray-600 dark:text-gray-400">
                                        Configure default GST behavior for your store
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Tax Enable Toggle */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                <div className="space-y-0.5">
                                    <Label htmlFor="tax-enabled" className="text-base font-medium">Enable Tax Collection</Label>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        When enabled, GST will be calculated on all orders
                                    </p>
                                </div>
                                <Switch
                                    id="tax-enabled"
                                    checked={taxSettings.tax_enabled}
                                    onCheckedChange={(checked) => setTaxSettings({ ...taxSettings, tax_enabled: checked })}
                                />
                            </div>

                            {taxSettings.tax_enabled && (
                                <>
                                    {/* Pricing Type */}
                                    <div className="space-y-3">
                                        <Label className="text-base font-medium flex items-center gap-2">
                                            Pricing Type
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <Info className="w-4 h-4 text-gray-400" />
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-xs">
                                                    <p><strong>Inclusive:</strong> Product prices already include GST. Tax is extracted from the price.</p>
                                                    <p className="mt-1"><strong>Exclusive:</strong> GST is added on top of product prices at checkout.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </Label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div
                                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${taxSettings.price_includes_tax
                                                    ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                                    }`}
                                                onClick={() => setTaxSettings({ ...taxSettings, price_includes_tax: true })}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-4 h-4 rounded-full border-2 ${taxSettings.price_includes_tax ? 'border-red-500 bg-red-500' : 'border-gray-400'
                                                        }`}>
                                                        {taxSettings.price_includes_tax && (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <CheckCircle2 className="w-3 h-3 text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">Prices are GST Inclusive</p>
                                                        <p className="text-sm text-gray-500">₹1000 = ₹847 + ₹153 GST (18%)</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div
                                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${!taxSettings.price_includes_tax
                                                    ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                                    }`}
                                                onClick={() => setTaxSettings({ ...taxSettings, price_includes_tax: false })}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-4 h-4 rounded-full border-2 ${!taxSettings.price_includes_tax ? 'border-red-500 bg-red-500' : 'border-gray-400'
                                                        }`}>
                                                        {!taxSettings.price_includes_tax && (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <CheckCircle2 className="w-3 h-3 text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">Prices are GST Exclusive</p>
                                                        <p className="text-sm text-gray-500">₹1000 + ₹180 GST (18%) = ₹1180</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Default GST Rate */}
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="default-gst">Default GST Rate (%)</Label>
                                            <Select
                                                value={taxSettings.default_gst_rate.toString()}
                                                onValueChange={(value) => setTaxSettings({ ...taxSettings, default_gst_rate: parseInt(value) })}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {GST_RATES.map((rate) => (
                                                        <SelectItem key={rate} value={rate.toString()}>
                                                            {rate}% GST
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-gray-500">Applied when no category or product override exists</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="gstin">GSTIN (GST Registration Number)</Label>
                                            <Input
                                                id="gstin"
                                                placeholder="22AAAAA0000A1Z5"
                                                value={taxSettings.gstin}
                                                onChange={(e) => setTaxSettings({ ...taxSettings, gstin: e.target.value.toUpperCase() })}
                                                className="font-mono"
                                                maxLength={15}
                                            />
                                            <p className="text-xs text-gray-500">15-digit GST Identification Number</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Store Location & Tax Type */}
                    {taxSettings.tax_enabled && (
                        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-blue-950/20 border-blue-100/50 dark:border-blue-900/20 hover:shadow-md transition-all duration-200">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                        <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Store Location & Tax Type</CardTitle>
                                        <CardDescription className="text-gray-600 dark:text-gray-400">
                                            State-based GST calculation (CGST/SGST vs IGST)
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="store-state">Store Registered State</Label>
                                    <Select
                                        value={taxSettings.store_state}
                                        onValueChange={(value) => setTaxSettings({ ...taxSettings, store_state: value })}
                                    >
                                        <SelectTrigger className="w-full md:w-96">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {INDIAN_STATES.map((state) => (
                                                <SelectItem key={state} value={state}>
                                                    {state}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Tax Type Information */}
                                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <h4 className="font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2 mb-3">
                                        <Info className="w-4 h-4" />
                                        How GST is Applied Based on Delivery Location
                                    </h4>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                    Intra-State
                                                </Badge>
                                                <Truck className="w-4 h-4 text-green-600" />
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                Delivery within <strong>{taxSettings.store_state}</strong>
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Tax split: CGST ({taxSettings.default_gst_rate / 2}%) + SGST ({taxSettings.default_gst_rate / 2}%)
                                            </p>
                                        </div>
                                        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                                    Inter-State
                                                </Badge>
                                                <Truck className="w-4 h-4 text-orange-600" />
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                Delivery outside <strong>{taxSettings.store_state}</strong>
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Tax: IGST ({taxSettings.default_gst_rate}%)
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <p>
                                        This logic is automatically applied at checkout based on the customer&apos;s shipping address.
                                        You do not need to configure anything manually - the system handles CGST/SGST/IGST split.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Category Tax Overrides */}
                    {taxSettings.tax_enabled && (
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
                                                                    onClick={() => handleDeleteCategoryRule(rule.id)}
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
                    )}

                    {/* Tax Calculation Preview */}
                    {taxSettings.tax_enabled && (
                        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-purple-50 dark:from-gray-900 dark:to-purple-950/20 border-purple-100/50 dark:border-purple-900/20">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">Tax Calculation Preview</CardTitle>
                                <CardDescription>See how tax will be calculated on a sample ₹1000 product</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Inclusive Preview */}
                                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <h4 className="font-medium mb-3 flex items-center gap-2">
                                            {taxSettings.price_includes_tax ? (
                                                <Badge className="bg-green-100 text-green-700">Current Setting</Badge>
                                            ) : null}
                                            GST Inclusive (₹1000 product)
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Base Price:</span>
                                                <span>₹{(1000 / (1 + taxSettings.default_gst_rate / 100)).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">CGST ({taxSettings.default_gst_rate / 2}%):</span>
                                                <span>₹{((1000 - 1000 / (1 + taxSettings.default_gst_rate / 100)) / 2).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">SGST ({taxSettings.default_gst_rate / 2}%):</span>
                                                <span>₹{((1000 - 1000 / (1 + taxSettings.default_gst_rate / 100)) / 2).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between font-medium pt-2 border-t">
                                                <span>Customer Pays:</span>
                                                <span>₹1000.00</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Exclusive Preview */}
                                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <h4 className="font-medium mb-3 flex items-center gap-2">
                                            {!taxSettings.price_includes_tax ? (
                                                <Badge className="bg-green-100 text-green-700">Current Setting</Badge>
                                            ) : null}
                                            GST Exclusive (₹1000 product)
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Base Price:</span>
                                                <span>₹1000.00</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">CGST ({taxSettings.default_gst_rate / 2}%):</span>
                                                <span>₹{(1000 * taxSettings.default_gst_rate / 100 / 2).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">SGST ({taxSettings.default_gst_rate / 2}%):</span>
                                                <span>₹{(1000 * taxSettings.default_gst_rate / 100 / 2).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between font-medium pt-2 border-t">
                                                <span>Customer Pays:</span>
                                                <span>₹{(1000 * (1 + taxSettings.default_gst_rate / 100)).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {isLoading ? "Saving..." : "Save Tax Settings"}
                        </Button>
                    </div>
                </form>
            )}
        </TooltipProvider>
    )
}
