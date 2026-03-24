/**
 * BulkEditDialog Component
 * Provides bulk editing functionality for product variants
 * Uses a custom portal-based modal to avoid focus-trap conflicts
 * between Radix Dialog and React Aria Select components.
 */

"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { SelectContent } from "@/components/ui/select"
import { SelectItem } from "@/components/ui/select"
import { SelectTrigger } from "@/components/ui/select"
import { SelectValue } from "@/components/ui/select"
import { Settings, X } from "lucide-react"

interface ProductVariant {
    id: string
    name: string
    sku: string
    price: string
    mrp: string
    stock: string
    active: boolean
    image?: string
    combinations: { [optionId: string]: string }
}

interface BulkEditDialogProps {
    variants: ProductVariant[]
    onBulkUpdate: (field: keyof ProductVariant, value: string | boolean) => void
}

type BulkEditField = 'price' | 'mrp' | 'stock' | 'active'

export function BulkEditDialog({ variants, onBulkUpdate }: BulkEditDialogProps) {
    const [open, setOpen] = useState(false)
    const [field, setField] = useState<BulkEditField>('price')
    const [value, setValue] = useState('')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleApply = () => {
        if (field === 'active') {
            onBulkUpdate(field, value === 'true')
        } else {
            onBulkUpdate(field, value)
        }
        setOpen(false)
        setValue('')
    }

    const handleClose = () => {
        setOpen(false)
        setValue('')
    }

    const getFieldLabel = (f: BulkEditField): string => {
        const labels: Record<BulkEditField, string> = {
            price: 'Price',
            mrp: 'MRP',
            stock: 'Stock',
            active: 'Status'
        }
        return labels[f]
    }

    const modal = open && mounted ? createPortal(
        <div className="fixed inset-0 z-200 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
                aria-hidden="true"
            />
            {/* Dialog Panel */}
            <div
                className="relative z-10 bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6"
                role="dialog"
                aria-modal="true"
                aria-labelledby="bulk-edit-title"
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h2 id="bulk-edit-title" className="text-lg font-semibold text-gray-900">Bulk Edit Variants</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Apply the same value to all {variants.length} variants</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="rounded-sm opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Field to Update</Label>
                        <Select value={field} onValueChange={(v) => { setField(v as BulkEditField); setValue('') }}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="price">Price</SelectItem>
                                <SelectItem value="mrp">MRP</SelectItem>
                                <SelectItem value="stock">Stock</SelectItem>
                                <SelectItem value="active">Status</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>{getFieldLabel(field)}</Label>
                        {field === 'active' ? (
                            <Select value={value} onValueChange={setValue}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">Active</SelectItem>
                                    <SelectItem value="false">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input
                                type={field === 'stock' ? 'number' : 'text'}
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder={`Enter ${getFieldLabel(field).toLowerCase()}`}
                            />
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleApply} disabled={!value}>
                        Apply to All
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    ) : null

    return (
        <>
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Bulk Edit
            </Button>
            {modal}
        </>
    )
}
