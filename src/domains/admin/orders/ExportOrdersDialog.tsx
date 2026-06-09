"use client"

import { useState } from "react"
import { Download, CheckSquare, Square } from "lucide-react"
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
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const d = new Date()
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    })
    const [selectedOrderStatuses, setSelectedOrderStatuses] = useState<string[]>([])
    const [selectedPaymentStatuses, setSelectedPaymentStatuses] = useState<string[]>([])

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
            if (!startDate || !endDate) {
                toast.error("Please select both start and end dates")
                return
            }
            if (new Date(startDate) > new Date(endDate)) {
                toast.error("Start date cannot be after end date")
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
                filterPayload.created_at = {
                    from: new Date(startDate).toISOString(),
                    to: (() => {
                        const end = new Date(endDate)
                        end.setHours(23, 59, 59, 999)
                        return end.toISOString()
                    })()
                }
            } else if (exportType === "monthly") {
                const [yearStr, monthStr] = selectedMonth.split("-")
                const year = parseInt(yearStr, 10)
                const month = parseInt(monthStr, 10) - 1
                const fromDate = new Date(year, month, 1)
                const toDate = new Date(year, month + 1, 0, 23, 59, 59, 999)
                filterPayload.created_at = {
                    from: fromDate.toISOString(),
                    to: toDate.toISOString()
                }
            }

            // Override with dialog-specific status filters if selected
            if (selectedOrderStatuses.length > 0) {
                filterPayload.order_status = selectedOrderStatuses
            }
            if (selectedPaymentStatuses.length > 0) {
                filterPayload.payment_status = selectedPaymentStatuses
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

                let fileName = `orders-export`
                if (exportType === "date_range") {
                    fileName += `-from-${startDate}-to-${endDate}`
                } else if (exportType === "monthly") {
                    fileName += `-${selectedMonth}`
                } else {
                    fileName += `-${new Date().toISOString().split("T")[0]}`
                }

                if (selectedOrderStatuses.length > 0) {
                    fileName += `-${selectedOrderStatuses.join("-")}`
                }
                if (selectedPaymentStatuses.length > 0) {
                    fileName += `-${selectedPaymentStatuses.join("-")}`
                }
                fileName += `.csv`
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
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full text-sm border border-gray-200 rounded-md p-2 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-gray-800"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">End Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full text-sm border border-gray-200 rounded-md p-2 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-gray-800"
                                />
                            </div>
                        </div>
                    )}

                    {exportType === "monthly" && (
                        <div className="pt-2">
                            <label className="text-xs text-gray-500 block mb-1">Select Month</label>
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="w-full text-sm border border-gray-200 rounded-md p-2 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-gray-800"
                            />
                        </div>
                    )}
                </div>

                {/* Status Filters Section */}
                <div className="space-y-3 pb-4 border-b border-gray-100">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                        Filter Status (Optional)
                    </label>
                    <div className="space-y-3">
                        <div>
                            <span className="text-xs text-gray-400 block mb-1.5 font-medium">Order Status</span>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { label: 'Pending (Abandoned)', value: 'pending' },
                                    { label: 'Processing', value: 'processing' },
                                    { label: 'Shipped', value: 'shipped' },
                                    { label: 'Delivered', value: 'delivered' },
                                    { label: 'Cancelled', value: 'cancelled' },
                                ].map((status) => {
                                    const isChecked = selectedOrderStatuses.includes(status.value)
                                    return (
                                        <button
                                            key={status.value}
                                            type="button"
                                            onClick={() => {
                                                setSelectedOrderStatuses(prev =>
                                                    prev.includes(status.value)
                                                        ? prev.filter(s => s !== status.value)
                                                        : [...prev, status.value]
                                                )
                                            }}
                                            className={`px-2 py-1 text-xs rounded-md border transition-all cursor-pointer ${
                                                isChecked
                                                    ? "bg-red-50 border-red-500 text-red-700 font-semibold"
                                                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                            }`}
                                        >
                                            {status.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div>
                            <span className="text-xs text-gray-400 block mb-1.5 font-medium">Payment Status</span>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { label: 'Paid', value: 'paid' },
                                    { label: 'Pending', value: 'pending' },
                                    { label: 'Failed', value: 'failed' },
                                    { label: 'Expired', value: 'expired' },
                                    { label: 'Refunded', value: 'refunded' },
                                ].map((status) => {
                                    const isChecked = selectedPaymentStatuses.includes(status.value)
                                    return (
                                        <button
                                            key={status.value}
                                            type="button"
                                            onClick={() => {
                                                setSelectedPaymentStatuses(prev =>
                                                    prev.includes(status.value)
                                                        ? prev.filter(s => s !== status.value)
                                                        : [...prev, status.value]
                                                )
                                            }}
                                            className={`px-2 py-1 text-xs rounded-md border transition-all cursor-pointer ${
                                                isChecked
                                                    ? "bg-red-50 border-red-500 text-red-700 font-semibold"
                                                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                            }`}
                                        >
                                            {status.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
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
