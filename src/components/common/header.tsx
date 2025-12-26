"use client"


import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, Search, Command, Menu } from "lucide-react"
import { GlobalSearch } from "./global-search"

interface HeaderProps {
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
  mobileMenuOpen: boolean
  onToggleMobileMenu: () => void
}

export function Header({ sidebarCollapsed, onToggleSidebar, mobileMenuOpen, onToggleMobileMenu }: HeaderProps) {

  return (
    <header className="px-3 md:px-6 py-3 md:py-4 border-b border-gray-100" suppressHydrationWarning>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 min-h-[44px] min-w-[44px] rounded-lg hover:bg-gray-100 lg:hidden flex-shrink-0"
            onClick={onToggleMobileMenu}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Desktop Sidebar Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex h-10 w-10 rounded-lg hover:bg-gray-100 flex-shrink-0"
            onClick={onToggleSidebar}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="relative w-full max-w-80 justify-start text-sm text-gray-500 h-10 px-3 md:px-4 py-2 bg-gray-50/50 border-gray-200/60 hover:bg-gray-100 min-h-[44px]"
            onClick={() => {
              // Trigger the global search by dispatching a keyboard event
              const event = new KeyboardEvent('keydown', {
                key: 'j',
                ctrlKey: true,
                bubbles: true
              })
              document.dispatchEvent(event)
            }}
          >
            <Search className="mr-2 md:mr-3 h-4 w-4 flex-shrink-0" />
            <span className="truncate hidden sm:inline">Search orders, products...</span>
            <span className="truncate sm:hidden">Search...</span>
            <div className="ml-auto hidden md:flex items-center space-x-1">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-gray-100 px-1.5 font-mono text-[10px] font-medium text-gray-600">
                <Command className="h-3 w-3" />
                J
              </kbd>
            </div>
          </Button>
        </div>

        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <Button variant="ghost" size="icon" className="relative h-10 w-10 min-h-[44px] min-w-[44px] rounded-lg hover:bg-gray-100">
            <Bell className="h-4 w-4 md:h-5 md:w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></span>
          </Button>

          {/* Avatar - clickable to go to profile */}
          <Button variant="ghost" className="relative h-10 w-10 min-h-[44px] min-w-[44px] rounded-lg hover:bg-gray-100" asChild>
            <Link href="/admin/settings/profile">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/avatars/admin.png" alt="Admin" />
                <AvatarFallback className="bg-red-100 text-red-700 font-semibold">AD</AvatarFallback>
              </Avatar>
            </Link>
          </Button>
        </div>
      </div>

      <GlobalSearch />
    </header>
  )
}
