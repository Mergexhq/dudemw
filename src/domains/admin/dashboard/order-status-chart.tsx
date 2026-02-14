'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getOrderStatusDistribution, OrderStatusData } from '@/lib/actions/analytics'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Loader2, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'

// Color mapping for order statuses
const STATUS_COLORS: Record<string, string> = {
    'processing': '#22c55e', // Green - active orders
    'pending': '#f59e0b',    // Yellow - awaiting action
    'cancelled': '#dc2626',  // Red - lost orders
    'completed': '#06b6d4',  // Cyan - fulfilled
    'unknown': '#6b7280'     // Gray - fallback
}

const STATUS_LABELS: Record<string, string> = {
    'processing': 'Processing',
    'pending': 'Pending',
    'cancelled': 'Cancelled',
    'completed': 'Completed',
    'unknown': 'Unknown'
}

export function OrderStatusChart() {
    const [statusData, setStatusData] = useState<OrderStatusData[]>([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        const result = await getOrderStatusDistribution()
        if (result.success && result.data) {
            setStatusData(result.data)
            setTotal(result.total || 0)
        }
        setLoading(false)
    }

    const chartData = statusData.map(item => ({
        name: STATUS_LABELS[item.status] || item.status,
        value: item.count,
        revenue: item.revenue,
        percentage: item.percentage
    }))

    // Calculate cancellation rate for insight
    const cancelledData = statusData.find(s => s.status === 'cancelled')
    const cancellationRate = cancelledData ? cancelledData.percentage : 0

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Order Status Distribution</CardTitle>
                    {!loading && cancellationRate > 40 && (
                        <div className="flex items-center gap-1 text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
                            <AlertCircle className="h-4 w-4" />
                            <span className="font-medium">{cancellationRate.toFixed(0)}% Cancelled</span>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="h-80 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : statusData.length === 0 ? (
                    <div className="h-80 flex items-center justify-center text-gray-500">
                        No order data available
                    </div>
                ) : (
                    <div className="space-y-4">
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={({ name, percentage }) => `${name} ${percentage.toFixed(0)}%`}
                                >
                                    {chartData.map((entry, index) => {
                                        const originalStatus = statusData[index].status
                                        return (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={STATUS_COLORS[originalStatus] || STATUS_COLORS.unknown}
                                            />
                                        )
                                    })}
                                </Pie>
                                <Tooltip
                                    formatter={(value: any, name: any, props: any) => [
                                        `${value} orders (₹${props.payload.revenue.toLocaleString()})`,
                                        name
                                    ]}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-3 gap-3 pt-4 border-t">
                            {statusData.map((status) => (
                                <div key={status.status} className="text-center">
                                    <div
                                        className="text-2xl font-bold"
                                        style={{ color: STATUS_COLORS[status.status] || STATUS_COLORS.unknown }}
                                    >
                                        {status.count}
                                    </div>
                                    <div className="text-xs text-gray-500 uppercase font-medium">
                                        {STATUS_LABELS[status.status] || status.status}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        ₹{status.revenue.toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Total */}
                        <div className="text-center pt-3 border-t">
                            <div className="text-sm text-gray-600">
                                Total Orders: <span className="font-semibold text-gray-900">{total}</span>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
