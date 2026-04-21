'use client';

import { ReactNode, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

interface MainLayoutProps {
  children: ReactNode
  showSidebar?: boolean
}

export default function MainLayout({ children, showSidebar = true }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  return (
    <div className="min-h-screen bg-gray-50">
      {showSidebar && sidebarOpen && (
        <button
          type="button"
          aria-label="关闭导航菜单"
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {showSidebar && (
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-xl transition-transform duration-300 lg:translate-x-0 lg:shadow-none ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar className="h-full" />
        </div>
      )}

      <div className={`flex min-h-screen flex-col ${showSidebar ? 'lg:pl-64' : ''}`}>
        <Navbar onMenuClick={showSidebar ? () => setSidebarOpen(!sidebarOpen) : undefined} />
        <main className="flex-1 pt-16">
          <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-6 lg:py-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
