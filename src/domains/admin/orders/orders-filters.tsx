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
import { Badge } from "@/components/ui/badge"
import { Search, Filter, X } from "lucide-react"

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
  return (
    <div className="space-y-4 p-4 rounded-xl bg-white/60 border border-gray-200/50 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Orders</h3>
        <span className="text-sm text-gray-600">{totalOrders} total orders</span>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search orders..."
            className="pl-10"
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          />
        </div>
        
        <Select value={filters.status} onValueChange={(value) => onFiltersChange({ ...filters, status: value })}>
          <SelectTrigger className="w-[180px]">
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
        
        <Select value={filters.paymentStatus} onValueChange={(value) => onFiltersChange({ ...filters, paymentStatus: value })}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Payment Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300">
          <Filter className="mr-2 h-4 w-4" />
          More Filters
        </Button>
      </div>
      
      {/* Active Filters */}
      {(filters.status !== 'all' || filters.paymentStatus !== 'all' || filters.search) && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Active filters:</span>
          {filters.status !== 'all' && (
            <Badge className="flex items-center space-x-1 bg-red-100 text-red-700 border-red-200">
              <span>Status: {filters.status}</span>
              <X 
                className="h-3 w-3 cursor-pointer hover:text-red-800" 
                onClick={() => onFiltersChange({ ...filters, status: 'all' })}
              />
            </Badge>
          )}
          {filters.paymentStatus !== 'all' && (
            <Badge className="flex items-center space-x-1 bg-red-100 text-red-700 border-red-200">
              <span>Payment: {filters.paymentStatus}</span>
              <X 
                className="h-3 w-3 cursor-pointer hover:text-red-800" 
                onClick={() => onFiltersChange({ ...filters, paymentStatus: 'all' })}
              />
            </Badge>
          )}
          {filters.search && (
            <Badge className="flex items-center space-x-1 bg-red-100 text-red-700 border-red-200">
              <span>Search: {filters.search}</span>
              <X 
                className="h-3 w-3 cursor-pointer hover:text-red-800" 
                onClick={() => onFiltersChange({ ...filters, search: '' })}
              />
            </Badge>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => onFiltersChange({ search: '', status: 'all', paymentStatus: 'all', dateFrom: '', dateTo: '', customer: '' })}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}