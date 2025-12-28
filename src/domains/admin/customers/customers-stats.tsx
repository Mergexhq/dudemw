'use client'

import { CustomerStats } from '@/lib/types/customers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserCheck, UserX, TrendingUp, User, UserMinus } from 'lucide-react'

interface CustomersStatsProps {
  stats?: CustomerStats | null
  isLoading?: boolean
}

export function CustomersStats({ stats, isLoading }: CustomersStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-24 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Return null or empty state if stats are not available
  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Loading...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Customers',
      value: (stats.total || 0).toLocaleString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      testId: 'total-customers-stat',
    },
    {
      title: 'Registered',
      value: (stats.registered || 0).toLocaleString(),
      icon: User,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      testId: 'registered-customers-stat',
    },
    {
      title: 'Guests',
      value: (stats.guests || 0).toLocaleString(),
      icon: UserMinus,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      testId: 'guest-customers-stat',
    },
    {
      title: 'New This Month',
      value: (stats.newThisMonth || 0).toLocaleString(),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      testId: 'new-customers-stat',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-testid="customers-stats">
      {statCards.map((stat) => {
        const Icon = stat.icon
        return (
          <Card
            key={stat.title}
            className="border-0 shadow-sm bg-gradient-to-b from-white to-gray-50 hover:shadow-md transition-all duration-200"
            data-testid={stat.testId}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
