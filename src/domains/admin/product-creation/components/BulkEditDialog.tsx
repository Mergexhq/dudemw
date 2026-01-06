/**
 * BulkEditDialog Component
 * Provides bulk editing functionality for product variants
 * Extracted from variants-tab.tsx
 */

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Settings } from "lucide-react"

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

    const handleApply = () => {
        if (field === 'active') {
            onBulkUpdate(field, value === 'true')
        } else {
            onBulkUpdate(field, value)
        }
        setOpen(false)
        setValue('')
    }

    const getFieldLabel = (field: BulkEditField): string => {
        const labels: Record<BulkEditField, string> = {
            price: 'Price',
            mrp: 'MRP',
            stock: 'Stock',
            active: 'Status'
        }
        return labels[field]
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Bulk Edit
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Bulk Edit Variants</DialogTitle>
                    <DialogDescription>
                        Apply the same value to all {variants.length} variants
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Field to Update</Label>
                        <Select value={field} onValueChange={(v) => setField(v as BulkEditField)}>
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

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleApply} disabled={!value}>
                        Apply to All
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
