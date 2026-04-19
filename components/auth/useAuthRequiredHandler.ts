'use client';

import { useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { normalizeAuthRequiredResult } from '@/lib/auth-required';
import type { AuthModalTab } from '@/lib/route-access';
import { useAuthModal } from './AuthModalProvider';

interface AuthRequiredHandlerOptions {
  defaultTab?: AuthModalTab;
  redirectTo?: string | null;
}

interface AuthRequiredHandleOverrides extends AuthRequiredHandlerOptions {
  resumeAction?: () => void | Promise<void>;
}

export function useAuthRequiredHandler(options: AuthRequiredHandlerOptions = {}) {
  const pathname = usePathname();
  const { openAuthModal } = useAuthModal();

  return useCallback(async (input: unknown, overrides: AuthRequiredHandleOverrides = {}) => {
    const authRequired = await normalizeAuthRequiredResult(input);

    if (!authRequired) {
      return null;
    }

    openAuthModal({
      defaultTab: overrides.defaultTab ?? options.defaultTab ?? 'login',
      redirectTo: overrides.redirectTo ?? options.redirectTo ?? pathname,
      resumeAction: overrides.resumeAction,
    });

    return authRequired;
  }, [openAuthModal, options.defaultTab, options.redirectTo, pathname]);
}
