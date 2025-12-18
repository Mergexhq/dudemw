import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ShoppingCart, Package, User, CreditCard, AlertTriangle, CheckCircle } from "lucide-react"
import { RecentActivity as RecentActivityType } from "@/lib/actions/analytics"
import { formatDistanceToNow } from "date-fns"

interface RecentActivityProps {
  activities: RecentActivityType[]
  isLoading?: boolean
}

const statusColors = {
  new: "default",
  warning: "destructive",
  success: "outline",
  info: "secondary",
} as const

const iconColors = {
  new: "text-blue-500",
  warning: "text-red-500",
  success: "text-green-500",
  info: "text-gray-500",
} as const

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'order_placed':
      return ShoppingCart
    case 'product_created':
      return Package
    case 'inventory_updated':
      return AlertTriangle
    case 'customer_registered':
      return User
    default:
      return CheckCircle
  }
}

const getActivityStatus = (type: string) => {
  switch (type) {
    case 'order_placed':
      return 'new'
    case 'product_created':
      return 'success'
    case 'inventory_updated':
      return 'warning'
    case 'customer_registered':
      return 'info'
    default:
      return 'info'
  }
}

export function RecentActivity({ activities, isLoading }: RecentActivityProps) {
  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900">Recent Activity</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Loading recent activities...</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start space-x-4 p-3 rounded-lg bg-gray-50/50">
                <div className="w-8 h-8 bg-gray-200 rounded-xl animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 w-64 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900">Recent Activity</CardTitle>
            <p className="text-sm text-gray-600 mt-1">No recent activities</p>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-8">No activities to display</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div>
          <CardTitle className="text-xl font-semibold text-gray-900">Recent Activity</CardTitle>
          <p className="text-sm text-gray-600 mt-1">Latest system activities and updates</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const ActivityIcon = getActivityIcon(activity.type)
            const status = getActivityStatus(activity.type)
            
            return (
              <div 
                key={activity.id} 
                className="flex items-start space-x-4 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors"
              >
                <div className={`p-2 rounded-xl ${
                  status === 'new' ? 'bg-blue-100' :
                  status === 'warning' ? 'bg-red-100' :
                  status === 'success' ? 'bg-green-100' :
                  'bg-gray-100'
                }`}>
                  <ActivityIcon className={`h-4 w-4 ${
                    status === 'new' ? 'text-blue-600' :
                    status === 'warning' ? 'text-red-600' :
                    status === 'success' ? 'text-green-600' :
                    'text-gray-600'
                  }`} />
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900 capitalize">
                      {activity.type.replace('_', ' ')}
                    </p>
                    <Badge className={`text-xs font-medium ${
                      status === 'new' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                      status === 'warning' ? 'bg-red-100 text-red-700 border-red-200' :
                      status === 'success' ? 'bg-green-100 text-green-700 border-green-200' :
                      'bg-gray-100 text-gray-700 border-gray-200'
                    }`}>
                      {status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700">{activity.description}</p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}