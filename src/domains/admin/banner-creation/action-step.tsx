"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ExternalLink, Package, Layers, Tag } from "lucide-react"

type ActionType = "collection" | "category" | "product" | "external"

interface ActionStepProps {
  actionType?: ActionType
  actionTarget: string
  actionName?: string
  onActionTypeChange: (type: ActionType) => void
  onActionTargetChange: (target: string) => void
  onActionNameChange?: (name: string) => void
}

const actionOptions = [
  { id: "collection" as ActionType, title: "Link to Collection", icon: Layers },
  { id: "category" as ActionType, title: "Link to Category", icon: Tag },
  { id: "product" as ActionType, title: "Link to Product", icon: Package },
  { id: "external" as ActionType, title: "External URL", icon: ExternalLink }
]

export function ActionStep({ actionType, actionTarget, actionName, onActionTypeChange, onActionTargetChange, onActionNameChange }: ActionStepProps) {
  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">Where does the banner go?</CardTitle>
          <CardDescription className="text-gray-600">
            Define what happens when users click the banner
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 w-full">
            {actionOptions.map((option) => {
              const Icon = option.icon
              return (
                <div
                  key={option.id}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    actionType === option.id
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => {
                    onActionTypeChange(option.id)
                    onActionTargetChange("")
                  }}
                >
                  <div className="text-center">
                    <div className={`inline-flex p-3 rounded-lg mb-3 ${
                      actionType === option.id
                        ? "bg-red-100"
                        : "bg-gray-100"
                    }`}>
                      <Icon className={`h-6 w-6 ${
                        actionType === option.id
                          ? "text-red-600"
                          : "text-gray-600"
                      }`} />
                    </div>
                    <h3 className="font-medium text-gray-900 text-sm">{option.title}</h3>
                  </div>
                </div>
              )
            })}
          </div>

          {actionType && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              {actionType === "collection" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="collectionTarget">Select Collection *</Label>
                    <Select value={actionTarget} onValueChange={(value) => {
                      onActionTargetChange(value)
                      if (onActionNameChange) {
                        // Get the display name from the value
                        const names: Record<string, string> = {
                          "winter-collection": "Winter Collection",
                          "new-arrivals": "New Arrivals",
                          "best-sellers": "Best Sellers",
                          "holiday-collection": "Holiday Collection"
                        }
                        onActionNameChange(names[value] || value)
                      }
                    }}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a collection" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="winter-collection">Winter Collection</SelectItem>
                        <SelectItem value="new-arrivals">New Arrivals</SelectItem>
                        <SelectItem value="best-sellers">Best Sellers</SelectItem>
                        <SelectItem value="holiday-collection">Holiday Collection</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {actionType === "category" && (
                <div className="space-y-2">
                  <Label htmlFor="categoryTarget">Select Category *</Label>
                  <Select value={actionTarget} onValueChange={onActionTargetChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shirts">Shirts</SelectItem>
                      <SelectItem value="hoodies">Hoodies</SelectItem>
                      <SelectItem value="pants">Pants</SelectItem>
                      <SelectItem value="jackets">Jackets</SelectItem>
                      <SelectItem value="accessories">Accessories</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {actionType === "product" && (
                <div className="space-y-2">
                  <Label htmlFor="productTarget">Search Product *</Label>
                  <Input
                    id="productTarget"
                    placeholder="Type to search products..."
                    value={actionTarget}
                    onChange={(e) => onActionTargetChange(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Start typing to search for products
                  </p>
                </div>
              )}

              {actionType === "external" && (
                <div className="space-y-2">
                  <Label htmlFor="urlTarget">External URL *</Label>
                  <Input
                    id="urlTarget"
                    placeholder="https://example.com"
                    value={actionTarget}
                    onChange={(e) => onActionTargetChange(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Enter the full URL including https://
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}