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
    fetch('/api/articles?stats=true').then(r => r.json())
      .then(data => { if (data.success && data.data) setStats(data.data); })
      .catch(console.error).finally(() => setLoading(false));
  }, [])

  const menuItems = [
    {
      title: '概览',
      href: '/overview',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      title: '热点资讯',
      href: '/hotspots',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      title: '文章管理',
      href: '/articles',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      title: '标签管理',
      href: '/tags',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
    },
    {
      title: '小红书研究',
      href: '/xhs',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ]

  return (
    <aside className={`bg-white border-r border-gray-100 ${className}`}>
      <div className="h-full flex flex-col">
        <nav className="flex-1 px-3 py-6 space-y-0.5">
          {/* 主菜单 label */}
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-3">
            主菜单
          </div>

          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {/* icon 和文字尺寸协调：icon w-5, 文字 text-sm */}
                <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`}>
                  {item.icon}
                </span>
                <span className="text-sm font-medium">{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* 底部统计 */}
        <div className="px-4 py-4 border-t border-gray-50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">总文章数</span>
            <span className="text-xs font-semibold text-gray-700">{loading ? '—' : stats?.total || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">今日更新</span>
            <span className="text-xs font-semibold text-gray-700">
              {loading ? '—' : (stats?.today_count || 0) > 0 ? `+${stats?.today_count}` : '0'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
