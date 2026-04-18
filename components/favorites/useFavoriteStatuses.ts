'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { FavoriteContentType } from '@/lib/favorites';

export function useFavoriteStatuses(contentType: FavoriteContentType, contentIds: string[]) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loadingStatuses, setLoadingStatuses] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadStatuses() {
      if (contentIds.length === 0) {
        setFavoriteIds(new Set());
        return;
      }

      setLoadingStatuses(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (!cancelled) setFavoriteIds(new Set());
          return;
        }

        const params = new URLSearchParams({
          type: contentType,
          ids: contentIds.join(','),
        });
        const res = await fetch(`/api/favorites/status?${params}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error ?? '加载收藏状态失败');

        if (!cancelled) {
          setFavoriteIds(new Set<string>(data.ids ?? []));
        }
      } catch {
        if (!cancelled) setFavoriteIds(new Set());
      } finally {
        if (!cancelled) setLoadingStatuses(false);
      }
    }

    loadStatuses();

    return () => {
      cancelled = true;
    };
  }, [contentType, contentIds.join(',')]);

  return {
    favoriteIds,
    setFavoriteIds,
    loadingStatuses,
  };
}
