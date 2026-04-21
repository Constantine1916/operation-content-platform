'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import MainLayout from '@/components/MainLayout';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthModal } from '@/components/auth/AuthModalProvider';
import { getAuthTabForPrivateRoute, isPrivateAppPath } from '@/lib/route-access';

export default function AuthLayout({
  children,
  access = 'public',
  showSidebar = true,
}: {
  children: React.ReactNode;
  access?: 'public' | 'private';
  showSidebar?: boolean;
}) {
  const [authResolved, setAuthResolved] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const promptedPathRef = useRef<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { openAuthModal } = useAuthModal();
  const isPrivateRoute = access === 'private' && isPrivateAppPath(pathname);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setHasSession(Boolean(session));
      setAuthResolved(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setHasSession(Boolean(session));
      setAuthResolved(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authResolved) return;
    if (hasSession && pathname === '/') {
      router.replace('/overview');
    }
  }, [authResolved, hasSession, pathname, router]);

  useEffect(() => {
    if (!authResolved || !isPrivateRoute || hasSession) {
      promptedPathRef.current = null;
      return;
    }

    if (promptedPathRef.current === pathname) {
      return;
    }

    promptedPathRef.current = pathname;
    openAuthModal({
      defaultTab: getAuthTabForPrivateRoute(),
      redirectTo: pathname,
    });
  }, [authResolved, hasSession, isPrivateRoute, openAuthModal, pathname]);

  const shouldHideRootContent = authResolved && hasSession && pathname === '/';
  const shouldShowPrivateLoading = access === 'private' && !authResolved;
  const shouldBlockPrivateContent = access === 'private' && authResolved && !hasSession;

  let content: React.ReactNode = children;

  if (shouldHideRootContent || shouldBlockPrivateContent) {
    content = null;
  } else if (shouldShowPrivateLoading) {
    content = (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 rounded-full bg-gray-200 mb-3" />
          <div className="h-3 w-24 rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  return <MainLayout showSidebar={showSidebar}>{content}</MainLayout>;
}
