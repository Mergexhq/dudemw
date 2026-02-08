'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AlertTriangle, TrendingUp, Target, Zap, CheckCircle2, Clock, DollarSign, Users, ShoppingCart, Smartphone, Shield, MessageCircle } from 'lucide-react'
import { MarketGrowthChart } from '@/components/market-growth-chart'
import { ConsumerInsightsChart } from '@/components/consumer-insights-chart'
import { BudgetAllocationChart } from '@/components/budget-allocation-chart'
import { TimelineRoadmap } from '@/components/timeline-roadmap'
import { KPITable } from '@/components/kpi-table'
import { StrategicPillars } from '@/components/strategic-pillars'
import { PriorityMatrix } from '@/components/priority-matrix'

export default function DudeMensWearReport() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.scrollY
      const progress = (scrollTop / (documentHeight - windowHeight)) * 100
      setScrollProgress(progress)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id))
          }
        })
      },
      { threshold: 0.2 }
    )

    const sections = document.querySelectorAll('[data-section]')
    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
        <div
          className="h-full bg-gradient-to-r from-primary via-secondary to-accent transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <Badge variant="outline" className="text-sm px-4 py-2">
            Strategic E-Commerce Optimization Report
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-balance">
            Dude Men's Wear
          </h1>
          <p className="text-2xl md:text-3xl text-muted-foreground font-light text-balance max-w-3xl mx-auto">
            A Comprehensive Strategic Plan for Enhanced Conversion & Sales
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-8">
            <Card className="w-40">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-primary">₹32,995</div>
                <div className="text-sm text-muted-foreground">Investment</div>
              </CardContent>
            </Card>
            <Card className="w-40">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-secondary">7 Days</div>
                <div className="text-sm text-muted-foreground">Timeline</div>
              </CardContent>
            </Card>
            <Card className="w-40">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-accent">+50%</div>
                <div className="text-sm text-muted-foreground">Target Lift</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Executive Summary */}
      <section
        id="executive-summary"
        data-section
        className={`py-20 px-4 transition-all duration-1000 ${
          visibleSections.has('executive-summary') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">Executive Summary</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-balance">
              Critical findings, market opportunity, and strategic approach
            </p>
          </div>

          <Card className="border-destructive bg-destructive/5">
            <CardHeader>
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-8 w-8 text-destructive flex-shrink-0 mt-1" />
                <div className="space-y-2">
                  <CardTitle className="text-2xl">Priority 0: Critical Checkout Blocker</CardTitle>
                  <CardDescription className="text-base">
                    Showstopper requiring immediate resolution
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground leading-relaxed">
                Our comprehensive website audit of dudemw.com revealed a <strong>showstopper</strong>: after users complete shipping details and click "Continue to Review," they are redirected to the About Us page instead of proceeding to payment, effectively breaking the entire purchase flow.
              </p>
              <div className="bg-background rounded-lg p-4 border-l-4 border-destructive">
                <p className="font-semibold text-destructive">
                  This critical bug must be resolved immediately—without a functional checkout, all other conversion optimizations deliver zero revenue impact.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  <CardTitle>Market Opportunity</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="leading-relaxed">
                  India's fashion e-commerce sector is valued at <strong className="text-primary">₹21.60 billion in 2025</strong> and projected to reach <strong className="text-accent">₹98.45 billion by 2032</strong>—a compound annual growth rate of 24.2%.
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>50%+ internet penetration nationwide</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Smartphone className="h-4 w-4" />
                  <span>33% of population under 25 years</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Target className="h-6 w-6 text-secondary" />
                  <CardTitle>Tamil Nadu Consumer Profile</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Value-Conscious</p>
                    <p className="text-sm text-muted-foreground">54% prioritize deals over speed</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Smartphone className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Mobile-First</p>
                    <p className="text-sm text-muted-foreground">60%+ prefer mobile shopping</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Trust-Driven</p>
                    <p className="text-sm text-muted-foreground">Reviews & social proof critical</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
            <CardHeader>
              <CardTitle className="text-2xl">Phase 2 Strategic Approach</CardTitle>
              <CardDescription>Four conversion multipliers aligned with Tamil Nadu consumer psychology</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-card rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Trust Architecture</h3>
                    </div>
                    <Badge variant="secondary">₹12,998</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Verified reviews, trust badges, transparent compliance
                  </p>
                </div>
                <div className="bg-card rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5 text-secondary" />
                      <h3 className="font-semibold">Mobile UX</h3>
                    </div>
                    <Badge variant="secondary">₹4,999</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Streamlined navigation, checkout optimization
                  </p>
                </div>
                <div className="bg-card rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-accent" />
                      <h3 className="font-semibold">Conversion Psychology</h3>
                    </div>
                    <Badge variant="secondary">₹9,999</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Benefit-driven copy, strategic urgency hooks
                  </p>
                </div>
                <div className="bg-card rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-accent" />
                      <h3 className="font-semibold">WhatsApp Integration</h3>
                    </div>
                    <Badge variant="secondary">Included</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Conversational commerce, cart recovery
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Market Context */}
      <section
        id="market-context"
        data-section
        className={`py-20 px-4 bg-muted/30 transition-all duration-1000 ${
          visibleSections.has('market-context') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">Market Context</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-balance">
              India's e-commerce landscape and regional consumer insights
            </p>
          </div>

          <MarketGrowthChart />
          <ConsumerInsightsChart />
        </div>
      </section>

      {/* Current State Analysis */}
      <section
        id="current-state"
        data-section
        className={`py-20 px-4 transition-all duration-1000 ${
          visibleSections.has('current-state') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">Current State Analysis</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-balance">
              Website audit findings and competitive gaps
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Critical Conversion Blockers on dudemw.com</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                  <Shield className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Trust Signal Deficit</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      While a "WRITE A REVIEW" button exists, zero customer reviews are visible on product pages. No secure payment badges appear prominently on checkout pages.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                  <Target className="h-6 w-6 text-secondary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Navigation Confusion</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Homepage CTAs like "SHOP NOW" and "Buy Now" create unexpected navigation flows. "Buy Now" triggers a modal with navigation options rather than direct checkout access. Product pages lack breadcrumbs for easy category return.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-warning flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Form Friction</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      State selection uses a combobox requiring two clicks instead of a single-click dropdown, adding micro-friction during checkout.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                  <MessageCircle className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Inconsistent WhatsApp Presence</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      The WhatsApp widget appears on the homepage but is absent from product and checkout pages where customer support queries peak.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Manyavar's Trust Architecture</CardTitle>
                <CardDescription>What market leaders do differently</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">
                  India's celebration wear leader deploys multiple trust-building mechanisms that Dude Men's Wear currently lacks:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                    <span>"Trusted by millions since 1999" prominently displayed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                    <span>Multiple trust badges: "EMPOWERING WEAVERS," "MADE IN INDIA"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                    <span>Social proof: "185 people viewed this recently"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                    <span>Free shipping threshold messaging (+34% revenue impact)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Peter England's Value Communication</CardTitle>
                <CardDescription>Benefit-driven copywriting excellence</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">
                  Positioned at ₹700-₹1,400, Peter England exemplifies benefit-driven copywriting for middle-class India:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>"Honestly" campaign validates price-conscious shopping</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Functional benefits: "wrinkle-free for busy professionals"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Climate-aware: "moisture-wicking for Indian climate"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Intent-based navigation reduces cognitive load</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Strategic Framework */}
      <section
        id="strategic-framework"
        data-section
        className={`py-20 px-4 bg-muted/30 transition-all duration-1000 ${
          visibleSections.has('strategic-framework') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">Strategic Framework</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-balance">
              Six pillars for conversion optimization
            </p>
          </div>

          <StrategicPillars />
        </div>
      </section>

      {/* Prioritized Recommendations */}
      <section
        id="recommendations"
        data-section
        className={`py-20 px-4 transition-all duration-1000 ${
          visibleSections.has('recommendations') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">Prioritized Recommendations</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-balance">
              Impact vs. effort matrix with immediate fixes and strategic improvements
            </p>
          </div>

          <PriorityMatrix />
          <BudgetAllocationChart />
        </div>
      </section>

      {/* Implementation Roadmap */}
      <section
        id="roadmap"
        data-section
        className={`py-20 px-4 bg-muted/30 transition-all duration-1000 ${
          visibleSections.has('roadmap') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">Phased Implementation Roadmap</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-balance">
              7-day sprint aligned with ₹32,995 budget
            </p>
          </div>

          <TimelineRoadmap />
        </div>
      </section>

      {/* Measurement Framework */}
      <section
        id="measurement"
        data-section
        className={`py-20 px-4 transition-all duration-1000 ${
          visibleSections.has('measurement') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">Measurement Framework</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-balance">
              Key performance indicators and success metrics
            </p>
          </div>

          <KPITable />

          <Card className="bg-gradient-to-br from-accent/10 to-accent/5">
            <CardHeader>
              <CardTitle className="text-2xl">Post-Phase 2: Continuous Improvement</CardTitle>
              <CardDescription>Transition to Phase 3 Growth Subscription (₹5,000/month)</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <span>Monthly AI image refreshes for new collections</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <span>Seasonal banner updates and promotional copy optimization</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <span>A/B testing of product descriptions and pricing psychology tactics</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <span>WhatsApp marketing campaigns for cart recovery and promotions</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <span>Performance monitoring and speed maintenance</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Conclusion */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-balance">
            Positioning for India's ₹98.45B E-Commerce Future
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed text-balance">
            This comprehensive roadmap positions Dude Men's Wear to capitalize on India's fashion e-commerce opportunity by 2032, starting with immediate fixes that unlock conversion potential and building toward sustained competitive advantage in Tamil Nadu's value-conscious, mobile-first market.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t bg-muted/30">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">Generated by Superagent.</p>
        </div>
      </footer>
    </div>
  )
}
