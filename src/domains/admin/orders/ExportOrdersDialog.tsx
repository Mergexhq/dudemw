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
    trigger?: React.ReactNode
}

export function ExportOrdersDialog({ filters, search, trigger }: ExportOrdersDialogProps) {
    const [open, setOpen] = useState(false)
    const [selectedFields, setSelectedFields] = useState<string[]>(ALL_FIELD_KEYS)
    const [isExporting, setIsExporting] = useState(false)

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

        setIsExporting(true)
        try {
            const result = await exportOrders(
                { ...filters, search } as any,
                selectedFields
            )

            if (result.success && result.data) {
                const blob = new Blob([result.data], { type: "text/csv" })
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = `orders-export-${new Date().toISOString().split("T")[0]}.csv`
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
                        Export
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
                                            className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
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
