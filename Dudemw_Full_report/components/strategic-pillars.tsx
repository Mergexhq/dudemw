'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Smartphone, Zap, ImageIcon, MessageCircle, DollarSign, CheckCircle2 } from 'lucide-react'

const pillars = [
  {
    id: 'trust',
    title: 'Trust & Credibility Architecture',
    icon: Shield,
    color: '#4854d6',
    budget: '₹8,500',
    impact: 'High',
    effort: 'Medium',
    description: 'Trust is the cornerstone of Indian e-commerce conversion. Research shows trust-building factors are critical for customer decisions in India.',
    tactics: [
      'Verified Review System: Implement prominent customer testimonials with "Verified Buyer" badges',
      'Security Badge Display: Add secure payment icons at checkout and product pages',
      'Policy Transparency: Create clear, accessible shipping/returns/refund pages',
      'Social Proof Signals: Display "X customers bought this today" notifications',
      'Quality Guarantees: Showcase "100% Authentic" and "Quality Assured" badges',
    ],
    stat: '72% of Indian shoppers prioritize trust signals',
  },
  {
    id: 'mobile',
    title: 'Mobile Experience Optimization',
    icon: Smartphone,
    color: '#5b8fc9',
    budget: '₹4,999',
    impact: 'High',
    effort: 'Low',
    description: 'With 60%+ of Tamil Nadu consumers preferring mobile shopping, eliminating mobile friction is essential for conversion.',
    tactics: [
      'Breadcrumb Navigation: Easy category return on product pages',
      'Simplified Checkout: Replace combobox with standard dropdown for state selection',
      'CTA Optimization: Ensure "Shop Now" buttons link directly to products',
      'Touch-Friendly UI: Larger tap targets and simplified mobile navigation',
      'Fast Loading: Optimize images and reduce mobile page load time',
    ],
    stat: '60%+ prefer mobile apps over websites',
  },
  {
    id: 'copywriting',
    title: 'Conversion Psychology & Copywriting',
    icon: Zap,
    color: '#5eb3b3',
    budget: '₹9,999',
    impact: 'High',
    effort: 'Medium',
    description: 'Transform spec-heavy copy into benefit-driven language that resonates with price-conscious, aspiration-driven Tamil Nadu consumers.',
    tactics: [
      'Benefit-First Descriptions: "Breathable cotton stays fresh through Salem\'s heat" vs "100% cotton"',
      'Modern Man Brand Story: Homepage narrative validating smart shopping decisions',
      'Urgency Hooks: Transparent "X left in stock" and "Y people viewing" notifications',
      'Value Communication: Emphasize quality-to-price ratio without cheapening brand',
      'Free Shipping Threshold: Clear messaging (+34% revenue impact)',
    ],
    stat: '54% prioritize deals and value messaging',
  },
  {
    id: 'visual',
    title: 'Visual Merchandising',
    icon: ImageIcon,
    color: '#8b7fc9',
    budget: '₹4,999',
    impact: 'Medium',
    effort: 'Low',
    description: 'Professional, consistent lifestyle imagery builds aspiration and trust while maintaining brand consistency across 15-20 key SKUs.',
    tactics: [
      'AI Lifestyle Images: Generate 15-20 premium, consistent product photos',
      'Contextual Styling: Show products in relevant Tamil Nadu lifestyle contexts',
      'Consistent Aesthetic: Maintain cohesive visual identity across catalog',
      'Hero Banner Refresh: Update homepage with modern, aspirational imagery',
      'Product Grid Enhancement: Improve category page visual hierarchy',
    ],
    stat: 'Premium imagery increases perceived value',
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp Commerce Integration',
    icon: MessageCircle,
    color: '#59b88f',
    budget: 'Included',
    impact: 'Medium',
    effort: 'Low',
    description: 'Leverage India\'s 487 million WhatsApp users for conversational commerce, real-time support, and abandoned cart recovery.',
    tactics: [
      'Universal Widget Deployment: Consistent presence on product and checkout pages',
      'Cart Recovery Campaigns: Automated WhatsApp reminders for abandoned carts',
      'Real-Time Support: Instant customer service via preferred channel',
      'Order Updates: Post-purchase notifications and shipping updates',
      'Promotional Campaigns: Targeted deals and new arrival announcements',
    ],
    stat: '487M WhatsApp users in India',
  },
  {
    id: 'pricing',
    title: 'Pricing Psychology & Promotions',
    icon: DollarSign,
    color: '#d4a373',
    budget: 'Strategy',
    impact: 'Medium',
    effort: 'Low',
    description: 'Strategic pricing communication that validates value-conscious shopping while maintaining brand positioning.',
    tactics: [
      'Savings Visibility: Show "You save ₹X" prominently on discounted items',
      'Bundle Offers: "Buy 2, Get 10% Off" to increase average order value',
      'Free Shipping Threshold: Clear communication drives basket size',
      'Comparison Anchoring: Show MRP vs. sale price effectively',
      'Limited-Time Offers: Transparent urgency without dark patterns',
    ],
    stat: 'Value messaging drives tier-2/3 city conversions',
  },
]

export function StrategicPillars() {
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pillars.map((pillar) => {
          const Icon = pillar.icon
          const isExpanded = expandedPillar === pillar.id

          return (
            <Card
              key={pillar.id}
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                isExpanded ? 'ring-2 ring-offset-2' : ''
              }`}
              style={isExpanded ? { borderColor: pillar.color, ringColor: pillar.color } : {}}
              onClick={() => setExpandedPillar(isExpanded ? null : pillar.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="p-3 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: `${pillar.color}15` }}
                  >
                    <Icon className="h-6 w-6" style={{ color: pillar.color }} />
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Badge variant="secondary">{pillar.budget}</Badge>
                    <div className="flex gap-1">
                      <Badge
                        variant="outline"
                        className="text-xs bg-primary/10 text-primary border-primary/20"
                      >
                        {pillar.impact} Impact
                      </Badge>
                    </div>
                  </div>
                </div>
                <CardTitle className="text-lg mt-4">{pillar.title}</CardTitle>
                <CardDescription className="text-xs">{pillar.stat}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">{pillar.description}</p>

                {isExpanded && (
                  <div className="space-y-3 pt-4 border-t animate-in fade-in slide-in-from-top-2 duration-300">
                    <h4 className="font-semibold text-sm">Core Tactics:</h4>
                    <ul className="space-y-2">
                      {pillar.tactics.map((tactic, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle2
                            className="h-4 w-4 flex-shrink-0 mt-0.5"
                            style={{ color: pillar.color }}
                          />
                          <span className="text-muted-foreground">{tactic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="text-xs text-center text-muted-foreground pt-2">
                  {isExpanded ? 'Click to collapse' : 'Click to expand tactics'}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle>Strategic Framework Integration</CardTitle>
          <CardDescription>How the six pillars work together</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            These six pillars are designed to work synergistically, addressing the complete customer journey from discovery to conversion. <strong>Trust & Credibility</strong> removes psychological barriers, <strong>Mobile UX</strong> eliminates friction, <strong>Conversion Psychology</strong> motivates action, <strong>Visual Merchandising</strong> builds aspiration, <strong>WhatsApp Integration</strong> provides support, and <strong>Pricing Strategy</strong> validates the purchase decision.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 pt-4">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-primary">₹27,497</div>
              <div className="text-sm text-muted-foreground">Implementation Budget</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-secondary">6 Pillars</div>
              <div className="text-sm text-muted-foreground">Strategic Focus Areas</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-accent">High Impact</div>
              <div className="text-sm text-muted-foreground">ROI Potential</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
