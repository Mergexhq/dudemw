"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, X } from "lucide-react"

interface OrderFilters {
  search: string
  status: string
  paymentStatus: string
  dateFrom: string
  dateTo: string
  customer: string
}

interface OrdersFiltersProps {
  filters: OrderFilters
  onFiltersChange: (filters: OrderFilters) => void
  totalOrders: number
}

export function OrdersFilters({ filters, onFiltersChange, totalOrders }: OrdersFiltersProps) {
  const clearFilters = () => {
    onFiltersChange({
      search: "",
      status: "all",
      paymentStatus: "all",
      dateFrom: "",
      dateTo: "",
      customer: "",
    })
  }

  const hasActiveFilters =
    filters.search || filters.status !== "all" || filters.paymentStatus !== "all"

  // Count active filters
  const activeFilterCount = [
    filters.search,
    filters.status !== "all" ? filters.status : null,
    filters.paymentStatus !== "all" ? filters.paymentStatus : null,
  ].filter(Boolean).length

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-[300px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search orders..."
          className="pl-9 h-9 bg-white border-gray-200 focus:border-red-300 focus:ring-red-200"
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
        />
        {filters.search && (
          <button
            onClick={() => onFiltersChange({ ...filters, search: "" })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Order Status */}
      <Select
        value={filters.status}
        onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
      >
        <SelectTrigger className="w-[130px] h-9 bg-white border-gray-200">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="processing">Processing</SelectItem>
          <SelectItem value="shipped">Shipped</SelectItem>
          <SelectItem value="delivered">Delivered</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      {/* Payment Status */}
      <Select
        value={filters.paymentStatus}
        onValueChange={(value) => onFiltersChange({ ...filters, paymentStatus: value })}
      >
        <SelectTrigger className="w-[120px] h-9 bg-white border-gray-200">
          <SelectValue placeholder="Payment" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Payments</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
          <SelectItem value="refunded">Refunded</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-9 text-gray-500 hover:text-red-600 hover:bg-red-50"
        >
          <X className="h-4 w-4 mr-1" />
          Clear {activeFilterCount > 1 ? `(${activeFilterCount})` : ""}
        </Button>
      )}

      {/* Orders Count */}
      <div className="ml-auto text-sm text-gray-500">
        {totalOrders} {totalOrders === 1 ? "order" : "orders"}
      </div>
    </div>
  )
}