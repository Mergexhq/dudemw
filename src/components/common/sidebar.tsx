"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderTree,
  Layers,
  Image,
  Percent,
  Warehouse,
  Users,
  Settings,
  Store,
  LogOut
} from "lucide-react"

const mainNavItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    title: "Products",
    href: "/admin/products",
    icon: Package,
  },
  {
    title: "Categories",
    href: "/admin/categories",
    icon: FolderTree,
  },
  {
    title: "Collections",
    href: "/admin/collections",
    icon: Layers,
  },
  {
    title: "Banners",
    href: "/admin/banners",
    icon: Image,
  },
  {
    title: "Coupons",
    href: "/admin/coupons",
    icon: Percent,
  },
  {
    title: "Inventory",
    href: "/admin/inventory",
    icon: Warehouse,
  },
  {
    title: "Customers",
    href: "/admin/customers",
    icon: Users,
  },
]

const bottomNavItems = [
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
]



interface SidebarProps {
  collapsed?: boolean
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await supabase.auth.signOut()
      router.push('/admin/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoggingOut(false)
    }
  }

  return (
    <div className={cn(
      "bg-gray-50 flex flex-col h-full min-w-0 transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className={cn(
        "border-b border-gray-200 flex-shrink-0",
        collapsed ? "p-3" : "p-3 lg:p-4 xl:p-6"
      )}>
        <Link href="/admin" className={cn(
          "flex items-center",
          collapsed ? "justify-center" : "space-x-2 lg:space-x-3"
        )}>
          <div className="w-7 h-7 lg:w-8 lg:h-8 xl:w-9 xl:h-9 bg-gradient-to-br from-red-500 to-red-600 rounded-lg lg:rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25 flex-shrink-0">
            <Store className="w-3.5 h-3.5 lg:w-4 lg:h-4 xl:w-5 xl:h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <span className="text-sm lg:text-base xl:text-lg font-bold text-gray-900 block truncate">Dude Admin</span>
              <p className="text-xs text-gray-500 truncate hidden sm:block">Men's Fashion</p>
            </div>
          )}
        </Link>
      </div>
      
      <div className="flex-1 flex flex-col min-h-0">
        <div className={cn(
          "flex-1 overflow-hidden py-3 lg:py-4",
          collapsed ? "px-2" : "px-2 lg:px-3 xl:px-4"
        )}>
          <ScrollArea className="h-full">
            <div className={cn(
              "space-y-1",
              collapsed ? "" : "pr-1 lg:pr-2"
            )}>
              {mainNavItems.map((item) => (
                <Button
                  key={item.href}
                  variant="ghost"
                  className={cn(
                    "w-full h-8 lg:h-9 xl:h-10 rounded-lg font-medium transition-all duration-200 text-xs lg:text-sm xl:text-base",
                    collapsed ? "justify-center px-2" : "justify-start px-2 lg:px-3",
                    (pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href)))
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
                      (pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href)))
                        ? "text-red-600" 
                        : "text-gray-500"
                    )} />
                    {!collapsed && <span className="truncate">{item.title}</span>}
                  </Link>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
        
        <div className={cn(
          "flex-shrink-0 border-t border-gray-200 py-2 lg:py-3 xl:py-4 bg-gray-100/30 mt-auto",
          collapsed ? "px-2" : "px-2 lg:px-3 xl:px-4"
        )}>
          <div className="space-y-1">
            {bottomNavItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                className={cn(
                  "w-full h-8 lg:h-9 xl:h-10 rounded-lg font-medium transition-all duration-200 text-xs lg:text-sm xl:text-base",
                  collapsed ? "justify-center px-2" : "justify-start px-2 lg:px-3",
                  pathname.startsWith(item.href)
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
                    pathname.startsWith(item.href)
                      ? "text-red-600" 
                      : "text-gray-500"
                  )} />
                  {!collapsed && <span className="truncate">{item.title}</span>}
                </Link>
              </Button>
            ))}
            
            {/* Logout Button */}
            <Button
              variant="ghost"
              className={cn(
                "w-full h-8 lg:h-9 xl:h-10 rounded-lg font-medium transition-all duration-200 text-xs lg:text-sm xl:text-base text-red-600 hover:bg-red-50 hover:text-red-700",
                collapsed ? "justify-center px-2" : "justify-start px-2 lg:px-3"
              )}
              onClick={handleLogout}
              disabled={isLoggingOut}
              title={collapsed ? "Log out" : undefined}
              data-testid="admin-sidebar-logout-button"
            >
              <LogOut className={cn(
                "h-3.5 w-3.5 lg:h-4 lg:w-4 transition-colors flex-shrink-0",
                collapsed ? "" : "mr-2 lg:mr-3"
              )} />
              {!collapsed && <span className="truncate">{isLoggingOut ? 'Logging out...' : 'Log out'}</span>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
