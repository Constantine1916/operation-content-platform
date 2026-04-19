'use client';

import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthModal } from '@/components/auth/AuthModalProvider';
import {
  getAuthTabForAction,
  type AuthActionKind,
} from '@/lib/route-access';

export function useAuthActionGate() {
  const { openAuthModal } = useAuthModal();

  return useCallback(async ({
    kind,
    redirectTo,
    resumeAction,
  }: {
    kind: AuthActionKind;
    redirectTo?: string;
    resumeAction?: () => void | Promise<void>;
  }) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      return session;
    }

    openAuthModal({
      defaultTab: getAuthTabForAction(kind),
      redirectTo,
      resumeAction,
    });

    return null;
  }, [openAuthModal]);
}
