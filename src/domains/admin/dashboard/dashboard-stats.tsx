import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users } from "lucide-react"
import { DashboardStats as DashboardStatsType } from "@/lib/actions/analytics"

interface DashboardStatsProps {
  stats: DashboardStatsType | null
  isLoading?: boolean
  hasError?: boolean
}

export function DashboardStats({ stats, isLoading, hasError }: DashboardStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-8 h-8 bg-gray-200 rounded-xl animate-pulse"></div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    const emptyStatsConfig = [
      {
        title: "Revenue",
        icon: DollarSign,
        color: "green",
        description: hasError ? "Unable to load data" : "No revenue data yet",
      },
      {
        title: "Orders",
        icon: ShoppingCart,
        color: "blue",
        description: hasError ? "Unable to load data" : "No orders placed yet",
      },
      {
        title: "AOV",
        icon: Package,
        color: "purple",
        description: hasError ? "Unable to load data" : "No order value data",
      },
      {
        title: "Customers",
        icon: Users,
        color: "red",
        description: hasError ? "Unable to load data" : "No customers yet",
      },
    ]

    return (
      <div className="space-y-4">
        {hasError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              Unable to load analytics data. The dashboard will show empty states until data is available.
            </p>
          </div>
        )}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {emptyStatsConfig.map((stat) => (
            <Card key={stat.title} className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-xl ${
                  stat.color === "green" ? "bg-green-100" :
                  stat.color === "blue" ? "bg-blue-100" :
                  stat.color === "purple" ? "bg-purple-100" :
                  "bg-red-100"
                }`}>
                  <stat.icon className={`h-4 w-4 ${
                    stat.color === "green" ? "text-green-600" :
                    stat.color === "blue" ? "text-blue-600" :
                    stat.color === "purple" ? "text-purple-600" :
                    "text-red-600"
                  }`} />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stat.title === "Revenue" || stat.title === "AOV" ? "₹0" : "0"}
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-gray-500">
                    {stat.description}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const statsConfig = [
    {
      title: "Revenue",
      value: `₹${stats.revenue.current.toLocaleString()}`,
      change: stats.revenue.changePercent,
      trend: stats.revenue.change >= 0 ? "up" as const : "down" as const,
      period: "from last month",
      icon: DollarSign,
    },
    {
      title: "Orders",
      value: stats.orders.current.toString(),
      change: stats.orders.changePercent,
      trend: stats.orders.change >= 0 ? "up" as const : "down" as const,
      period: "from last week",
      icon: ShoppingCart,
    },
    {
      title: "AOV",
      value: `₹${Math.round(stats.aov.current).toLocaleString()}`,
      change: stats.aov.changePercent,
      trend: stats.aov.change >= 0 ? "up" as const : "down" as const,
      period: "from last month",
      icon: Package,
    },
    {
      title: "Customers",
      value: stats.customers.current.toString(),
      change: stats.customers.changePercent,
      trend: stats.customers.change >= 0 ? "up" as const : "down" as const,
      period: "new this month",
      icon: Users,
    },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {statsConfig.map((stat) => (
        <Card 
          key={stat.title} 
          className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-xl ${
              stat.title === "Revenue" ? "bg-green-100" :
              stat.title === "Orders" ? "bg-blue-100" :
              stat.title === "AOV" ? "bg-purple-100" :
              "bg-red-100"
            }`}>
              <stat.icon className={`h-4 w-4 ${
                stat.title === "Revenue" ? "text-green-600" :
                stat.title === "Orders" ? "text-blue-600" :
                stat.title === "AOV" ? "text-purple-600" :
                "text-red-600"
              }`} />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
            <div className="flex items-center space-x-2 text-xs">
              <Badge 
                variant={stat.trend === "up" ? "default" : "destructive"}
                className={`flex items-center space-x-1 px-2 py-1 ${
                  stat.trend === "up" 
                    ? "bg-green-100 text-green-700 border-green-200" 
                    : "bg-red-100 text-red-700 border-red-200"
                }`}
              >
                {stat.trend === "up" ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span className="font-medium">{stat.change}</span>
              </Badge>
              <span className="text-gray-600">{stat.period}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}