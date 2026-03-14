'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

interface SidebarProps {
  className?: string
}

interface PlatformCount {
  name: string
  count: number
}

interface Stats {
  total: number
  today_count: number
  by_platform: Record<string, number>
}

export default function Sidebar({ className = '' }: SidebarProps) {
  const pathname = usePathname()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/articles?stats=true')
        const data = await response.json()
        
        if (data.success && data.data) {
          setStats(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const platformMap: Record<string, { name: string; key: string }> = {
    xiaohongshu: { name: '小红书', key: 'xiaohongshu' },
    zhihu: { name: '知乎', key: 'zhihu' },
    wechat: { name: '微信', key: 'wechat' },
    x: { name: 'X (Twitter)', key: 'x' },
    reddit: { name: 'Reddit', key: 'reddit' },
  }

  const platformCounts: PlatformCount[] = stats 
    ? Object.entries(stats.by_platform).map(([key, count]) => ({
        name: platformMap[key]?.name || key,
        count,
      }))
    : []

  const menuItems = [
    {
      title: '概览',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      href: '/',
    },
    {
      title: '热点资讯',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      href: '/hotspots',
    },
    {
      title: '文章管理',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      href: '/articles',
    },
    {
      title: '标签管理',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      href: '/tags',
    },
    {
      title: '小红书研究',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      href: '/xhs',
      badge: '📕',
    },
  ]

  return (
    <aside className={`bg-white border-r border-gray-200 ${className}`}>
      <div className="h-full flex flex-col">
        {/* Main Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            主菜单
          </div>
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-gray-400'}>
                  {item.icon}
                </span>
                <span className="ml-3 flex-1">{item.title}</span>
                {item.badge && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-gray-200 text-gray-700 rounded-full filter grayscale">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Platform Filter */}
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            平台筛选
          </div>
          <div className="space-y-2">
            {loading ? (
              <div className="text-xs text-gray-400 py-2">加载中...</div>
            ) : (
              platformCounts.map((platform) => (
                <button
                  key={platform.name}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                >
                  <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                    {platform.name}
                  </span>
                  <span className="text-xs text-gray-500">{platform.count}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Footer Stats */}
        <div className="px-4 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>总文章数</span>
            <span className="font-semibold text-gray-900">{loading ? '...' : stats?.total || 0}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-600 mt-1">
            <span>今日更新</span>
            <span className="font-semibold text-gray-900">
              {loading ? '...' : (stats?.today_count || 0) > 0 ? `+${stats?.today_count}` : '0'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
