"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, Search, User, LogOut, Settings, Command, Menu } from "lucide-react"
import { GlobalSearch } from "./global-search"

interface HeaderProps {
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
  mobileMenuOpen: boolean
  onToggleMobileMenu: () => void
}

export function Header({ sidebarCollapsed, onToggleSidebar, mobileMenuOpen, onToggleMobileMenu }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const [mounted, setMounted] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
    <header className="px-6 py-4" suppressHydrationWarning>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-lg hover:bg-gray-100 lg:hidden"
            onClick={onToggleMobileMenu}
          >
            <Menu className="h-4 w-4" />
          </Button>
          
          {/* Desktop Sidebar Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex h-10 w-10 rounded-lg hover:bg-gray-100"
            onClick={onToggleSidebar}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="relative w-full max-w-80 justify-start text-sm text-gray-500 h-10 px-4 py-2 bg-gray-50/50 border-gray-200/60 hover:bg-gray-100"
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
            <Search className="mr-3 h-4 w-4 flex-shrink-0" />
            <span className="truncate">Search orders, products...</span>
            <div className="ml-auto hidden sm:flex items-center space-x-1">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-gray-100 px-1.5 font-mono text-[10px] font-medium text-gray-600">
                <Command className="h-3 w-3" />
                J
              </kbd>
            </div>
          </Button>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-lg hover:bg-gray-100">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></span>
          </Button>
          
          {mounted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-lg hover:bg-gray-100">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatars/admin.png" alt="Admin" />
                    <AvatarFallback className="bg-red-100 text-red-700 font-semibold">AD</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 p-2 bg-white border border-gray-200 shadow-lg" align="end" forceMount>
                <DropdownMenuLabel className="font-normal p-3">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none text-gray-900">Admin User</p>
                    <p className="text-xs leading-none text-gray-600">
                      admin@dudemenswears.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-200" />
                <DropdownMenuItem className="p-3 rounded-lg text-gray-700 hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">
                  <User className="mr-3 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="p-3 rounded-lg text-gray-700 hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">
                  <Settings className="mr-3 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-200" />
                <DropdownMenuItem className="p-3 rounded-lg text-red-600 hover:bg-red-50 focus:bg-red-50 cursor-pointer">
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" className="relative h-10 w-10 rounded-lg hover:bg-gray-100">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-red-100 text-red-700 font-semibold">AD</AvatarFallback>
              </Avatar>
            </Button>
          )}
        </div>
      </div>
      
      <GlobalSearch />
    </header>
  )
}
