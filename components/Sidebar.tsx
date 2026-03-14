'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

interface SidebarProps { className?: string }
interface Stats { total: number; today_count: number; by_platform: Record<string, number> }

export default function Sidebar({ className = '' }: SidebarProps) {
  const pathname = usePathname()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/articles?stats=true').then(r => r.json()).then(data => { if (data.success && data.data) setStats(data.data); }).catch(console.error).finally(() => setLoading(false));
  }, [])

  const menuItems = [
    { title: '概览', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>, href: '/overview' },
    { title: '热点资讯', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>, href: '/hotspots' },
    { title: '文章管理', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, href: '/articles' },
    { title: '标签管理', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>, href: '/tags' },
    { title: '小红书研究', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>, href: '/xhs' },
  ]

  return (
    <aside className={`bg-white border-r border-gray-100 ${className}`}>
      <div className="h-full flex flex-col">
        <nav className="flex-1 px-3 py-6 space-y-1">
          <div className="text-[10px] font-semibold gray-500 uppercase tracking-[0.2em] mb-4 px-3">主菜单</div>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all ${isActive ? 'bg-gray-900 text-white' : 'gray-700 hover:black hover:bg-gray-50'}`}>
                <span className={isActive ? 'text-white' : 'gray-600'}>{item.icon}</span>
                <span className="tracking-wide">{item.title}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-gray-50">
          <div className="flex items-center justify-between text-[10px] gray-600">
            <span>总文章数</span><span className="font-medium gray-800">{loading ? '...' : stats?.total || 0}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] gray-600 mt-2">
            <span>今日更新</span><span className="font-medium gray-800">{loading ? '...' : (stats?.today_count || 0) > 0 ? `+${stats?.today_count}` : '0'}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
