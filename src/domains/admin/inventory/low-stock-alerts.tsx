import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Package } from "lucide-react"
import Link from "next/link"
import { LowStockItem } from "@/lib/actions/analytics"

interface LowStockAlertsProps {
  items: LowStockItem[]
  isLoading?: boolean
}

export function LowStockAlerts({ items, isLoading }: LowStockAlertsProps) {
  const handleItemAction = (itemName: string) => {
    // TODO: Implement item action
    console.log(`Manage stock for: ${itemName}`)
  }

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="flex items-center space-x-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <span className="text-lg font-semibold text-gray-900">Low Stock Alerts</span>
              <p className="text-sm text-gray-600 font-normal">Loading inventory...</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50/50">
              <div className="flex-1 min-w-0">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (items.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="flex items-center space-x-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <span className="text-lg font-semibold text-gray-900">Inventory Status</span>
              <p className="text-sm text-gray-600 font-normal">All items well stocked</p>
            </div>
          </CardTitle>
          <Badge className="bg-green-100 text-green-700 border-green-200 font-semibold">
            Good
          </Badge>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-4">No low stock alerts at this time</p>
          <Button 
            variant="outline" 
            className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300" 
            asChild
          >
            <Link href="/admin/inventory">
              View Inventory
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center space-x-2">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <div>
            <span className="text-lg font-semibold text-gray-900">Low Stock Alerts</span>
            <p className="text-sm text-gray-600 font-normal">Items running low</p>
          </div>
        </CardTitle>
        <Badge className="bg-red-100 text-red-700 border-red-200 font-semibold">
          {items.length}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div 
            key={item.id} 
            className="flex items-center justify-between p-3 rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{item.product_title}</p>
              <p className="text-xs text-gray-600">{item.variant_name} • {item.sku}</p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge 
                variant={item.status === "out_of_stock" ? "destructive" : "secondary"}
                className={`${
                  item.status === "out_of_stock" 
                    ? 'bg-red-100 text-red-700 border-red-200' 
                    : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                } font-medium`}
              >
                {item.current_stock} left
              </Badge>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 hover:bg-gray-200"
                onClick={() => handleItemAction(item.product_title)}
              >
                <Package className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        <Button 
          variant="outline" 
          className="w-full mt-4 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300" 
          asChild
        >
          <Link href="/admin/inventory">
            Manage Inventory
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}