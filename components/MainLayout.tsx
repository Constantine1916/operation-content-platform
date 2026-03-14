'use client';

import { ReactNode, useState } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

interface MainLayoutProps { children: ReactNode }

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      {sidebarOpen && <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <div className={`fixed lg:relative inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 lg:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto pt-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 lg:py-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
