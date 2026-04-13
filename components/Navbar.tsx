'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const PROFILE_KEY = 'xhs_profile'

interface NavbarProps { onMenuClick?: () => void }

interface Profile {
  username: string | null
  avatar_url: string | null
  email: string | null
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    try { localStorage.removeItem(PROFILE_KEY) } catch {}
    router.push('/login')
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    // 1. Instant: restore from localStorage
    try {
      const cached = localStorage.getItem(PROFILE_KEY)
      if (cached) {
        const p = JSON.parse(cached)
        if (p.username || p.avatar_url) {
          setProfile({ username: p.username, avatar_url: p.avatar_url, email: null })
        }
      }
    } catch {}

    // 2. Background: fetch from API to keep localStorage fresh
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const token = session.access_token
      const res = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success && data.data) {
        setProfile(data.data)
        try { localStorage.setItem(PROFILE_KEY, JSON.stringify({ username: data.data.username, avatar_url: data.data.avatar_url })) } catch {}
      }
    }
    loadProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setProfile(null)
        try { localStorage.removeItem(PROFILE_KEY) } catch {}
        return
      }
      supabase.auth.getSession().then(({ data: { session: s } }) => {
        if (!s) return
        fetch('/api/profile', {
          headers: { Authorization: `Bearer ${s.access_token}` },
        }).then(r => r.json()).then(data => {
          if (data.success && data.data) {
            setProfile(data.data)
            try { localStorage.setItem(PROFILE_KEY, JSON.stringify({ username: data.data.username, avatar_url: data.data.avatar_url })) } catch {}
          }
        })
      })
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 fixed top-0 z-50" style={{ left: '16rem', width: 'calc(100vw - 16rem)' }}>
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* 左侧：汉堡菜单 + Logo */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onMenuClick}
            className="flex-shrink-0 p-2 rounded-full text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link href="/overview" className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 border border-gray-200 rounded-xl flex items-center justify-center bg-gray-50 flex-shrink-0">
              <span className="text-lg font-medium text-gray-900">OP</span>
            </div>
            <span className="text-base font-medium text-gray-900 tracking-[0.15em] truncate max-w-32 sm:max-w-none">
              AI树洞
            </span>
          </Link>
        </div>

        {/* 右侧：用户信息 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {profile ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(o => !o)}
                className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {profile.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatar_url}
                      alt={profile.username || ''}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium text-gray-900">
                      {(profile.username || profile.email || '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                {/* Username */}
                <span className="text-sm font-medium text-gray-900 max-w-24 truncate hidden sm:inline">
                  {profile.username || profile.email?.split('@')[0] || '未设置用户名'}
                </span>
                <svg className="w-3.5 h-3.5 text-gray-400 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    个人资料
                  </Link>
                  <div className="border-t border-gray-100" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    退出登录
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sm text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              登录
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
