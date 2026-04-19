'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { AuthModalTab } from '@/lib/route-access';
import { useAuthModal } from './AuthModalProvider';

const AUTH_ROUTE_PATHS = new Set(['/login', '/register']);

function getSafeRedirectTo(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return null;
  }

  const pathname = value.split('?')[0]?.split('#')[0] ?? value;

  if (AUTH_ROUTE_PATHS.has(pathname)) {
    return null;
  }

  return value;
}

export default function AuthRouteLauncher({ defaultTab }: { defaultTab: AuthModalTab }) {
  const launchedRef = useRef(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openAuthModal } = useAuthModal();
  const redirectTo = getSafeRedirectTo(searchParams.get('redirectTo'));

  useEffect(() => {
    if (launchedRef.current) {
      return;
    }

    launchedRef.current = true;
    openAuthModal({ defaultTab, redirectTo });
    router.replace('/');
  }, [defaultTab, openAuthModal, redirectTo, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <p className="text-sm font-medium text-gray-900">
          {defaultTab === 'register' ? '正在打开注册弹窗…' : '正在打开登录弹窗…'}
        </p>
        <p className="mt-2 text-sm text-gray-500">如果没有自动跳转，请返回首页重试。</p>
      </div>
    </div>
  );
}
