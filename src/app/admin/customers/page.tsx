"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CustomersEmptyState } from "@/components/common/empty-states"
import { Users, UserCheck, ShoppingCart, Mail, Phone, MapPin, Eye, Edit, Ban, Download } from "lucide-react"

interface Customer {
  id: number
  name: string
  email: string
  phone: string
  type: "registered" | "guest"
  totalOrders: number
  totalSpent: number
  lastOrder: string
  status: "active" | "inactive"
  location: string
  joinDate: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]) // Start with empty array
  const [stats, setStats] = useState({
    totalCustomers: 0,
    registeredUsers: 0,
    avgOrderValue: 0,
    newThisMonth: 0
  })

  const handleCustomerAction = (customerId: number, action: string) => {
    // TODO: Implement customer actions
    console.log(`Action: ${action} for customer: ${customerId}`)
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Export customers clicked")
  }

  const hasCustomers = customers.length > 0

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Customers</h1>
          <p className="text-lg text-gray-600 mt-2">
            Manage customer accounts and view purchase history
          </p>
        </div>
        {hasCustomers && (
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
              onClick={handleExport}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        )}
      </div>

      {hasCustomers ? (
        <>
          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Total Customers
                </CardTitle>
                <div className="p-2 rounded-xl bg-blue-100">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-gray-900 mb-2">{stats.totalCustomers}</div>
                <p className="text-xs text-gray-600">All time</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Registered Users
                </CardTitle>
                <div className="p-2 rounded-xl bg-green-100">
                  <UserCheck className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-gray-900 mb-2">{stats.registeredUsers}</div>
                <p className="text-xs text-gray-600">With accounts</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Avg. Order Value
                </CardTitle>
                <div className="p-2 rounded-xl bg-purple-100">
                  <ShoppingCart className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-gray-900 mb-2">₹{stats.avgOrderValue.toLocaleString()}</div>
                <p className="text-xs text-gray-600">Per customer</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  New This Month
                </CardTitle>
                <div className="p-2 rounded-xl bg-orange-100">
                  <Users className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-gray-900 mb-2">{stats.newThisMonth}</div>
                <p className="text-xs text-gray-600">New customers</p>
              </CardContent>
            </Card>
          </div>

          {/* Customers List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900">All Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/60 border border-gray-200/50 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={`/avatars/${customer.id}.jpg`} alt={customer.name} />
                        <AvatarFallback className="bg-red-100 text-red-700 font-semibold">
                          {customer.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                          <Badge
                            variant={customer.type === "registered" ? "default" : "secondary"}
                            className={customer.type === "registered"
                              ? "bg-blue-100 text-blue-700 border-blue-200"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                            }
                          >
                            {customer.type}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span>{customer.email}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Phone className="h-3 w-3" />
                            <span>{customer.phone}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{customer.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">{customer.totalOrders}</p>
                        <p className="text-xs text-gray-500">Orders</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">₹{customer.totalSpent.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Spent</p>
                      </div>
                      <Badge
                        variant={customer.status === "active" ? "default" : "secondary"}
                        className={customer.status === "active"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-gray-100 text-gray-700 border-gray-200"
                        }
                      >
                        {customer.status}
                      </Badge>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-gray-100"
                          onClick={() => handleCustomerAction(customer.id, 'view')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-gray-100"
                          onClick={() => handleCustomerAction(customer.id, 'edit')}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-red-100 text-red-600"
                          onClick={() => handleCustomerAction(customer.id, 'ban')}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <CustomersEmptyState />
      )}
    </div>
  )
}