"use client"

import { Button } from "@/components/ui/button"
import { Bell, Save, Menu } from "lucide-react"

interface SettingsHeaderProps {
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
  mobileMenuOpen: boolean
  onToggleMobileMenu: () => void
}

export function SettingsHeader({
  sidebarCollapsed,
  onToggleSidebar,
  mobileMenuOpen,
  onToggleMobileMenu
}: SettingsHeaderProps) {
  return (
    <header className="px-4 lg:px-6 py-3 lg:py-4 flex-shrink-0">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-3 lg:space-x-4 min-w-0 flex-1">
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg hover:bg-gray-100 lg:hidden"
            onClick={onToggleMobileMenu}
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* Desktop Sidebar Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex h-8 w-8 lg:h-10 lg:w-10 rounded-lg hover:bg-gray-100"
            onClick={onToggleSidebar}
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="min-w-0 flex-1">
            <h2 className="text-base lg:text-lg xl:text-xl font-bold text-gray-900 truncate">
              Store Configuration
            </h2>
            <p className="text-xs lg:text-sm text-gray-600 mt-1 truncate hidden sm:block">
              Manage your store settings and preferences
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 lg:space-x-3 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 hidden md:flex"
          >
            <Save className="mr-2 h-3.5 w-3.5 lg:h-4 lg:w-4" />
            <span className="hidden lg:inline">Save All Changes</span>
            <span className="lg:hidden">Save</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="relative h-8 w-8 lg:h-10 lg:w-10 rounded-lg hover:bg-gray-100"
          >
            <Bell className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 lg:h-3 lg:w-3 bg-red-500 rounded-full border-2 border-white"></span>
          </Button>
        </div>
      </div>
    </header>
  )
}