'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import FavoriteButton from '@/components/favorites/FavoriteButton';
import { useFavoriteStatuses } from '@/components/favorites/useFavoriteStatuses';
import { useFavoriteToggle } from '@/components/favorites/useFavoriteToggle';
import { getFavoriteButtonState } from '@/lib/favorite-view-model';
import { formatBeijingDateTime } from '@/lib/beijing-time';
import type { PublicHotspot } from '@/lib/server/public-content';

type HotspotGroup = { timeKey: string; label: string; items: PublicHotspot[] };
type SourceTab = 'all' | 'web' | 'twitter';

const PAGE_SIZE = 100;
const hotspotActionButtonClasses =
  'inline-flex h-[31px] w-[31px] shrink-0 items-center justify-center rounded-full border border-black/5 bg-white/92 text-gray-400 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.35)] backdrop-blur-sm transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out hover:-translate-y-px hover:border-gray-300 hover:text-gray-700 hover:shadow-[0_14px_28px_-20px_rgba(15,23,42,0.38)] active:scale-95';

function groupByTime(hotspots: PublicHotspot[]): HotspotGroup[] {
  const map = new Map<string, PublicHotspot[]>();
  for (const hotspot of hotspots) {
    const key = formatBeijingDateTime(hotspot.created_at);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(hotspot);
  }

  return Array.from(map.entries()).map(([key, items]) => ({
    timeKey: key,
    label: key,
    items,
  }));
}

export default function PublicHotspotsPage({
  initialHotspots,
  initialHasMore,
}: {
  initialHotspots: PublicHotspot[];
  initialHasMore: boolean;
}) {
  const [hotspots, setHotspots] = useState<PublicHotspot[]>(initialHotspots);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(0);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [sourceTab, setSourceTab] = useState<SourceTab>('all');
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const hasMountedRef = useRef(false);
  const { favoriteIds, setFavoriteIds } = useFavoriteStatuses('hotspot', hotspots.map(item => item.id));
  const { pendingIds, toggleFavorite } = useFavoriteToggle({
    contentType: 'hotspot',
    setFavoriteIds,
  });

  const fetchHotspots = useCallback(async (pageNum: number, isFirst = false, tab: SourceTab = sourceTab) => {
    if (isFirst) setLoading(true); else setLoadingMore(true);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(pageNum + 1) });
      if (tab !== 'all') params.set('source_type', tab);
      const result = await fetch(`/api/hotspots?${params}`).then(r => r.json());
      const items: PublicHotspot[] = result.data || [];
      setHasMore((result.pagination?.page ?? 1) < (result.pagination?.totalPages ?? 1));
      setHotspots(prev => pageNum === 0 ? items : [...prev, ...items]);
    } catch (error) {
      console.error(error);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [sourceTab]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    setHotspots([]);
    setPage(0);
    setHasMore(true);
    void fetchHotspots(0, true, sourceTab);
  }, [fetchHotspots, sourceTab]);

  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
        void loadMore();
      }
    }, { rootMargin: '100px', threshold: 0.1 });

    if (loadMoreRef.current) obs.observe(loadMoreRef.current);
    return () => obs.disconnect();
  }, [hasMore, loading, loadingMore, page]);

  const loadMore = useCallback(async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchHotspots(nextPage, false);
  }, [fetchHotspots, page]);

  const toggleCollapse = (key: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const groups = groupByTime(hotspots);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">AI 资讯</h1>
        <p className="text-xs text-gray-500 tracking-[0.15em] uppercase">Hotspot News</p>
      </div>

      <div className="mb-6 overflow-x-auto pb-1">
        <div className="flex w-max gap-1 rounded-xl bg-gray-100 p-1">
          {([['all', '全部'], ['web', '网站资讯'], ['twitter', 'Twitter']] as [SourceTab, string][]).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setSourceTab(tab)}
              className={`shrink-0 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                sourceTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2].map(i => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden animate-pulse">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="h-5 w-32 bg-gray-100 rounded-full" />
                <div className="h-4 w-16 bg-gray-100 rounded-full ml-auto" />
              </div>
              {[1, 2, 3].map(j => (
                <div key={j} className="px-5 py-4 border-b border-gray-50 last:border-0">
                  <div className="h-4 w-3/4 bg-gray-100 rounded-lg mb-2" />
                  <div className="h-3 w-1/2 bg-gray-100 rounded-lg" />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-20 text-gray-500 text-sm">暂无数据</div>
      ) : (
        <>
          <div className="space-y-5">
            {groups.map((group) => {
              const isCollapsed = collapsed.has(group.timeKey);

              return (
                <div key={group.timeKey} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => toggleCollapse(group.timeKey)}
                    className="w-full px-5 py-4 flex items-center gap-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs font-semibold text-white bg-gray-900 px-2.5 py-1 rounded-full">
                        {group.label}
                      </span>
                      <span className="text-xs text-gray-500">{group.items.length} 条热点</span>
                    </div>
                    <svg
                      className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {!isCollapsed && (
                    <div className="divide-y divide-gray-50">
                      {group.items.map((hotspot) => (
                        <div
                          key={hotspot.id}
                          className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition-colors group"
                        >
                          <a
                            href={hotspot.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-w-0 flex-1"
                          >
                            <div className="min-w-0">
                              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                                {hotspot.热度 && (
                                  <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
                                    🔥 {hotspot.热度}
                                  </span>
                                )}
                              </div>
                              <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 transition-colors group-hover:text-black">
                                {hotspot.title}
                              </h3>
                              {hotspot.summary && (
                                <p className="mt-1 line-clamp-1 text-xs text-gray-600">{hotspot.summary}</p>
                              )}
                              {hotspot.source && (
                                <div className="mt-1 text-[10px] text-gray-400">📰 {hotspot.source}</div>
                              )}
                            </div>
                          </a>

                          <div className="flex shrink-0 items-center gap-1.5 self-start pt-0.5">
                            <a
                              href={hotspot.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`打开资讯：${hotspot.title}`}
                              title="打开资讯"
                              className={hotspotActionButtonClasses}
                            >
                              <svg className="h-[13px] w-[13px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>

                            <FavoriteButton
                              isFavorite={getFavoriteButtonState(hotspot.id, favoriteIds, pendingIds).isFavorite}
                              isPending={getFavoriteButtonState(hotspot.id, favoriteIds, pendingIds).isPending}
                              onToggle={() => toggleFavorite(hotspot.id, !favoriteIds.has(hotspot.id))}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div ref={loadMoreRef} className="mt-4">
            {loadingMore && (
              <div className="space-y-5">
                {[1].map(i => (
                  <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden animate-pulse">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                      <div className="h-5 w-32 bg-gray-100 rounded-full" />
                      <div className="h-4 w-16 bg-gray-100 rounded-full ml-auto" />
                    </div>
                    {[1, 2, 3, 4].map(j => (
                      <div key={j} className="px-5 py-4 border-b border-gray-50 last:border-0">
                        <div className="h-4 w-3/4 bg-gray-100 rounded-lg mb-2" />
                        <div className="h-3 w-1/2 bg-gray-100 rounded-lg" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
            {!hasMore && hotspots.length > 0 && (
              <div className="flex items-center gap-3 justify-center py-8">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">已加载全部 {hotspots.length} 条热点</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
