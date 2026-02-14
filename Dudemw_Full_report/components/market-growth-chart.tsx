'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const data = [
  { year: '2025', value: 21.60, label: '₹21.60B' },
  { year: '2026', value: 26.83, label: '₹26.83B' },
  { year: '2027', value: 33.32, label: '₹33.32B' },
  { year: '2028', value: 41.38, label: '₹41.38B' },
  { year: '2029', value: 51.39, label: '₹51.39B' },
  { year: '2030', value: 63.83, label: '₹63.83B' },
  { year: '2031', value: 79.27, label: '₹79.27B' },
  { year: '2032', value: 98.45, label: '₹98.45B' },
]

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3">
        <p className="font-semibold text-foreground">{payload[0].payload.year}</p>
        <p className="text-sm text-primary font-bold">{payload[0].payload.label}</p>
        <p className="text-xs text-muted-foreground mt-1">Market Size</p>
      </div>
    )
  }
  return null
}

export function MarketGrowthChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">India's Fashion E-Commerce Growth</CardTitle>
        <CardDescription>Market size projection 2025-2032 • 24.2% CAGR</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4854d6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4854d6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
              <XAxis
                dataKey="year"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `₹${value}B`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#4854d6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-primary">₹21.60B</div>
            <div className="text-sm text-muted-foreground">2025 Market</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-secondary">24.2%</div>
            <div className="text-sm text-muted-foreground">Annual Growth</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-accent">₹98.45B</div>
            <div className="text-sm text-muted-foreground">2032 Projection</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
