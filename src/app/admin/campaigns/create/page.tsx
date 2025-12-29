'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createCampaign } from '@/lib/actions/campaigns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Save, Plus, X, Calendar as CalendarIcon, Check } from 'lucide-react'
import { CampaignRule, CampaignAction } from '@/types/database/campaigns'
import { endOfMonth, endOfWeek, getLocalTimeZone, startOfMonth, startOfWeek, today } from "@internationalized/date"
import type { DateValue } from "react-aria-components"
import { DateRangePicker as AriaDateRangePicker, Dialog as AriaDialog, Group as AriaGroup, Popover as AriaPopover, useLocale } from "react-aria-components"
import { Button as BaseButton } from "@/components/base/buttons/button"
import { RangeCalendar } from "@/components/application/date-picker/range-calendar"
import { RangePresetButton } from "@/components/application/date-picker/range-preset"
import { cx } from "@/lib/utils/cx"

const now = today(getLocalTimeZone())

type RuleInput = Omit<CampaignRule, 'id' | 'campaign_id' | 'created_at'>
type ActionInput = Omit<CampaignAction, 'id' | 'campaign_id' | 'created_at'>

// Date Range Picker Component
interface DateRangePickerProps {
    value: { start: DateValue; end: DateValue } | null
    onChange: (value: { start: DateValue; end: DateValue } | null) => void
    label?: string
}

function CampaignDateRangePicker({ value, onChange, label }: DateRangePickerProps) {
    const { locale } = useLocale()
    const [focusedValue, setFocusedValue] = useState<DateValue | null>(null)
    const [tempValue, setTempValue] = useState<{ start: DateValue; end: DateValue } | null>(value)

    useEffect(() => {
        setTempValue(value)
    }, [value])

    const presets = useMemo(
        () => ({
            today: { label: "Today", value: { start: now, end: now } },
            tomorrow: { label: "Tomorrow", value: { start: now.add({ days: 1 }), end: now.add({ days: 1 }) } },
            thisWeek: { label: "This week", value: { start: startOfWeek(now, locale), end: endOfWeek(now, locale) } },
            nextWeek: {
                label: "Next week",
                value: {
                    start: startOfWeek(now, locale).add({ weeks: 1 }),
                    end: endOfWeek(now, locale).add({ weeks: 1 }),
                },
            },
            thisMonth: { label: "This month", value: { start: startOfMonth(now), end: endOfMonth(now) } },
            nextMonth: {
                label: "Next month",
                value: {
                    start: startOfMonth(now).add({ months: 1 }),
                    end: endOfMonth(now).add({ months: 1 }),
                },
            },
        }),
        [locale]
    )

    return (
        <AriaDateRangePicker
            aria-label={label || "Date range"}
            value={tempValue}
            onChange={setTempValue}
            shouldCloseOnSelect={false}
            onOpenChange={(isOpen) => {
                if (isOpen) {
                    setTempValue(value)
                }
            }}
        >
            <AriaGroup>
                <BaseButton
                    size="md"
                    color="secondary"
                    iconLeading={CalendarIcon}
                    className="w-full justify-start text-left font-normal bg-white hover:bg-gray-50 border border-gray-200"
                >
                    {value ? `${value.start} – ${value.end}` : <span className="text-gray-500">Select date range</span>}
                </BaseButton>
            </AriaGroup>
            <AriaPopover placement="bottom start" className={({ isEntering, isExiting }) =>
                cx(
                    "origin-(--trigger-anchor-point) will-change-transform z-[100] max-w-none",
                    isEntering &&
                    "duration-150 ease-out animate-in fade-in placement-right:slide-in-from-left-0.5 placement-top:slide-in-from-bottom-0.5 placement-bottom:slide-in-from-top-0.5",
                    isExiting &&
                    "duration-100 ease-in animate-out fade-out placement-right:slide-out-to-left-0.5 placement-top:slide-out-to-bottom-0.5 placement-bottom:slide-out-to-top-0.5",
                )
            }>
                <AriaDialog className="flex rounded-xl bg-white shadow-xl ring-1 ring-gray-200 focus:outline-hidden">
                    {({ close }) => (
                        <>
                            <div className="hidden w-28 flex-col gap-0.5 border-r border-solid border-gray-200 p-2 lg:flex">
                                {Object.values(presets).map((preset) => (
                                    <RangePresetButton
                                        key={preset.label}
                                        value={preset.value}
                                        onClick={() => {
                                            setFocusedValue(preset.value.start)
                                            setTempValue(preset.value)
                                        }}
                                    >
                                        {preset.label}
                                    </RangePresetButton>
                                ))}
                            </div>
                            <div className="flex flex-col">
                                <RangeCalendar
                                    focusedValue={focusedValue}
                                    onFocusChange={setFocusedValue}
                                />
                                <div className="flex justify-end gap-2 border-t border-gray-200 p-2">
                                    <BaseButton size="sm" color="secondary" onClick={() => {
                                        setTempValue(value)
                                        close()
                                    }}>
                                        Cancel
                                    </BaseButton>
                                    <BaseButton size="sm" color="primary" onClick={() => {
                                        onChange(tempValue)
                                        close()
                                    }} className="bg-red-600 hover:bg-red-700 text-white">
                                        Apply
                                    </BaseButton>
                                </div>
                            </div>
                        </>
                    )}
                </AriaDialog>
            </AriaPopover>
        </AriaDateRangePicker>
    )
}

// Progress Steps Component (matching banner style)
function ProgressSteps({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
    const steps = [
        { id: 1, name: 'Basic Info' },
        { id: 2, name: 'Conditions' },
        { id: 3, name: 'Discount' },
    ]

    return (
        <div className="flex items-center justify-center gap-4">
            {steps.slice(0, totalSteps).map((step, index) => (
                <div key={step.id} className="flex items-center">
                    <div
                        className={cx(
                            "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors",
                            currentStep > step.id
                                ? "bg-red-600 text-white"
                                : currentStep === step.id
                                    ? "bg-red-600 text-white"
                                    : "bg-gray-200 text-gray-400"
                        )}
                    >
                        {currentStep > step.id ? (
                            <Check className="h-5 w-5" />
                        ) : (
                            step.id
                        )}
                    </div>
                    {index < totalSteps - 1 && (
                        <div
                            className={cx(
                                "w-16 h-1 mx-2",
                                currentStep > step.id ? "bg-red-600" : "bg-gray-200"
                            )}
                        />
                    )}
                </div>
            ))}
        </div>
    )
}

export default function CreateCampaignPage() {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const totalSteps = 3

    // Step 1: Basic Info
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [dateRange, setDateRange] = useState<{ start: DateValue; end: DateValue } | null>(null)
    const [priority, setPriority] = useState('0')
    const [status, setStatus] = useState<'active' | 'inactive' | 'draft'>('draft')

    // Step 2: Rules
    const [rules, setRules] = useState<RuleInput[]>([])
    const [currentRule, setCurrentRule] = useState<Partial<RuleInput>>({
        rule_type: 'min_items',
        operator: '>=',
        value: {}
    })

    // Step 3: Actions
    const [action, setAction] = useState<ActionInput>({
        discount_type: 'flat',
        discount_value: 0,
        max_discount: null,
        applies_to: 'cart'
    })

    const addRule = () => {
        if (!currentRule.rule_type || !currentRule.operator || !currentRule.value) {
            toast.error('Please complete the current rule first')
            return
        }

        const val = currentRule.value as Record<string, any>
        if (Object.keys(val).length === 0 || Object.values(val).every(v => !v)) {
            toast.error('Please enter a value for the rule')
            return
        }

        setRules([...rules, currentRule as RuleInput])
        setCurrentRule({
            rule_type: 'min_items',
            operator: '>=',
            value: {}
        })
        toast.success('Rule added!')
    }

    const removeRule = (index: number) => {
        setRules(rules.filter((_, i) => i !== index))
    }

    const handleSubmit = async (isDraft = false) => {
        if (!name) {
            toast.error('Please enter a campaign name')
            return
        }

        if (!dateRange) {
            toast.error('Please select a date range')
            return
        }

        if (rules.length === 0) {
            toast.error('Please add at least one condition')
            return
        }

        if (action.discount_value <= 0) {
            toast.error('Please set a discount value')
            return
        }

        setLoading(true)
        try {
            await createCampaign({
                name,
                description: description || undefined,
                status: isDraft ? 'draft' : status,
                priority: parseInt(priority),
                start_at: dateRange.start.toDate(getLocalTimeZone()).toISOString(),
                end_at: dateRange.end.toDate(getLocalTimeZone()).toISOString(),
                apply_type: 'auto',
                rules,
                actions: [action]
            })

            toast.success(isDraft ? 'Campaign saved as draft' : 'Campaign created successfully!')
            router.push('/admin/campaigns')
        } catch (error) {
            toast.error('Failed to create campaign')
        } finally {
            setLoading(false)
        }
    }

    const getRuleDisplayText = (rule: RuleInput) => {
        switch (rule.rule_type) {
            case 'min_items':
                return `Minimum ${(rule.value as any)?.count || 0} items in cart`
            case 'min_cart_value':
                return `Cart value ≥ ₹${(rule.value as any)?.amount || 0}`
            case 'category':
                return `Items from category: ${(rule.value as any)?.category_id || 'Not set'}`
            case 'collection':
                return `Items from collection: ${(rule.value as any)?.collection_id || 'Not set'}`
            default:
                return JSON.stringify(rule.value)
        }
    }

    const canProceedToStep = (step: number): boolean => {
        switch (step) {
            case 2: return !!(name && dateRange)
            case 3: return !!(name && dateRange && rules.length > 0)
            default: return true
        }
    }

    const getStepTitle = (step: number): string => {
        const titles = ["Basic Info", "Conditions", "Discount Settings"]
        return titles[step - 1] || ""
    }

    return (
        <div className="w-full max-w-full overflow-x-hidden">
            <div className="space-y-6 lg:space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 truncate">
                            Create Campaign
                        </h1>
                        <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2 truncate">
                            Step {currentStep} of {totalSteps}: {getStepTitle(currentStep)}
                        </p>
                    </div>
                    <div className="flex items-center space-x-3 flex-shrink-0">
                        <Button variant="outline" asChild>
                            <Link href="/admin/campaigns">Cancel</Link>
                        </Button>
                    </div>
                </div>

                {/* Progress Steps */}
                <ProgressSteps currentStep={currentStep} totalSteps={totalSteps} />

                {/* Step 1: Basic Info */}
                {currentStep === 1 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>Enter the campaign details and schedule</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Campaign Name *</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Buy 3 Get ₹200 Off"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Internal notes about this campaign"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Campaign Duration *</Label>
                                <CampaignDateRangePicker
                                    value={dateRange}
                                    onChange={setDateRange}
                                    label="Campaign date range"
                                />
                                <p className="text-xs text-gray-500">Select when this campaign should be active</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="priority">Priority</Label>
                                    <Input
                                        id="priority"
                                        type="number"
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        placeholder="Higher number = higher priority"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Rules */}
                {currentStep === 2 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Campaign Conditions</CardTitle>
                            <CardDescription>Add rules that must ALL be met for campaign to apply</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Added Rules */}
                            {rules.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Active Rules (ANDed together)</Label>
                                    {rules.map((rule, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="text-sm">
                                                <span className="font-medium">{getRuleDisplayText(rule)}</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeRule(index)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add New Rule */}
                            <div className="space-y-3 p-4 border rounded-lg">
                                <Label>Add New Rule</Label>

                                <Select
                                    value={currentRule.rule_type}
                                    onValueChange={(v: any) => setCurrentRule({ ...currentRule, rule_type: v, value: {} })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="min_items">Minimum Items</SelectItem>
                                        <SelectItem value="min_cart_value">Minimum Cart Value</SelectItem>
                                        <SelectItem value="category">Category</SelectItem>
                                        <SelectItem value="collection">Collection</SelectItem>
                                    </SelectContent>
                                </Select>

                                {currentRule.rule_type === 'min_items' && (
                                    <Input
                                        type="number"
                                        placeholder="Number of items (e.g., 3)"
                                        value={(currentRule.value as any)?.count || ''}
                                        onChange={(e) => setCurrentRule({
                                            ...currentRule,
                                            value: { count: parseInt(e.target.value) }
                                        })}
                                    />
                                )}

                                {currentRule.rule_type === 'min_cart_value' && (
                                    <Input
                                        type="number"
                                        placeholder="Cart value (e.g., 1999)"
                                        value={(currentRule.value as any)?.amount || ''}
                                        onChange={(e) => setCurrentRule({
                                            ...currentRule,
                                            value: { amount: parseFloat(e.target.value) }
                                        })}
                                    />
                                )}

                                {(currentRule.rule_type === 'category' || currentRule.rule_type === 'collection') && (
                                    <Input
                                        placeholder={`${currentRule.rule_type} ID (UUID)`}
                                        value={(currentRule.value as any)?.[`${currentRule.rule_type}_id`] || ''}
                                        onChange={(e) => setCurrentRule({
                                            ...currentRule,
                                            value: { [`${currentRule.rule_type}_id`]: e.target.value }
                                        })}
                                    />
                                )}

                                <Button onClick={addRule} variant="outline" className="w-full">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Rule
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 3: Actions */}
                {currentStep === 3 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Discount Settings</CardTitle>
                            <CardDescription>Configure the discount to apply when conditions are met</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Discount Type</Label>
                                <Select
                                    value={action.discount_type}
                                    onValueChange={(v: any) => setAction({ ...action, discount_type: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="flat">Flat Amount (₹)</SelectItem>
                                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Discount Value *</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={action.discount_value || ''}
                                    onChange={(e) => setAction({ ...action, discount_value: parseFloat(e.target.value) || 0 })}
                                    placeholder={action.discount_type === 'flat' ? 'Amount in ₹' : 'Percentage (0-100)'}
                                />
                            </div>

                            {action.discount_type === 'percentage' && (
                                <div className="space-y-2">
                                    <Label>Max Discount Cap (Optional)</Label>
                                    <Input
                                        type="number"
                                        value={action.max_discount || ''}
                                        onChange={(e) => setAction({
                                            ...action,
                                            max_discount: e.target.value ? parseFloat(e.target.value) : null
                                        })}
                                        placeholder="Maximum discount amount in ₹"
                                    />
                                </div>
                            )}

                            {/* Summary */}
                            <div className="p-4 bg-gray-50 rounded-lg border">
                                <h4 className="font-medium text-gray-900 mb-2">Campaign Summary</h4>
                                <div className="space-y-1 text-sm text-gray-600">
                                    <p><strong>Name:</strong> {name}</p>
                                    <p><strong>Duration:</strong> {dateRange ? `${dateRange.start} to ${dateRange.end}` : 'Not set'}</p>
                                    <p><strong>Conditions:</strong> {rules.length} rule(s)</p>
                                    <p><strong>Discount:</strong> {action.discount_type === 'flat' ? `₹${action.discount_value}` : `${action.discount_value}%`}
                                        {action.discount_type === 'percentage' && action.max_discount ? ` (max ₹${action.max_discount})` : ''}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Navigation */}
                <div className="flex justify-between">
                    <Button
                        variant="outline"
                        onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                        disabled={currentStep === 1}
                    >
                        Previous
                    </Button>

                    {currentStep === totalSteps ? (
                        <div className="flex items-center space-x-3">
                            <Button
                                variant="outline"
                                onClick={() => handleSubmit(true)}
                                disabled={loading}
                            >
                                Save as Draft
                            </Button>
                            <Button
                                className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25"
                                onClick={() => handleSubmit(false)}
                                disabled={loading || action.discount_value <= 0}
                            >
                                <Save className="mr-2 h-4 w-4" />
                                {loading ? "Creating..." : "Create Campaign"}
                            </Button>
                        </div>
                    ) : (
                        <Button
                            onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
                            disabled={!canProceedToStep(currentStep + 1)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Next
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
