'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const data = [
  { name: 'Trust Architecture', value: 12998, percentage: 39, fill: '#4854d6' },
  { name: 'Conversion Psychology', value: 9999, percentage: 30, fill: '#5eb3b3' },
  { name: 'Mobile UX Optimization', value: 4999, percentage: 15, fill: '#5b8fc9' },
  { name: 'Visual Assets', value: 4999, percentage: 15, fill: '#8b7fc9' },
]

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3">
        <p className="font-semibold text-foreground">{payload[0].name}</p>
        <p className="text-xl font-bold" style={{ color: payload[0].payload.fill }}>
          ₹{payload[0].value.toLocaleString()}
        </p>
        <p className="text-sm text-muted-foreground">{payload[0].payload.percentage}% of budget</p>
      </div>
    )
  }
  return null
}

const renderCustomLabel = (entry: any) => {
  return `${entry.percentage}%`
}

export function BudgetAllocationChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Phase 2 Budget Allocation</CardTitle>
        <CardDescription>₹32,995 investment across four strategic priorities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={100}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            {data.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.fill }}
                  />
                  <div>
                    <div className="font-semibold text-sm">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.percentage}% of budget</div>
                  </div>
                </div>
                <div className="text-lg font-bold" style={{ color: item.fill }}>
                  ₹{item.value.toLocaleString()}
                </div>
              </div>
            ))}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Total Investment</div>
                <div className="text-2xl font-bold text-primary">₹32,995</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
