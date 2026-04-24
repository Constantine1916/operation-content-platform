'use client';

import { useEffect, useState } from 'react';
import { message } from 'antd';
import { supabase } from '@/lib/supabase';
import type { ModeratedContentType, ModerationAction, ModerationStatus } from '@/lib/moderation';

export function useAdminModeration() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted || !session) return;
      setToken(session.access_token);

      const res = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (mounted) setIsAdmin(data.success && data.data?.role === 'admin');
    });

    return () => {
      mounted = false;
    };
  }, []);

  async function moderate(input: {
    contentType: ModeratedContentType;
    contentId: string;
    action: ModerationAction;
  }): Promise<ModerationStatus | null> {
    if (!token) return null;
    setPendingId(input.contentId);

    try {
      const res = await fetch('/api/admin/content/moderate', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content_type: input.contentType,
          content_id: input.contentId,
          action: input.action,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? '审核操作失败');
      message.success('审核状态已更新');
      return data.data?.moderation_status ?? null;
    } catch (error: any) {
      message.error(error.message ?? '审核操作失败');
      return null;
    } finally {
      setPendingId(null);
    }
  }

  return { isAdmin, token, pendingId, moderate };
}
