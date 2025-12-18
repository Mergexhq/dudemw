import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Package } from "lucide-react"
import Link from "next/link"
import { RecentOrder } from "@/lib/actions/analytics"
import { formatDistanceToNow } from "date-fns"

interface RecentOrdersProps {
  orders: RecentOrder[]
  isLoading?: boolean
}

const statusColors = {
  pending: "destructive",
  processing: "secondary", 
  shipped: "default",
  delivered: "outline",
} as const

export function RecentOrders({ orders, isLoading }: RecentOrdersProps) {
  const handleOrderAction = (orderId: string, action: string) => {
    // TODO: Implement order actions
    console.log(`Action: ${action} for order: ${orderId}`)
  }

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900">Orders Needing Action</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Loading recent orders...</p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-3 p-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (orders.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900">Orders Needing Action</CardTitle>
            <p className="text-sm text-gray-600 mt-1">No recent orders found</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300" 
            asChild
          >
            <Link href="/admin/orders">
              View All Orders
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">No orders to display</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-xl font-semibold text-gray-900">Orders Needing Action</CardTitle>
          <p className="text-sm text-gray-600 mt-1">Recent orders requiring your attention</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300" 
          asChild
        >
          <Link href="/admin/orders">
            View All Orders
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-hidden rounded-lg border border-gray-200/60">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/80">
                <TableHead className="font-semibold text-gray-700">Order ID</TableHead>
                <TableHead className="font-semibold text-gray-700">Customer</TableHead>
                <TableHead className="font-semibold text-gray-700">Items</TableHead>
                <TableHead className="font-semibold text-gray-700">Total</TableHead>
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                <TableHead className="font-semibold text-gray-700">Date</TableHead>
                <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="font-mono font-medium text-gray-900">
                    {order.order_number}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900">{order.customer_name}</div>
                      <div className="text-sm text-gray-600">{order.customer_email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-700">{order.items_count}</TableCell>
                  <TableCell className="font-semibold text-gray-900">
                    ₹{order.total_amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={statusColors[order.status as keyof typeof statusColors] || "secondary"}
                      className={`${
                        order.status === 'pending' ? 'bg-red-100 text-red-700 border-red-200' :
                        order.status === 'processing' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        order.status === 'delivered' || order.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' :
                        'bg-gray-100 text-gray-700 border-gray-200'
                      } font-medium`}
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                        onClick={() => handleOrderAction(order.id, 'view')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                        onClick={() => handleOrderAction(order.id, 'process')}
                      >
                        <Package className="h-4 w-4" />
                      </Button>
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