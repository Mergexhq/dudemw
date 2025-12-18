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

export function InventoryFilters() {
  return (
    <div className="space-y-4 p-4 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            placeholder="Search products..."
            className="pl-10"
          />
        </div>
        
        <Select>
          <SelectTrigger className="w-[180px] border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <SelectValue placeholder="Stock Status" />
          </SelectTrigger>
          <SelectContent className="bg-white/95 backdrop-blur-sm dark:bg-gray-900/95">
            <SelectItem value="all">All Stock</SelectItem>
            <SelectItem value="in-stock">In Stock</SelectItem>
            <SelectItem value="low-stock">Low Stock</SelectItem>
            <SelectItem value="out-of-stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
        
        <Select>
          <SelectTrigger className="w-[180px] border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-white/95 backdrop-blur-sm dark:bg-gray-900/95">
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="shirts">Shirts</SelectItem>
            <SelectItem value="t-shirts">T-Shirts</SelectItem>
            <SelectItem value="hoodies">Hoodies</SelectItem>
            <SelectItem value="jeans">Jeans</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30">
          <Filter className="mr-2 h-4 w-4" />
          More Filters
        </Button>
      </div>
      
      {/* Active Filters */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
        <Badge className="flex items-center space-x-1 bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800">
          <span>Low Stock</span>
          <X className="h-3 w-3 cursor-pointer hover:text-red-800 dark:hover:text-red-200" />
        </Badge>
        <Button variant="ghost" size="sm" className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30">
          Clear all
        </Button>
      </div>
    </div>
  )
}