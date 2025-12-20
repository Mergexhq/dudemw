"use client"

import { useState } from "react"
import { SettingsSidebar } from "@/domains/admin/settings/settings-sidebar"
import { SettingsHeader } from "@/domains/admin/settings/settings-header"
import { Sheet, SheetContent } from "@/components/ui/sheet"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // This layout completely replaces the admin layout for settings pages
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-red-50/30">
      <div className="flex w-full">
        {/* Desktop Settings Sidebar */}
        <div className="hidden lg:block sticky top-0 h-screen overflow-y-auto border-r border-gray-200">
          <SettingsSidebar collapsed={sidebarCollapsed} />
        </div>

        {/* Mobile Settings Sidebar Sheet */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-64 bg-gray-50" aria-describedby="settings-mobile-menu-description">
            <span id="settings-mobile-menu-description" className="sr-only">
              Settings navigation menu
            </span>
            <SettingsSidebar collapsed={false} />
          </SheetContent>
        </Sheet>

        {/* Main Content Area - Single Card Structure */}
        <div className="flex-1 flex flex-col overflow-hidden p-1 lg:p-2">
          <div className="flex-1 flex flex-col bg-white rounded-xl lg:rounded-2xl shadow-lg border border-red-100/50 backdrop-blur-sm overflow-hidden">
            <SettingsHeader
              sidebarCollapsed={sidebarCollapsed}
              onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
              mobileMenuOpen={mobileMenuOpen}
              onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
            />
            <main className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="p-4 lg:p-6 w-full max-w-full">
                <div className="max-w-7xl mx-auto w-full min-w-0">
                  {children}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}