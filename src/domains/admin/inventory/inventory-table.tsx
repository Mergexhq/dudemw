"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Edit, Plus, Minus, AlertTriangle } from "lucide-react"

const inventoryItems = [
  {
    id: "PROD-001-M",
    product: "Classic White Shirt",
    variant: "Size M",
    sku: "CWS-001-M",
    currentStock: 45,
    lowStockThreshold: 10,
    costPrice: "₹450",
    sellingPrice: "₹899",
    category: "Shirts",
  },
  {
    id: "PROD-002-L",
    product: "Denim Jacket",
    variant: "Size L",
    sku: "DJ-002-L",
    currentStock: 2,
    lowStockThreshold: 5,
    costPrice: "₹800",
    sellingPrice: "₹1,599",
    category: "Jackets",
  },
  {
    id: "PROD-003-S-BLUE",
    product: "Cotton T-Shirt",
    variant: "Size S, Blue",
    sku: "CTS-003-S-BLUE",
    currentStock: 0,
    lowStockThreshold: 10,
    costPrice: "₹300",
    sellingPrice: "₹599",
    category: "T-Shirts",
  },
  {
    id: "PROD-004-32",
    product: "Formal Trousers",
    variant: "Size 32",
    sku: "FT-004-32",
    currentStock: 3,
    lowStockThreshold: 8,
    costPrice: "₹650",
    sellingPrice: "₹1,299",
    category: "Trousers",
  },
  {
    id: "PROD-005-L",
    product: "Casual Hoodie",
    variant: "Size L",
    sku: "CH-005-L",
    currentStock: 18,
    lowStockThreshold: 5,
    costPrice: "₹600",
    sellingPrice: "₹1,199",
    category: "Hoodies",
  },
]

const getStockStatus = (current: number, threshold: number) => {
  if (current === 0) return { label: "Out of Stock", color: "destructive" as const, icon: true }
  if (current <= threshold) return { label: "Low Stock", color: "secondary" as const, icon: true }
  return { label: "In Stock", color: "outline" as const, icon: false }
}

export function InventoryTable() {
  const [selectedItem, setSelectedItem] = useState<typeof inventoryItems[0] | null>(null)
  const [adjustmentQuantity, setAdjustmentQuantity] = useState("")
  const [adjustmentReason, setAdjustmentReason] = useState("")

  const handleStockAdjustment = () => {
    // Handle stock adjustment logic here
    console.log("Adjusting stock:", { selectedItem, adjustmentQuantity, adjustmentReason })
    setSelectedItem(null)
    setAdjustmentQuantity("")
    setAdjustmentReason("")
  }

  return (
    <div className="rounded-xl border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 border-b border-gray-200/60 dark:border-gray-700/60">
            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Product</TableHead>
            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">SKU</TableHead>
            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Current Stock</TableHead>
            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Status</TableHead>
            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Cost Price</TableHead>
            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Selling Price</TableHead>
            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Category</TableHead>
            <TableHead className="text-right font-semibold text-gray-700 dark:text-gray-300">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inventoryItems.map((item) => {
            const stockStatus = getStockStatus(item.currentStock, item.lowStockThreshold)
            return (
              <TableRow key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors border-b border-gray-100 dark:border-gray-800/50">
                <TableCell>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{item.product}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{item.variant}</div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm text-gray-700 dark:text-gray-300">{item.sku}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900 dark:text-white">{item.currentStock}</span>
                    {stockStatus.icon && (
                      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    className={`font-medium ${
                      stockStatus.color === 'destructive' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' :
                      stockStatus.color === 'secondary' ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800' :
                      'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
                    }`}
                  >
                    {stockStatus.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-700 dark:text-gray-300">{item.costPrice}</TableCell>
                <TableCell className="font-semibold text-gray-900 dark:text-white">{item.sellingPrice}</TableCell>
                <TableCell className="text-gray-700 dark:text-gray-300">{item.category}</TableCell>
                <TableCell className="text-right">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={() => setSelectedItem(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adjust Stock</DialogTitle>
                        <DialogDescription>
                          Make manual adjustments to inventory levels for {item.product} ({item.variant})
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Current Stock</Label>
                            <div className="text-2xl font-bold">{item.currentStock}</div>
                          </div>
                          <div>
                            <Label>Low Stock Threshold</Label>
                            <div className="text-lg">{item.lowStockThreshold}</div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="adjustment">Adjustment Quantity</Label>
                          <div className="flex items-center space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setAdjustmentQuantity(prev => 
                                prev ? (parseInt(prev) - 1).toString() : "-1"
                              )}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                              id="adjustment"
                              value={adjustmentQuantity}
                              onChange={(e) => setAdjustmentQuantity(e.target.value)}
                              placeholder="0"
                              className="text-center"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setAdjustmentQuantity(prev => 
                                prev ? (parseInt(prev) + 1).toString() : "1"
                              )}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            New stock level: {item.currentStock + (parseInt(adjustmentQuantity) || 0)}
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="reason">Reason for Adjustment</Label>
                          <Input
                            id="reason"
                            value={adjustmentReason}
                            onChange={(e) => setAdjustmentReason(e.target.value)}
                            placeholder="e.g., Damaged goods, Found stock, etc."
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedItem(null)}>
                          Cancel
                        </Button>
                        <Button onClick={handleStockAdjustment}>
                          Update Stock
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}