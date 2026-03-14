'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import MainLayout from '@/components/MainLayout';
import LandingPage from '@/app/page';
import OverviewPage from '@/app/overview/page';
import { usePathname, useRouter } from 'next/navigation';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();

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

  // 登录页单独处理
  if (pathname === '/login') {
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
