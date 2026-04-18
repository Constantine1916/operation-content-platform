'use client';

import { useCallback, useState } from 'react';
import { message } from 'antd';
import { supabase } from '@/lib/supabase';
import { toggleFavoriteState, type FavoriteContentType } from '@/lib/favorites';

interface FavoriteToggleOptions {
  contentType: FavoriteContentType;
  setFavoriteIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  onRemoved?: (contentId: string) => void;
}

export function useFavoriteToggle({
  contentType,
  setFavoriteIds,
  onRemoved,
}: FavoriteToggleOptions) {
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const toggleFavorite = useCallback(async (contentId: string, shouldFavorite: boolean) => {
    setFavoriteIds(current => toggleFavoriteState(current, contentId, shouldFavorite));
    setPendingIds(current => {
      const next = new Set(current);
      next.add(contentId);
      return next;
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('请先登录后再收藏');
      }

      const res = await fetch('/api/favorites', {
        method: shouldFavorite ? 'POST' : 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          content_type: contentType,
          content_id: contentId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? (shouldFavorite ? '收藏失败，请重试' : '取消收藏失败，请重试'));
      }

      if (!shouldFavorite) {
        onRemoved?.(contentId);
      }
    } catch (error: any) {
      setFavoriteIds(current => toggleFavoriteState(current, contentId, !shouldFavorite));
      message.error(error.message ?? (shouldFavorite ? '收藏失败，请重试' : '取消收藏失败，请重试'));
    } finally {
      setPendingIds(current => {
        const next = new Set(current);
        next.delete(contentId);
        return next;
      });
    }
  }, [contentType, onRemoved, setFavoriteIds]);

  return {
    pendingIds,
    toggleFavorite,
  };
}
