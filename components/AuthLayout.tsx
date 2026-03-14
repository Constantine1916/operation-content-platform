'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import MainLayout from '@/components/MainLayout';
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
      
      // 如果未登录且不在登录页，跳转到登录页
      if (!session && pathname !== '/login') {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  // 登录页不需要 MainLayout
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

  // 未登录，跳转到登录页
  if (!session) {
    return null; // 会触发 useEffect 跳转
  }

  return <MainLayout>{children}</MainLayout>;
}
