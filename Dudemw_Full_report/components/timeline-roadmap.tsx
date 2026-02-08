'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, Zap, Sparkles, CheckCircle2, Clock } from 'lucide-react'

const phases = [
  {
    id: 'days-1-2',
    title: 'Days 1-2: Critical Fixes & Foundation',
    budget: '₹8,000',
    icon: AlertTriangle,
    color: 'destructive',
    items: [
      {
        priority: 'Priority 0',
        title: 'Checkout Bug Resolution',
        description: 'Fix redirect to About Us page after shipping details submission',
        impact: 'Critical',
        type: 'Showstopper',
      },
      {
        priority: 'Priority 1',
        title: 'Navigation Optimization',
        description: 'Fix "Shop Now" buttons to link directly to products, not categories',
        impact: 'High',
        type: 'UX',
      },
      {
        priority: 'Priority 1',
        title: 'Breadcrumb Navigation',
        description: 'Add breadcrumbs to all product pages for easier mobile navigation',
        impact: 'High',
        type: 'UX',
      },
      {
        priority: 'Priority 1',
        title: 'Checkout Form Fix',
        description: 'Replace State combobox with standard dropdown',
        impact: 'Medium',
        type: 'UX',
      },
      {
        priority: 'Priority 1',
        title: 'WhatsApp Widget',
        description: 'Deploy consistently across product and checkout pages',
        impact: 'Medium',
        type: 'Support',
      },
      {
        priority: 'Priority 1',
        title: 'Trust Badges',
        description: 'Add secure payment and easy returns badges to checkout',
        impact: 'High',
        type: 'Trust',
      },
    ],
  },
  {
    id: 'days-3-5',
    title: 'Days 3-5: Core Improvements',
    budget: '₹19,996',
    icon: Zap,
    color: 'primary',
    items: [
      {
        priority: 'Core',
        title: 'Review System Integration',
        description: 'Implement review system with automated post-purchase requests',
        impact: 'High',
        type: 'Trust',
      },
      {
        priority: 'Core',
        title: 'Verified Buyer Badges',
        description: 'Add verification and quality guarantee icons',
        impact: 'High',
        type: 'Trust',
      },
      {
        priority: 'Core',
        title: 'Compliance Pages Rewrite',
        description: 'Clear, trust-building language for Shipping, Returns, Refunds',
        impact: 'Medium',
        type: 'Trust',
      },
      {
        priority: 'Core',
        title: 'Product Description Overhaul',
        description: 'Rewrite top 20 products with benefit-driven copy',
        impact: 'High',
        type: 'Copy',
      },
      {
        priority: 'Core',
        title: 'Brand Story Development',
        description: 'Create "Modern Man" narrative for homepage',
        impact: 'Medium',
        type: 'Copy',
      },
      {
        priority: 'Core',
        title: 'AI Lifestyle Imagery',
        description: 'Generate 15-20 premium, consistent lifestyle images',
        impact: 'High',
        type: 'Visual',
      },
      {
        priority: 'Core',
        title: 'Urgency Micro-Copy',
        description: 'Add transparent urgency elements at checkout',
        impact: 'Medium',
        type: 'Copy',
      },
    ],
  },
  {
    id: 'days-6-7',
    title: 'Days 6-7: Polish & Launch',
    budget: 'Testing Phase',
    icon: Sparkles,
    color: 'accent',
    items: [
      {
        priority: 'QA',
        title: 'Mobile Responsiveness Testing',
        description: 'Comprehensive QA across all updated pages',
        impact: 'Critical',
        type: 'Testing',
      },
      {
        priority: 'QA',
        title: 'Performance Optimization',
        description: 'Speed testing and Core Web Vitals optimization',
        impact: 'High',
        type: 'Testing',
      },
      {
        priority: 'QA',
        title: 'Production Deployment',
        description: 'Deploy all Phase 2 updates to live site',
        impact: 'Critical',
        type: 'Deploy',
      },
      {
        priority: 'QA',
        title: 'Analytics Setup',
        description: 'Configure conversion tracking and KPI baselines',
        impact: 'High',
        type: 'Measurement',
      },
    ],
  },
]

const typeColors: Record<string, string> = {
  Showstopper: 'bg-destructive/10 text-destructive border-destructive/20',
  UX: 'bg-primary/10 text-primary border-primary/20',
  Trust: 'bg-accent/10 text-accent border-accent/20',
  Support: 'bg-secondary/10 text-secondary border-secondary/20',
  Copy: 'bg-warning/10 text-warning border-warning/20',
  Visual: 'bg-success/10 text-success border-success/20',
  Testing: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
  Deploy: 'bg-primary/10 text-primary border-primary/20',
  Measurement: 'bg-accent/10 text-accent border-accent/20',
}

export function TimelineRoadmap() {
  const [selectedPhase, setSelectedPhase] = useState(phases[0].id)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">7-Day Implementation Sprint</CardTitle>
        <CardDescription>Structured roadmap with prioritized tasks and budget allocation</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedPhase} onValueChange={setSelectedPhase} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            {phases.map((phase) => {
              const Icon = phase.icon
              return (
                <TabsTrigger key={phase.id} value={phase.id} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">Days {phase.id.split('-')[1]}-{phase.id.split('-')[2]}</span>
                  <span className="sm:hidden">D{phase.id.split('-')[1]}-{phase.id.split('-')[2]}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {phases.map((phase) => {
            const Icon = phase.icon
            return (
              <TabsContent key={phase.id} value={phase.id} className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ 
                      backgroundColor: phase.color === 'destructive' ? '#fef2f2' : phase.color === 'primary' ? '#eff6ff' : '#f0fdf4' 
                    }}>
                      <Icon className="h-6 w-6" style={{ 
                        color: phase.color === 'destructive' ? '#dc2626' : phase.color === 'primary' ? '#4854d6' : '#5eb3b3' 
                      }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{phase.title}</h3>
                      <p className="text-sm text-muted-foreground">{phase.items.length} tasks</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-base px-4 py-2">
                    {phase.budget}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {phase.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold">{item.title}</h4>
                          <Badge variant="outline" className={typeColors[item.type]}>
                            {item.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1">
                            <span className="font-semibold text-muted-foreground">Priority:</span>
                            <span>{item.priority}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="font-semibold text-muted-foreground">Impact:</span>
                            <span className={item.impact === 'Critical' ? 'text-destructive font-semibold' : item.impact === 'High' ? 'text-primary font-semibold' : ''}>
                              {item.impact}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            )
          })}
        </Tabs>

        <div className="mt-8 p-6 rounded-lg bg-gradient-to-br from-primary/5 to-accent/5 border">
          <div className="flex items-start gap-4">
            <Clock className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
            <div className="space-y-2">
              <h4 className="font-semibold text-lg">Implementation Timeline</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This phased approach prioritizes <strong>impact while respecting the compressed timeline</strong>. The checkout bug resolution (Day 1) is non-negotiable before proceeding to optimization work. Days 3-5 focus on trust signals and content improvements that directly address Tamil Nadu consumer psychology. Final days ensure quality and measurement infrastructure.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
