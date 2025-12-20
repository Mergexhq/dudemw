'use client'

import React from 'react'
import { CustomerWithStats } from '@/lib/types/customers'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Mail, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'

interface CustomersTableProps {
  customers: CustomerWithStats[]
  isLoading?: boolean
}

export function CustomersTable({ customers, isLoading }: CustomersTableProps) {
  const router = useRouter()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400"
            data-testid={`customer-status-${status}`}
          >
            Active
          </Badge>
        )
      case 'inactive':
        return (
          <Badge
            variant="outline"
            className="bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-400"
            data-testid={`customer-status-${status}`}
          >
            Inactive
          </Badge>
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (customers.length === 0) {
    return (
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
        <CardContent className="p-8">
          <div className="text-center text-muted-foreground">
            No customers found. Try adjusting your filters or check back later.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50" data-testid="customers-table">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Users className="h-5 w-5 text-red-600" />
            Customers ({customers.length})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-auto max-h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Total Spent</TableHead>
                <TableHead className="text-right">Avg Order</TableHead>
                <TableHead>Last Order</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow
                  key={customer.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/admin/customers/${customer.id}`)}
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{customer.email}</span>
                      {customer.metadata?.full_name && (
                        <span className="text-sm text-muted-foreground">
                          {customer.metadata.full_name}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(customer.status)}</TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium">{customer.totalOrders}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium">₹{customer.totalSpent.toLocaleString()}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-muted-foreground">
                      ₹{customer.averageOrderValue.toFixed(0)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {customer.lastOrderDate ? (
                      <span className="text-sm">
                        {formatDistanceToNow(new Date(customer.lastOrderDate), {
                          addSuffix: true,
                        })}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">No orders</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {formatDistanceToNow(new Date(customer.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/admin/customers/${customer.id}`)
                        }}
                        data-testid={`view-customer-${customer.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.location.href = `mailto:${customer.email}`
                        }}
                        data-testid={`email-customer-${customer.id}`}
                      >
                        <Mail className="h-4 w-4" />
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
