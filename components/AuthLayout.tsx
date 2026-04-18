'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import MainLayout from '@/components/MainLayout';
import LandingPage from '@/app/page';
import { usePathname, useRouter } from 'next/navigation';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();
  const isPublicProfilePath = /^\/profile\/[^/]+$/.test(pathname);

  useEffect(() => {
    // 获取当前会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 登录页和注册页单独处理
  if (pathname === '/login' || pathname === '/register') {
    return <>{children}</>;
  }

  // 加载中
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 bg-gray-200 rounded-full mb-3"></div>
          <div className="h-3 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!session && isPublicProfilePath) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/88 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6">
            <Link href="/" className="flex items-center min-w-0">
              <Image
                src="/assets/logo.png"
                alt="AICAVE"
                width={140}
                height={52}
                className="flex-shrink-0 object-contain"
              />
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-900"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
              >
                注册
              </Link>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 lg:px-6 lg:py-8">{children}</main>
      </div>
    );
  }

  // 未登录且不是首页，重定向到首页（Landing）
  if (!session && pathname !== '/') {
    router.push('/');
    return null;
  }

  // 未登录显示 Landing 页面（首页）
  if (!session) {
    return <LandingPage />;
  }

  // 已登录用户访问首页，重定向到概览页
  if (session && pathname === '/') {
    router.push('/overview');
    return null;
  }

  // 已登录显示带 MainLayout 的内容
  return <MainLayout>{children}</MainLayout>;
}
