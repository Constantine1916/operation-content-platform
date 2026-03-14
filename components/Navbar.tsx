'use client'

import Link from 'next/link'
import { useState } from 'react'

interface NavbarProps { onMenuClick?: () => void }

export default function Navbar({ onMenuClick }: NavbarProps) {
  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button onClick={onMenuClick} className="lg:hidden mr-3 p-2 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <Link href="/overview" className="flex items-center gap-2">
              <div className="w-8 h-8 border border-gray-200 rounded-xl flex items-center justify-center bg-gray-50">
                <span className="text-xs font-medium text-gray-600">OP</span>
              </div>
              <span className="text-sm font-medium text-gray-600 tracking-[0.15em]">内容运营平台</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors tracking-widest uppercase">首页</Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
