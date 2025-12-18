"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Store, MapPin, Truck, CreditCard, UserCog, User, ArrowLeft, Settings, Receipt } from "lucide-react"

const settingsNavItems = [
  {
    title: "Profile",
    href: "/admin/settings/profile",
    icon: User,
  },
  {
    title: "Store Settings",
    href: "/admin/settings/store",
    icon: Store,
  },
  {
    title: "Store Locations",
    href: "/admin/settings/locations",
    icon: MapPin,
  },
  {
    title: "Shipping Settings",
    href: "/admin/settings/shipping",
    icon: Truck,
  },
  {
    title: "Payment Settings",
    href: "/admin/settings/payments",
    icon: CreditCard,
  },
  {
    title: "Tax Settings",
    href: "/admin/settings/tax",
    icon: Receipt,
  },
  {
    title: "Admin Users",
    href: "/admin/settings/users",
    icon: UserCog,
  },
  {
    title: "System Settings",
    href: "/admin/settings/system",
    icon: Settings,
  },
]

interface SettingsSidebarProps {
  collapsed?: boolean
}

export function SettingsSidebar({ collapsed = false }: SettingsSidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn(
      "bg-gray-50 flex flex-col h-full min-w-0 transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className={cn(
        "border-b border-gray-200 flex-shrink-0",
        collapsed ? "p-3" : "p-3 lg:p-4 xl:p-6"
      )}>
        <div className={cn(
          "flex items-center gap-2",
          collapsed ? "justify-center" : "justify-between"
        )}>
          <div className={cn(
            "flex items-center min-w-0 flex-1",
            collapsed ? "justify-center" : "space-x-2 lg:space-x-3"
          )}>
            <div className="w-7 h-7 lg:w-8 lg:h-8 xl:w-9 xl:h-9 bg-gradient-to-br from-red-500 to-red-600 rounded-lg lg:rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25 flex-shrink-0">
              <Settings className="w-3.5 h-3.5 lg:w-4 lg:h-4 xl:w-5 xl:h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <h1 className="text-sm lg:text-base xl:text-lg font-bold text-gray-900 truncate">
                  Settings
                </h1>
              </div>
            )}
          </div>
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 lg:h-8 lg:w-8 hover:bg-gray-100 rounded-lg flex-shrink-0"
              asChild
            >
              <Link href="/admin">
                <ArrowLeft className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className={cn(
          "h-full py-3 lg:py-4",
          collapsed ? "px-2" : "px-2 lg:px-3 xl:px-4"
        )}>
          <div className="space-y-1">
            {settingsNavItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                className={cn(
                  "w-full h-8 lg:h-9 xl:h-10 rounded-lg font-medium transition-all duration-200 text-xs lg:text-sm xl:text-base",
                  collapsed ? "justify-center px-2" : "justify-start px-2 lg:px-3",
                  pathname === item.href
                    ? "bg-red-50 text-red-700 border border-red-200/50 shadow-sm hover:bg-red-100"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
                asChild
                title={collapsed ? item.title : undefined}
              >
                <Link href={item.href}>
                  <item.icon className={cn(
                    "h-3.5 w-3.5 lg:h-4 lg:w-4 transition-colors flex-shrink-0",
                    collapsed ? "" : "mr-2 lg:mr-3",
                    pathname === item.href ? "text-red-600" : "text-gray-500"
                  )} />
                  {!collapsed && <span className="truncate">{item.title}</span>}
                </Link>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}