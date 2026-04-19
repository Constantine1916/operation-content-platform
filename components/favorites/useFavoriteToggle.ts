'use client';

import { useCallback, useState } from 'react';
import { message } from 'antd';
import { toggleFavoriteState, type FavoriteContentType } from '@/lib/favorites';
import { useAuthActionGate } from '@/components/auth/useAuthActionGate';
import { useAuthRequiredHandler } from '@/components/auth/useAuthRequiredHandler';
import { getAuthTabForAction } from '@/lib/route-access';

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
  const requireAuthForAction = useAuthActionGate();
  const handleAuthRequired = useAuthRequiredHandler();

  const toggleFavorite = useCallback(async (contentId: string, shouldFavorite: boolean) => {
    const actionKind = shouldFavorite ? 'favorite' : 'unfavorite';
    const session = await requireAuthForAction({
      kind: actionKind,
      resumeAction: () => toggleFavorite(contentId, shouldFavorite),
    });

    if (!session) {
      return;
    }

    setFavoriteIds(current => toggleFavoriteState(current, contentId, shouldFavorite));
    setPendingIds(current => {
      const next = new Set(current);
      next.add(contentId);
      return next;
    });

    try {
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
      const authRequired = await handleAuthRequired(res, {
        defaultTab: getAuthTabForAction(actionKind),
        resumeAction: () => toggleFavorite(contentId, shouldFavorite),
      });

      if (authRequired) {
        setFavoriteIds(current => toggleFavoriteState(current, contentId, !shouldFavorite));
        return;
      }

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
  }, [contentType, handleAuthRequired, onRemoved, requireAuthForAction, setFavoriteIds]);

  return {
    pendingIds,
    toggleFavorite,
  };
}
