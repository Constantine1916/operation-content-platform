'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查是否已登录
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // 已登录，跳转到概览页
        router.push('/');
      }
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 w-8 bg-gray-600 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">内容运营平台</h1>
          <Link
            href="/login"
            className="px-6 py-2 bg-white text-gray-900 rounded-full font-medium hover:bg-gray-100 transition-colors"
          >
            登录
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
            聚合多平台内容
            <br />
            统一智能管理
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            一站式管理小红书、知乎、微信、X、Reddit 等平台内容
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-3 bg-white text-gray-900 rounded-full font-semibold hover:bg-gray-100 transition-colors text-lg"
            >
              立即开始
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8">
            <div className="text-4xl mb-4">📰</div>
            <h3 className="text-xl font-semibold text-white mb-2">热点资讯</h3>
            <p className="text-gray-400">实时聚合全网热点，自动追踪热门话题</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-white mb-2">文章管理</h3>
            <p className="text-gray-400">统一管理多平台内容，快速检索分析</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-white mb-2">智能运营</h3>
            <p className="text-gray-400">AI 驱动的内容运营助手，效率倍增</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 mt-20 border-t border-gray-800">
        <p className="text-center text-gray-500">© 2026 内容运营平台. All rights reserved.</p>
      </footer>
    </div>
  );
}
