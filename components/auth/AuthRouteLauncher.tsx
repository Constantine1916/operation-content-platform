'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { AuthModalTab } from '@/lib/route-access';
import { useAuthModal } from './AuthModalProvider';
import { executeAuthRouteLaunch } from './auth-route-launcher-utils';

export default function AuthRouteLauncher({ defaultTab }: { defaultTab: AuthModalTab }) {
  const launchRunIdRef = useRef(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openAuthModal } = useAuthModal();
  const requestedRedirectTo = searchParams.get('redirectTo');

  useEffect(() => {
    let cancelled = false;
    const launchRunId = launchRunIdRef.current + 1;
    launchRunIdRef.current = launchRunId;

    async function launch() {
      if (cancelled) {
        return;
      }

      await executeAuthRouteLaunch({
        defaultTab,
        redirectTo: requestedRedirectTo,
        getSession: () => supabase.auth.getSession(),
        openAuthModal,
        replace: (target) => router.replace(target),
        shouldContinue: () => !cancelled && launchRunIdRef.current === launchRunId,
      });
    }

    void launch();

    return () => {
      cancelled = true;
    };
  }, [defaultTab, openAuthModal, requestedRedirectTo, router]);

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
