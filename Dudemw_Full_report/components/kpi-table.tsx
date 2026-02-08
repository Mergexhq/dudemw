'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const kpis = [
  {
    metric: 'Overall Conversion Rate',
    currentBaseline: 'Establish post-fix',
    target: '+50% lift',
    targetDetail: '2.5-3% industry avg',
    impact: 'Critical',
    trend: 'up',
  },
  {
    metric: 'Cart Abandonment Rate',
    currentBaseline: '100% (bug)',
    target: '60-65%',
    targetDetail: 'Industry standard',
    impact: 'Critical',
    trend: 'down',
  },
  {
    metric: 'Mobile Conversion Rate',
    currentBaseline: 'Establish post-fix',
    target: 'Match/exceed desktop',
    targetDetail: 'Mobile-first optimization',
    impact: 'High',
    trend: 'up',
  },
  {
    metric: 'Average Order Value',
    currentBaseline: 'Establish baseline',
    target: '+15%',
    targetDetail: 'Via trust signals',
    impact: 'High',
    trend: 'up',
  },
  {
    metric: 'WhatsApp Engagement Rate',
    currentBaseline: 'Homepage only',
    target: '10% of visitors',
    targetDetail: 'Support interactions',
    impact: 'Medium',
    trend: 'up',
  },
  {
    metric: 'Time to Purchase',
    currentBaseline: 'Establish baseline',
    target: '-20%',
    targetDetail: 'Reduced friction',
    impact: 'Medium',
    trend: 'down',
  },
  {
    metric: 'Trust Signal Engagement',
    currentBaseline: '0 reviews visible',
    target: '30%+ engagement',
    targetDetail: 'Review clicks/reads',
    impact: 'High',
    trend: 'up',
  },
  {
    metric: 'Bounce Rate',
    currentBaseline: 'Establish baseline',
    target: '-25%',
    targetDetail: 'Improved UX',
    impact: 'Medium',
    trend: 'down',
  },
]

export function KPITable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Key Performance Indicators</CardTitle>
        <CardDescription>30-day targets following Phase 2 implementation</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Metric</TableHead>
                <TableHead>Current Baseline</TableHead>
                <TableHead>30-Day Target</TableHead>
                <TableHead>Context</TableHead>
                <TableHead className="text-center">Impact</TableHead>
                <TableHead className="text-center">Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kpis.map((kpi, index) => (
                <TableRow key={index} className="hover:bg-muted/50">
                  <TableCell className="font-semibold">{kpi.metric}</TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">{kpi.currentBaseline}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-primary">{kpi.target}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{kpi.targetDetail}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={
                        kpi.impact === 'Critical'
                          ? 'bg-destructive/10 text-destructive border-destructive/20'
                          : kpi.impact === 'High'
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-secondary/10 text-secondary border-secondary/20'
                      }
                    >
                      {kpi.impact}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {kpi.trend === 'up' && (
                      <div className="inline-flex items-center gap-1 text-accent">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-xs font-semibold">Up</span>
                      </div>
                    )}
                    {kpi.trend === 'down' && (
                      <div className="inline-flex items-center gap-1 text-accent">
                        <TrendingDown className="h-4 w-4" />
                        <span className="text-xs font-semibold">Down</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-6 p-4 rounded-lg bg-muted/50 space-y-2">
          <h4 className="font-semibold text-sm">Measurement Methodology</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            All KPIs will be tracked using Google Analytics 4 and e-commerce event tracking. Baselines will be established in the first week post-checkout fix. Targets are conservative estimates based on industry benchmarks for Indian e-commerce and competitive analysis.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
