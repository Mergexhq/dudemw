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

  // Define columns for virtualized table
  const columns = [
    {
      key: 'customer',
      header: 'Customer',
      render: (customer: CustomerWithStats) => (
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
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (customer: CustomerWithStats) => (
        <TableCell>{getStatusBadge(customer.status)}</TableCell>
      ),
    },
    {
      key: 'orders',
      header: 'Orders',
      render: (customer: CustomerWithStats) => (
        <TableCell className="text-right">
          <span className="font-medium">{customer.totalOrders}</span>
        </TableCell>
      ),
    },
    {
      key: 'totalSpent',
      header: 'Total Spent',
      render: (customer: CustomerWithStats) => (
        <TableCell className="text-right">
          <span className="font-medium">₹{customer.totalSpent.toLocaleString()}</span>
        </TableCell>
      ),
    },
    {
      key: 'avgOrder',
      header: 'Avg Order',
      render: (customer: CustomerWithStats) => (
        <TableCell className="text-right">
          <span className="text-muted-foreground">
            ₹{customer.averageOrderValue.toFixed(0)}
          </span>
        </TableCell>
      ),
    },
    {
      key: 'lastOrder',
      header: 'Last Order',
      render: (customer: CustomerWithStats) => (
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
      ),
    },
    {
      key: 'joined',
      header: 'Joined',
      render: (customer: CustomerWithStats) => (
        <TableCell>
          <span className="text-sm">
            {formatDistanceToNow(new Date(customer.created_at), {
              addSuffix: true,
            })}
          </span>
        </TableCell>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (customer: CustomerWithStats) => (
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
      ),
    },
  ]

  return (
    <div data-testid="customers-table">
      <VirtualizedTable
        data={customers}
        columns={columns}
        estimatedRowHeight={80}
        isLoading={isLoading}
        emptyMessage="No customers found. Try adjusting your filters or check back later."
        onRowClick={(customer) => router.push(`/admin/customers/${customer.id}`)}
      />
    </div>
  )
}
