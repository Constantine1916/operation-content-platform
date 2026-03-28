'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface NavbarProps { onMenuClick?: () => void }

interface Profile {
  username: string | null
  avatar_url: string | null
  email: string | null
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
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
      }
    }
    loadProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { setProfile(null); return }
      supabase.auth.getSession().then(({ data: { session: s } }) => {
        if (!s) return
        fetch('/api/profile', {
          headers: { Authorization: `Bearer ${s.access_token}` },
        }).then(r => r.json()).then(data => {
          if (data.success && data.data) setProfile(data.data)
        })
      })
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button onClick={onMenuClick} className="lg:hidden mr-3 p-2 rounded-full text-gray-900 hover:bg-gray-100 transition-colors">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <Link href="/overview" className="flex items-center gap-2">
              <div className="w-8 h-8 border border-gray-200 rounded-xl flex items-center justify-center bg-gray-50">
                <span className="text-lg font-medium text-gray-900">OP</span>
              </div>
              <span className="text-lg font-medium text-gray-900 tracking-[0.15em]">内容运营平台</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {profile ? (
              <Link href="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {profile.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatar_url} alt={profile.username || ''} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-medium text-gray-600">
                      {(profile.username || profile.email || '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                {/* Username or email */}
                <span className="text-lg text-gray-900 max-w-24 truncate">
                  {profile.username || profile.email?.split('@')[0] || '未设置用户名'}
                </span>
              </Link>
            ) : (
              <Link href="/login" className="text-lg text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors">
                登录
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
