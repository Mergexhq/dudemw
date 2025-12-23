"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Store,
  MapPin,
  Truck,
  CreditCard,
  UserCog,
  User,
  ArrowLeft,
  Settings,
  Receipt,
  ChevronDown,
  HelpCircle,
  Bell,
  Package,
  FileText
} from "lucide-react"

// Grouped navigation structure
const settingsGroups = [
  {
    id: "personal",
    label: "Personal",
    items: [
      { title: "Profile", href: "/admin/settings/profile", icon: User },
    ],
  },
  {
    id: "store",
    label: "Store",
    items: [
      { title: "General", href: "/admin/settings/store", icon: Store },
      { title: "Locations", href: "/admin/settings/locations", icon: MapPin },
      { title: "CMS Pages", href: "/admin/settings/cms", icon: FileText },
    ],
  },
  {
    id: "commerce",
    label: "Commerce",
    items: [
      { title: "Shipping", href: "/admin/settings/shipping", icon: Truck },
      { title: "Payments", href: "/admin/settings/payments", icon: CreditCard },
      { title: "Taxes", href: "/admin/settings/tax", icon: Receipt },
    ],
  },
  {
    id: "access",
    label: "Access",
    items: [
      { title: "Admin Users", href: "/admin/settings/users", icon: UserCog },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      { title: "Preferences", href: "/admin/settings/system", icon: Settings },
    ],
  },
  {
    id: "help",
    label: "Help",
    items: [
      { title: "Help Center", href: "/admin/settings/help-center", icon: HelpCircle },
    ],
  },
]

interface SettingsSidebarProps {
  collapsed?: boolean
}

export function SettingsSidebar({ collapsed = false }: SettingsSidebarProps) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<string[]>(
    settingsGroups.map(g => g.id) // All expanded by default
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  const isGroupActive = (group: typeof settingsGroups[0]) => {
    if (!mounted) return false
    return group.items.some(item => pathname === item.href)
  }

  // Show loading skeleton during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={cn(
        "bg-gray-50 flex flex-col h-full min-w-0 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}>
        <div className={cn(
          "border-b border-gray-200 flex-shrink-0",
          collapsed ? "p-3" : "p-3 lg:p-4"
        )}>
          <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
        </div>
        <div className="flex-1 p-3 space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-9 bg-gray-200 animate-pulse rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "bg-gray-50 flex flex-col h-full min-w-0 transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className={cn(
        "border-b border-gray-200 flex-shrink-0",
        collapsed ? "p-3" : "p-3 lg:p-4"
      )}>
        <div className={cn(
          "flex items-center gap-2",
          collapsed ? "justify-center" : "justify-between"
        )}>
          <div className={cn(
            "flex items-center min-w-0 flex-1",
            collapsed ? "justify-center" : "space-x-2 lg:space-x-3"
          )}>
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/25 flex-shrink-0">
              <Settings className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-bold text-gray-900 truncate">
                  Settings
                </h1>
              </div>
            )}
          </div>
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-gray-100 rounded-lg flex-shrink-0"
              asChild
            >
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className={cn(
          "h-full py-3",
          collapsed ? "px-2" : "px-2 lg:px-3"
        )}>
          <div className="space-y-1">
            {settingsGroups.map((group) => {
              const isExpanded = expandedGroups.includes(group.id)
              const isActive = isGroupActive(group)

              return (
                <div key={group.id} className="space-y-0.5">
                  {/* Group Header - only show when not collapsed */}
                  {!collapsed && (
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors",
                        isActive ? "text-red-700" : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      <span>{group.label}</span>
                      <ChevronDown className={cn(
                        "h-3 w-3 transition-transform",
                        isExpanded ? "" : "-rotate-90"
                      )} />
                    </button>
                  )}

                  {/* Group Items */}
                  {(collapsed || isExpanded) && (
                    <div className={cn("space-y-0.5", !collapsed && "pl-1")}>
                      {group.items.map((item) => (
                        <Button
                          key={item.href}
                          variant="ghost"
                          className={cn(
                            "w-full h-9 rounded-lg font-medium transition-all duration-200 text-sm",
                            collapsed ? "justify-center px-2" : "justify-start px-3",
                            pathname === item.href
                              ? "bg-red-50 text-red-700 border border-red-200/50 shadow-sm hover:bg-red-100"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          )}
                          asChild
                          title={collapsed ? item.title : undefined}
                        >
                          <Link href={item.href}>
                            <item.icon className={cn(
                              "h-4 w-4 transition-colors flex-shrink-0",
                              collapsed ? "" : "mr-2.5",
                              pathname === item.href ? "text-red-600" : "text-gray-400"
                            )} />
                            {!collapsed && <span className="truncate">{item.title}</span>}
                          </Link>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}