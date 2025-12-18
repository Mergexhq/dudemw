import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp } from "lucide-react"

const campaigns = [
  {
    name: "Winter Sale",
    status: "active",
    progress: 75,
    revenue: "₹12,450",
    orders: 45,
  },
  {
    name: "New Arrivals", 
    status: "active",
    progress: 60,
    revenue: "₹8,200",
    orders: 28,
  },
  {
    name: "Best Sellers",
    status: "scheduled",
    progress: 0,
    revenue: "₹0",
    orders: 0,
  },
]

export function CampaignPerformance() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-4 w-4" />
          <span>Active Campaigns</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {campaigns.map((campaign, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{campaign.name}</span>
                <Badge 
                  variant={campaign.status === "active" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {campaign.status}
                </Badge>
              </div>
              <span className="text-sm text-muted-foreground">
                {campaign.orders} orders
              </span>
            </div>
            <Progress value={campaign.progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{campaign.progress}% complete</span>
              <span>{campaign.revenue}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}