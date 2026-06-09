"use client"

import { useState, useMemo, useEffect } from "react"
import { Download, CheckSquare, Square, Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { exportOrders } from "@/lib/actions/orders"
import { toast } from "sonner"
import type { OrderFilters } from "@/lib/types/orders"
import { getLocalTimeZone, endOfMonth, endOfWeek, startOfMonth, startOfWeek, today } from "@internationalized/date"
import type { DateValue } from "@internationalized/date"
import { DateRangePicker as AriaDateRangePicker, Dialog as AriaDialog, Group as AriaGroup, Popover as AriaPopover, useLocale } from "react-aria-components"
import { Button as BaseButton } from "@/components/base/buttons/button"
import { RangeCalendar } from "@/components/application/date-picker/range-calendar"
import { RangePresetButton } from "@/components/application/date-picker/range-preset"
import { cx } from "@/lib/utils/cx"
import { DialogSelect } from "@/components/ui/dialog-select"

const now = today(getLocalTimeZone())

// Months list
const MONTHS = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
]

// Last 5 years
const YEARS = (() => {
    const currentYear = new Date().getFullYear()
    const years: string[] = []
    for (let i = 0; i < 5; i++) {
        years.push(String(currentYear - i))
    }
    return years
})()

interface OrderDateRangePickerProps {
    value: { start: DateValue; end: DateValue } | null
    onChange: (value: { start: DateValue; end: DateValue } | null) => void
    label?: string
}

function OrderDateRangePicker({ value, onChange, label }: OrderDateRangePickerProps) {
    const { locale } = useLocale()
    const [focusedValue, setFocusedValue] = useState<DateValue | null>(null)
    const [tempValue, setTempValue] = useState<{ start: DateValue; end: DateValue } | null>(value)

    useEffect(() => {
        setTempValue(value)
    }, [value])

    const presets = useMemo(
        () => ({
            today: { label: "Today", value: { start: now, end: now } },
            yesterday: { label: "Yesterday", value: { start: now.subtract({ days: 1 }), end: now.subtract({ days: 1 }) } },
            thisWeek: { label: "This week", value: { start: startOfWeek(now, locale), end: endOfWeek(now, locale) } },
            lastWeek: {
                label: "Last week",
                value: {
                    start: startOfWeek(now, locale).subtract({ weeks: 1 }),
                    end: endOfWeek(now, locale).subtract({ weeks: 1 }),
                },
            },
            thisMonth: { label: "This month", value: { start: startOfMonth(now), end: endOfMonth(now) } },
            lastMonth: {
                label: "Last month",
                value: {
                    start: startOfMonth(now).subtract({ months: 1 }),
                    end: endOfMonth(now).subtract({ months: 1 }),
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
            className="w-full"
        >
            <AriaGroup className="w-full">
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
                    "origin-(--trigger-anchor-point) will-change-transform z-100 max-w-none",
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

// All available export fields grouped by category
const FIELD_GROUPS = [
    {
        label: "Order Info",
        fields: [
            { key: "order_id", label: "Order ID" },
            { key: "order_number", label: "Order Number" },
            { key: "order_status", label: "Order Status" },
            { key: "payment_status", label: "Payment Status" },
            { key: "payment_method", label: "Payment Method" },
            { key: "created_at", label: "Created At" },
            { key: "updated_at", label: "Updated At" },
        ],
    },
    {
        label: "Customer Info",
        fields: [
            { key: "customer_name", label: "Customer Name" },
            { key: "customer_email", label: "Customer Email" },
            { key: "customer_phone", label: "Customer Phone" },
        ],
    },
    {
        label: "Financials",
        fields: [
            { key: "subtotal", label: "Subtotal" },
            { key: "shipping_amount", label: "Shipping Amount" },
            { key: "discount_amount", label: "Discount Amount" },
            { key: "total_amount", label: "Total Amount" },
            { key: "items_count", label: "Items Count" },
        ],
    },
    {
        label: "Shipping",
        fields: [
            { key: "shipping_address", label: "Shipping Address" },
        ],
    },
]

// All field keys in a flat list for "select all"
const ALL_FIELD_KEYS = FIELD_GROUPS.flatMap(g => g.fields.map(f => f.key))

interface ExportOrdersDialogProps {
    filters: OrderFilters
    search: string
    selectedOrders?: string[]
    trigger?: React.ReactNode
}

export function ExportOrdersDialog({ filters, search, selectedOrders, trigger }: ExportOrdersDialogProps) {
    const [open, setOpen] = useState(false)
    const [selectedFields, setSelectedFields] = useState<string[]>(ALL_FIELD_KEYS)
    const [isExporting, setIsExporting] = useState(false)
    const [exportType, setExportType] = useState<"all" | "date_range" | "monthly">("all")
    const [dateRange, setDateRange] = useState<{ start: DateValue; end: DateValue } | null>(null)
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const d = new Date()
        return String(d.getMonth() + 1).padStart(2, '0') // e.g. "06"
    })
    const [selectedYear, setSelectedYear] = useState(() => {
        const d = new Date()
        return String(d.getFullYear()) // e.g. "2026"
    })

    const toggleField = (key: string) => {
        setSelectedFields(prev =>
            prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
        )
    }

    const selectAll = () => setSelectedFields(ALL_FIELD_KEYS)
    const deselectAll = () => setSelectedFields([])

    const allSelected = selectedFields.length === ALL_FIELD_KEYS.length
    const noneSelected = selectedFields.length === 0

    const handleExport = async () => {
        if (noneSelected) {
            toast.error("Please select at least one field to export")
            return
        }

        if (exportType === "date_range") {
            if (!dateRange || !dateRange.start || !dateRange.end) {
                toast.error("Please select a date range")
                return
            }
        }

        setIsExporting(true)
        try {
            let filterPayload: any = {}

            if (exportType === "all") {
                filterPayload = { ...filters, search }
                if (selectedOrders && selectedOrders.length > 0) {
                    filterPayload.orderIds = selectedOrders
                }
            } else if (exportType === "date_range") {
                if (dateRange && dateRange.start && dateRange.end) {
                    const start = dateRange.start.toDate(getLocalTimeZone())
                    const end = dateRange.end.toDate(getLocalTimeZone())
                    end.setHours(23, 59, 59, 999)
                    filterPayload.created_at = {
                        from: start.toISOString(),
                        to: end.toISOString()
                    }
                }
            } else if (exportType === "monthly") {
                const year = parseInt(selectedYear, 10)
                const month = parseInt(selectedMonth, 10) - 1
                const fromDate = new Date(year, month, 1)
                const toDate = new Date(year, month + 1, 0, 23, 59, 59, 999)
                filterPayload.created_at = {
                    from: fromDate.toISOString(),
                    to: toDate.toISOString()
                }
            }

            const result = await exportOrders(
                filterPayload,
                selectedFields
            )

            if (result.success && result.data) {
                const blob = new Blob([result.data], { type: "text/csv" })
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url

                let fileName = `orders-export-${new Date().toISOString().split("T")[0]}.csv`
                if (exportType === "date_range" && dateRange) {
                    const startStr = dateRange.start.toString()
                    const endStr = dateRange.end.toString()
                    fileName = `orders-export-from-${startStr}-to-${endStr}.csv`
                } else if (exportType === "monthly") {
                    fileName = `orders-export-${selectedYear}-${selectedMonth}.csv`
                }
                a.download = fileName

                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
                toast.success("Orders exported successfully")
                setOpen(false)
            } else {
                toast.error(result.error || "Failed to export orders")
            }
        } catch (error) {
            console.error("Error exporting orders:", error)
            toast.error("Failed to export orders")
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ?? (
                    <Button
                        variant="outline"
                        className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        {selectedOrders && selectedOrders.length > 0 
                            ? `Export Selected (${selectedOrders.length})` 
                            : 'Export'}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-gray-900">Export Orders</DialogTitle>
                    <DialogDescription className="text-gray-600">
                        Choose which fields to include in your CSV export.
                    </DialogDescription>
                </DialogHeader>

                {/* Export Options Section */}
                <div className="space-y-3 pb-4 border-b border-gray-100">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                        Export Options
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={() => setExportType("all")}
                            className={`p-2 text-xs font-medium rounded-md border text-center transition-all ${
                                exportType === "all"
                                    ? "bg-red-50 border-red-500 text-red-700 font-semibold"
                                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            All Orders
                        </button>
                        <button
                            type="button"
                            onClick={() => setExportType("date_range")}
                            className={`p-2 text-xs font-medium rounded-md border text-center transition-all ${
                                exportType === "date_range"
                                    ? "bg-red-50 border-red-500 text-red-700 font-semibold"
                                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            Date Range
                        </button>
                        <button
                            type="button"
                            onClick={() => setExportType("monthly")}
                            className={`p-2 text-xs font-medium rounded-md border text-center transition-all ${
                                exportType === "monthly"
                                    ? "bg-red-50 border-red-500 text-red-700 font-semibold"
                                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            Monthly Report
                        </button>
                    </div>

                    {/* Conditional inputs */}
                    {exportType === "date_range" && (
                        <div className="pt-2">
                            <label className="text-xs text-gray-500 block mb-1">Select Date Range</label>
                            <div className="w-full flex [&>div]:w-full [&_button]:w-full [&_button]:justify-start">
                                <OrderDateRangePicker
                                    value={dateRange}
                                    onChange={setDateRange}
                                />
                            </div>
                        </div>
                    )}

                    {exportType === "monthly" && (
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Select Month</label>
                                <DialogSelect
                                    value={selectedMonth}
                                    onValueChange={setSelectedMonth}
                                    options={MONTHS}
                                    placeholder="Month"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Select Year</label>
                                <DialogSelect
                                    value={selectedYear}
                                    onValueChange={setSelectedYear}
                                    options={YEARS.map((y) => ({ value: y, label: y }))}
                                    placeholder="Year"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Select All / Deselect All */}
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">
                        {selectedFields.length} of {ALL_FIELD_KEYS.length} fields selected
                    </span>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={selectAll}
                            disabled={allSelected}
                            className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <CheckSquare className="h-3 w-3 mr-1" />
                            Select All
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={deselectAll}
                            disabled={noneSelected}
                            className="h-7 text-xs text-gray-600 hover:text-gray-900"
                        >
                            <Square className="h-3 w-3 mr-1" />
                            Deselect All
                        </Button>
                    </div>
                </div>

                {/* Field Groups */}
                <div className="space-y-5 max-h-72 overflow-y-auto pr-1">
                    {FIELD_GROUPS.map(group => (
                        <div key={group.label}>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                {group.label}
                            </p>
                            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                                {group.fields.map(field => (
                                    <label
                                        key={field.key}
                                        className="flex items-center gap-2 cursor-pointer group"
                                    >
                                        <Checkbox
                                            checked={selectedFields.includes(field.key)}
                                            onCheckedChange={() => toggleField(field.key)}
                                            className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 data-[state=checked]:text-white"
                                        />
                                        <span className="text-sm text-gray-700 group-hover:text-gray-900 select-none">
                                            {field.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleExport}
                        disabled={isExporting || noneSelected}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        {isExporting ? "Exporting..." : "Export CSV"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
