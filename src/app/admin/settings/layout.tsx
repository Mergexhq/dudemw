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
    <div className="fixed inset-0 z-[9999] bg-gray-50">
      <div className="flex h-full min-h-0">
        {/* Desktop Settings Sidebar */}
        <div className="hidden lg:block">
          <SettingsSidebar collapsed={sidebarCollapsed} />
        </div>

        {/* Mobile Settings Sidebar Sheet */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-64 bg-gray-50">
            <SettingsSidebar collapsed={false} />
          </SheetContent>
        </Sheet>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 p-2 lg:p-4 gap-2 lg:gap-4">
          <div className="bg-white rounded-lg lg:rounded-xl shadow-sm border border-gray-200/60">
            <SettingsHeader
              sidebarCollapsed={sidebarCollapsed}
              onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
              mobileMenuOpen={mobileMenuOpen}
              onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
            />
          </div>

          <main className="flex-1 overflow-y-auto overflow-x-hidden bg-white rounded-lg lg:rounded-xl shadow-sm border border-gray-200/60">
            <div className="p-4 lg:p-8 w-full max-w-full">
              <div className="max-w-7xl mx-auto w-full min-w-0">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}