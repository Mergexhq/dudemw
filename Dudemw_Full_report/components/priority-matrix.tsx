'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface MatrixItem {
  id: string
  title: string
  impact: 'high' | 'medium' | 'low'
  effort: 'high' | 'medium' | 'low'
  category: string
  description: string
}

const items: MatrixItem[] = [
  // High Impact, Low Effort (Quick Wins)
  {
    id: '1',
    title: 'Checkout Bug Fix',
    impact: 'high',
    effort: 'low',
    category: 'Critical',
    description: 'Fix redirect to About Us page',
  },
  {
    id: '2',
    title: 'Trust Badges',
    impact: 'high',
    effort: 'low',
    category: 'Trust',
    description: 'Add secure payment badges',
  },
  {
    id: '3',
    title: 'WhatsApp Widget',
    impact: 'high',
    effort: 'low',
    category: 'Support',
    description: 'Deploy on all pages',
  },
  {
    id: '4',
    title: 'Free Shipping Message',
    impact: 'high',
    effort: 'low',
    category: 'Conversion',
    description: 'Threshold messaging',
  },
  {
    id: '5',
    title: 'Breadcrumbs',
    impact: 'high',
    effort: 'low',
    category: 'UX',
    description: 'Product page navigation',
  },

  // High Impact, Medium Effort (Strategic Improvements)
  {
    id: '6',
    title: 'Review System',
    impact: 'high',
    effort: 'medium',
    category: 'Trust',
    description: 'Verified buyer reviews',
  },
  {
    id: '7',
    title: 'Product Copy Rewrite',
    impact: 'high',
    effort: 'medium',
    category: 'Conversion',
    description: '20 SKUs benefit-driven',
  },
  {
    id: '8',
    title: 'Social Proof Signals',
    impact: 'high',
    effort: 'medium',
    category: 'Trust',
    description: 'Real-time notifications',
  },

  // High Impact, High Effort (Major Projects)
  {
    id: '9',
    title: 'AI Lifestyle Images',
    impact: 'high',
    effort: 'high',
    category: 'Visual',
    description: '15-20 premium images',
  },
  {
    id: '10',
    title: 'Compliance Pages',
    impact: 'high',
    effort: 'high',
    category: 'Trust',
    description: 'Complete rewrite',
  },

  // Medium Impact, Low Effort
  {
    id: '11',
    title: 'Form Dropdown Fix',
    impact: 'medium',
    effort: 'low',
    category: 'UX',
    description: 'State selection combobox',
  },
  {
    id: '12',
    title: 'CTA Optimization',
    impact: 'medium',
    effort: 'low',
    category: 'UX',
    description: 'Shop Now button links',
  },
  {
    id: '13',
    title: 'Urgency Micro-Copy',
    impact: 'medium',
    effort: 'low',
    category: 'Conversion',
    description: 'Stock/viewing notifications',
  },

  // Medium Impact, Medium Effort
  {
    id: '14',
    title: 'Brand Story',
    impact: 'medium',
    effort: 'medium',
    category: 'Content',
    description: 'Modern Man narrative',
  },
  {
    id: '15',
    title: 'Cart Recovery',
    impact: 'medium',
    effort: 'medium',
    category: 'WhatsApp',
    description: 'Automated campaigns',
  },
]

const getPositionClass = (impact: string, effort: string) => {
  const positions = {
    'high-low': 'top-[10%] right-[10%]',
    'high-medium': 'top-[10%] right-[40%]',
    'high-high': 'top-[10%] right-[70%]',
    'medium-low': 'top-[40%] right-[10%]',
    'medium-medium': 'top-[40%] right-[40%]',
    'medium-high': 'top-[40%] right-[70%]',
    'low-low': 'top-[70%] right-[10%]',
    'low-medium': 'top-[70%] right-[40%]',
    'low-high': 'top-[70%] right-[70%]',
  }
  return positions[`${impact}-${effort}` as keyof typeof positions] || 'top-1/2 left-1/2'
}

const categoryColors: Record<string, string> = {
  Critical: '#dc2626',
  Trust: '#4854d6',
  Support: '#5b8fc9',
  Conversion: '#5eb3b3',
  UX: '#8b7fc9',
  Visual: '#59b88f',
  Content: '#d4a373',
  WhatsApp: '#59b88f',
}

export function PriorityMatrix() {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Impact vs. Effort Matrix</CardTitle>
        <CardDescription>Strategic prioritization of recommendations</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Matrix Visualization */}
        <div className="relative h-[600px] rounded-lg border-2 border-border bg-gradient-to-br from-background to-muted/20">
          {/* Quadrant Labels */}
          <div className="absolute top-4 right-4 text-sm font-semibold text-accent">
            Quick Wins
          </div>
          <div className="absolute top-4 left-4 text-sm font-semibold" style={{ color: '#d4a373' }}>
            Major Projects
          </div>
          <div className="absolute bottom-4 right-4 text-sm font-semibold text-muted-foreground">
            Low Priority
          </div>
          <div className="absolute bottom-4 left-4 text-sm font-semibold text-muted-foreground">
            Fill-ins
          </div>

          {/* Axis Labels */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-8 text-sm font-semibold text-muted-foreground">
            Effort →
          </div>
          <div
            className="absolute top-1/2 -translate-y-1/2 -left-12 text-sm font-semibold text-muted-foreground"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg) translateX(50%)' }}
          >
            Impact →
          </div>

          {/* Grid Lines */}
          <div className="absolute inset-0">
            <div className="absolute top-1/3 left-0 right-0 h-px bg-border" />
            <div className="absolute top-2/3 left-0 right-0 h-px bg-border" />
            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-border" />
            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-border" />
          </div>

          {/* Items */}
          <TooltipProvider>
            {items.map((item) => (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <div
                    className={`absolute cursor-pointer transition-all duration-300 ${getPositionClass(item.impact, item.effort)}`}
                    style={{
                      transform: hoveredItem === item.id ? 'scale(1.2)' : 'scale(1)',
                      zIndex: hoveredItem === item.id ? 10 : 1,
                    }}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <div
                      className="w-3 h-3 rounded-full border-2 border-background shadow-lg"
                      style={{ backgroundColor: categoryColors[item.category] }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-xs"
                  style={{ borderColor: categoryColors[item.category] }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" style={{ borderColor: categoryColors[item.category], color: categoryColors[item.category] }}>
                        {item.category}
                      </Badge>
                    </div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                    <div className="flex gap-2 text-xs pt-2 border-t">
                      <span className="font-semibold">Impact:</span>
                      <span className="capitalize">{item.impact}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="font-semibold">Effort:</span>
                      <span className="capitalize">{item.effort}</span>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>

        {/* Legend */}
        <div className="mt-12 p-4 rounded-lg bg-muted/50 space-y-4">
          <h4 className="font-semibold text-sm">Category Legend</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(categoryColors).map(([category, color]) => (
              <div key={category} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full border border-background"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-muted-foreground">{category}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Strategic Focus:</strong> The matrix reveals 5 quick wins (high impact, low effort) that should be implemented immediately, led by the critical checkout bug fix. Following these, 3 strategic improvements (high impact, medium effort) including the review system and product copy rewrite form the core of Phase 2. Major projects like AI imagery generation are scheduled for Days 3-5 when foundation work is complete.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
