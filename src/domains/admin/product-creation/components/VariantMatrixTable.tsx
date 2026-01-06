/**
 * VariantMatrixTable Component
 * Displays and manages the variant matrix with inline editing
 * Extracted from variants-tab.tsx
 */

"use client"

import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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

interface VariantMatrixTableProps {
    variants: ProductVariant[]
    onVariantUpdate: (variantId: string, updates: Partial<ProductVariant>) => void
}

export function VariantMatrixTable({ variants, onVariantUpdate }: VariantMatrixTableProps) {
    if (variants.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Variants</CardTitle>
                    <CardDescription>
                        No variants generated yet. Add options and click "Generate Variants" to create them.
                    </CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Variants ({variants.length})</CardTitle>
                <CardDescription>
                    Manage pricing, stock, and availability for each variant
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">Variant</TableHead>
                                <TableHead className="w-[150px]">SKU</TableHead>
                                <TableHead className="w-[120px]">Price (₹)</TableHead>
                                <TableHead className="w-[120px]">MRP (₹)</TableHead>
                                <TableHead className="w-[100px]">Stock</TableHead>
                                <TableHead className="w-[100px]">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {variants.map((variant) => (
                                <TableRow key={variant.id}>
                                    <TableCell>
                                        <div className="font-medium">{variant.name}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            value={variant.sku}
                                            onChange={(e) =>
                                                onVariantUpdate(variant.id, { sku: e.target.value })
                                            }
                                            className="h-8"
                                            placeholder="SKU"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            value={variant.price}
                                            onChange={(e) =>
                                                onVariantUpdate(variant.id, { price: e.target.value })
                                            }
                                            className="h-8"
                                            placeholder="0.00"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            value={variant.mrp}
                                            onChange={(e) =>
                                                onVariantUpdate(variant.id, { mrp: e.target.value })
                                            }
                                            className="h-8"
                                            placeholder="0.00"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            value={variant.stock}
                                            onChange={(e) =>
                                                onVariantUpdate(variant.id, { stock: e.target.value })
                                            }
                                            className="h-8"
                                            placeholder="0"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={variant.active}
                                                onCheckedChange={(checked) =>
                                                    onVariantUpdate(variant.id, { active: checked })
                                                }
                                            />
                                            <Badge variant={variant.active ? "default" : "secondary"}>
                                                {variant.active ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
