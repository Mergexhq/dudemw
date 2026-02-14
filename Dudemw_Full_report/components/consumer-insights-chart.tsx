'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { DollarSign, Smartphone, Shield } from 'lucide-react'

const data = [
  {
    name: 'Value-Conscious',
    value: 54,
    description: 'Prioritize deals over speed',
    icon: 'dollar',
    fill: '#d4a373',
  },
  {
    name: 'Mobile-First',
    value: 60,
    description: 'Prefer mobile shopping',
    icon: 'smartphone',
    fill: '#5b8fc9',
  },
  {
    name: 'Trust-Driven',
    value: 72,
    description: 'Prioritize trust signals',
    icon: 'shield',
    fill: '#5eb3b3',
  },
]

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3">
        <p className="font-semibold text-foreground">{payload[0].payload.name}</p>
        <p className="text-2xl font-bold" style={{ color: payload[0].payload.fill }}>
          {payload[0].value}%
        </p>
        <p className="text-xs text-muted-foreground mt-1">{payload[0].payload.description}</p>
      </div>
    )
  }
  return null
}

export function ConsumerInsightsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Tamil Nadu Consumer Characteristics</CardTitle>
        <CardDescription>Key behavioral patterns shaping purchase decisions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                angle={-15}
                textAnchor="end"
                height={60}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              {item.icon === 'dollar' && <DollarSign className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: item.fill }} />}
              {item.icon === 'smartphone' && <Smartphone className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: item.fill }} />}
              {item.icon === 'shield' && <Shield className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: item.fill }} />}
              <div className="space-y-1">
                <div className="font-semibold text-sm">{item.name}</div>
                <div className="text-2xl font-bold" style={{ color: item.fill }}>
                  {item.value}%
                </div>
                <div className="text-xs text-muted-foreground">{item.description}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
