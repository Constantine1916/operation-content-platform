'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { readVipCache, refreshVipCache } from '@/lib/vip-cache'

interface SidebarProps { className?: string }
interface TodayStats {
  hotspots: number
  articles: number
  images: number
  videos: number
}

export default function Sidebar({ className = '' }: SidebarProps) {
  const pathname = usePathname()
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSVIP, setIsSVIP] = useState(false)

  useEffect(() => {
    // 用北京时间（UTC+8）计算今日日期，避免 UTC 与本地日期不一致
    const bjNow = new Date(Date.now() + 8 * 60 * 60 * 1000);
    const today = bjNow.toISOString().slice(0, 10);

    async function fetchStats() {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const [hotspotsData, articlesData, videoData, galleryData] = await Promise.all([
        fetch(`/api/hotspots?date=${today}&limit=1`).then(r => r.json()),
        fetch(`/api/articles?stats=true`).then(r => r.json()),
        fetch(`/api/ai-video?date=${today}&limit=1`).then(r => r.json()),
        token
          ? fetch(`/api/gallery?date=${today}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
          : Promise.resolve({ total: 0 }),
      ])

      setTodayStats({
        hotspots: hotspotsData.pagination?.total ?? 0,
        articles: articlesData.data?.today_count ?? 0,
        images: galleryData.total ?? 0,
        videos: videoData.pagination?.total ?? 0,
      })
      setLoading(false)
    }

    fetchStats().catch(console.error)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const userId = session.user.id;
      const token = session.access_token;

      // 先读缓存，立即渲染（无闪烁）
      const cached = readVipCache(userId);
      if (cached !== null) setIsSVIP(cached >= 2);

      // 异步刷新，写回缓存
      const fresh = await refreshVipCache(userId, token);
      if (fresh !== null) setIsSVIP(fresh >= 2);
    });
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
      title: 'AI 资讯',
      href: '/hotspots',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      title: 'AI 文章',
      href: '/articles',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },

    {
      title: 'MD转图片',
      href: '/md2image',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: 'AI 视频',
      href: '/ai-video',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: 'AI 图片',
      href: '/ai-gallery',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ]

  const svipMenuItems = [
    {
      title: 'AI 生图',
      href: '/generate-img',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
  ]

  return (
    <aside className={`bg-white border-r border-gray-200 h-full flex flex-col ${className}`}>
      <div className="flex-1 flex flex-col min-h-0">
        <nav className="flex-1 px-3 py-6 space-y-0.5">
          {/* 主菜单 label */}
          <div className="text-xs font-semibold text-gray-900 uppercase tracking-widest mb-3 px-3">
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
                    : 'text-gray-900 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-900'}`}>
                  {item.icon}
                </span>
                <span className="text-sm font-medium">{item.title}</span>
              </Link>
            );
          })}

          {/* SVIP 专属菜单 */}
          {isSVIP && (
            <>
              <div className="text-xs font-semibold text-gray-900 uppercase tracking-widest mt-5 mb-3 px-3 flex items-center gap-2">
                SVIP
                <span className="text-[9px] bg-gray-900 text-white px-1.5 py-0.5 rounded-full tracking-normal normal-case font-medium">专属</span>
              </div>
              {svipMenuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      isActive
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-900 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-900'}`}>
                      {item.icon}
                    </span>
                    <span className="text-sm font-medium">{item.title}</span>
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* 底部统计 */}
        <div className="px-4 py-4 border-t border-gray-200 space-y-2">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">今日更新</div>
          {[
            { label: '资讯', value: todayStats?.hotspots },
            { label: '文章', value: todayStats?.articles },
            { label: '图片', value: todayStats?.images },
            { label: '视频', value: todayStats?.videos },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{label}</span>
              <span className="text-xs font-semibold text-gray-900">
                {loading ? '—' : value != null && value > 0 ? `+${value}` : '0'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
