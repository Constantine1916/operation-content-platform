'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import MainLayout from '@/components/MainLayout';
import { usePathname, useRouter } from 'next/navigation';

const PUBLIC_CONTENT_PATHS = new Set([
  '/',
  '/articles',
  '/hotspots',
  '/ai-video',
  '/ai-gallery',
]);

function PublicProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/88 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center min-w-0">
            <Image
              src="/assets/logo.png"
              alt="AICAVE"
              width={155}
              height={60}
              className="h-14 w-auto flex-shrink-0 object-contain sm:h-[60px]"
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

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const [authResolved, setAuthResolved] = useState(false);
  const [session, setSession] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();
  const isPublicProfilePath = /^\/profile\/[^/]+$/.test(pathname);
  const isAuthPath = pathname === '/login' || pathname === '/register';
  const isPublicContentPath = PUBLIC_CONTENT_PATHS.has(pathname);
  const isPublicPath = isPublicContentPath || isPublicProfilePath;

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setAuthResolved(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      setAuthResolved(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authResolved || isAuthPath) return;

    if (session && pathname === '/') {
      router.replace('/overview');
      return;
    }

    if (!session && !isPublicPath) {
      router.replace('/');
    }
  }, [authResolved, isAuthPath, isPublicPath, pathname, router, session]);

  if (isAuthPath) {
    return <>{children}</>;
  }

  if (!authResolved) {
    if (isPublicProfilePath) {
      return <PublicProfileLayout>{children}</PublicProfileLayout>;
    }

    if (isPublicContentPath) {
      return <>{children}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 bg-gray-200 rounded-full mb-3"></div>
          <div className="h-3 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    if (isPublicProfilePath) {
      return <PublicProfileLayout>{children}</PublicProfileLayout>;
    }

    if (isPublicContentPath) {
      return <>{children}</>;
    }

    return null;
  }

  if (pathname === '/') {
    return null;
  }

  return <MainLayout>{children}</MainLayout>;
}
