'use client'

import { CustomerWithStats } from '@/lib/types/customers'
import { TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Mail } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { VirtualizedTable } from '@/components/common/virtualized-table'

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
      case 'vip':
        return (
          <Badge
            variant="outline"
            className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400"
            data-testid={`customer-status-${status}`}
          >
            VIP
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
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading customers...</p>
        </div>
      </div>
    )
  }

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground mb-2">No customers found</p>
        <p className="text-sm text-muted-foreground">
          Try adjusting your filters or check back later
        </p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden" data-testid="customers-table">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
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
              data-testid={`customer-row-${customer.id}`}
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
                <span className="font-medium">
                  ₹{customer.totalSpent.toLocaleString()}
                </span>
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
  )
}
