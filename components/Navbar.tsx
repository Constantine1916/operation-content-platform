'use client'

import Link from 'next/link'
import { useState } from 'react'

interface NavbarProps {
  onMenuClick?: () => void
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  return (
    <nav className="bg-black border-b border-white/10 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand + Mobile Menu Button */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={onMenuClick}
              className="lg:hidden mr-3 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <Link href="/overview" className="flex items-center gap-2">
              <div className="w-8 h-8 border border-white/20 rounded-xl flex items-center justify-center bg-white/5">
                <span className="text-xs font-light tracking-widest text-white">OP</span>
              </div>
              <span className="text-sm font-light tracking-[0.15em] text-white/80 truncate">内容运营平台</span>
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <Link 
              href="/"
              className="text-xs text-white/50 hover:text-white transition-colors tracking-widest uppercase"
            >
              首页
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
