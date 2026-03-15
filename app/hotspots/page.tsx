'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface Hotspot { id: string; title: string; category: string; source: string; summary: string; url: string; 热度: string; collected_date: string; collected_time: string; }
interface HotspotGroup { timeKey: string; label: string; items: Hotspot[]; }

const PAGE_SIZE = 100;

function toBeijingLabel(date: string, time: string): string {
  // collected_time 存储的已经是 UTC 时间，不需要再做时区转换
  // 直接从 time 字段提取小时和分钟显示即可
  if (!time) return date;
  const [hours, minutes] = time.split(':');
  return `${date.slice(5)} ${hours}:${minutes}`;
}

function groupByTime(hotspots: Hotspot[]): HotspotGroup[] {
  const map = new Map<string, Hotspot[]>();
  for (const h of hotspots) {
    const key = `${h.collected_date}__${h.collected_time}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(h);
  }
  return Array.from(map.entries()).map(([key, items]) => {
    const [date, time] = key.split('__');
    return { timeKey: key, label: toBeijingLabel(date, time), items };
  });
}

export default function HotspotsPage() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setHotspots([]); setPage(0); setHasMore(true); fetchHotspots(0, true); }, [selectedCategory]);

  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) loadMore();
    }, { rootMargin: '100px', threshold: 0.1 });
    if (loadMoreRef.current) obs.observe(loadMoreRef.current);
    return () => obs.disconnect();
  }, [hasMore, loading, loadingMore, page]);

  useEffect(() => { fetchCategories(); }, []);

  const fetchHotspots = async (pageNum: number, isFirst = false) => {
    if (isFirst) setLoading(true); else setLoadingMore(true);
    try {
      const url = selectedCategory
        ? `/api/hotspots?category=${encodeURIComponent(selectedCategory)}&limit=${PAGE_SIZE}&page=${pageNum + 1}`
        : `/api/hotspots?limit=${PAGE_SIZE}&page=${pageNum + 1}`;
      const result = await fetch(url).then(r => r.json());
      const items: Hotspot[] = result.data || [];
      if (items.length < PAGE_SIZE) setHasMore(false);
      setHotspots(prev => pageNum === 0 ? items : [...prev, ...items]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setLoadingMore(false); }
  };

  const loadMore = useCallback(() => { const n = page + 1; setPage(n); fetchHotspots(n, false); }, [page, selectedCategory]);

  const fetchCategories = async () => {
    const data = await fetch('/api/hotspots?limit=1000').then(r => r.json());
    const cats = new Set<string>();
    data.data?.forEach((h: Hotspot) => { if (h.category) cats.add(h.category); });
    setCategories(Array.from(cats).sort());
  };

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
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">热点资讯</h1>
        <p className="text-xs text-gray-500 tracking-[0.15em] uppercase">Hotspot News</p>
      </div>

      {/* 分类筛选 */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button onClick={() => setSelectedCategory('')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedCategory === '' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-600 hover:text-gray-900'}`}>
          全部
        </button>
        {categories.slice(0, 12).map(cat => (
          <button key={cat} onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedCategory === cat ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-600 hover:text-gray-900'}`}>
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2].map(i => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden animate-pulse">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="h-5 w-32 bg-gray-100 rounded-full"></div>
                <div className="h-4 w-16 bg-gray-100 rounded-full ml-auto"></div>
              </div>
              {[1,2,3].map(j => (
                <div key={j} className="px-5 py-4 border-b border-gray-50 last:border-0">
                  <div className="h-4 w-3/4 bg-gray-100 rounded-lg mb-2"></div>
                  <div className="h-3 w-1/2 bg-gray-100 rounded-lg"></div>
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
                  {/* 时间组标题 */}
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
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* 热点列表 */}
                  {!isCollapsed && (
                    <div className="divide-y divide-gray-50">
                      {group.items.map((hotspot) => (
                        <a
                          key={hotspot.id}
                          href={hotspot.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              {hotspot.热度 && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-50 text-orange-600 border border-orange-200">
                                  🔥 {hotspot.热度}
                                </span>
                              )}
                              {hotspot.category && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                  {hotspot.category}
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-black line-clamp-2">
                              {hotspot.title}
                            </h3>
                            {hotspot.summary && (
                              <p className="text-xs text-gray-600 line-clamp-1 mt-1">{hotspot.summary}</p>
                            )}
                            {hotspot.source && (
                              <div className="text-[10px] text-gray-400 mt-1">📰 {hotspot.source}</div>
                            )}
                          </div>
                          <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-600 flex-shrink-0 mt-1 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 加载更多 */}
          <div ref={loadMoreRef} className="mt-4">
            {loadingMore && (
              <div className="space-y-5">
                {[1].map(i => (
                  <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden animate-pulse">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                      <div className="h-5 w-32 bg-gray-100 rounded-full"></div>
                      <div className="h-4 w-16 bg-gray-100 rounded-full ml-auto"></div>
                    </div>
                    {[1,2,3,4].map(j => (
                      <div key={j} className="px-5 py-4 border-b border-gray-50 last:border-0">
                        <div className="h-4 w-3/4 bg-gray-100 rounded-lg mb-2"></div>
                        <div className="h-3 w-1/2 bg-gray-100 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
            {!hasMore && hotspots.length > 0 && (
              <div className="flex items-center gap-3 justify-center py-8">
                <div className="flex-1 h-px bg-gray-100"></div>
                <span className="text-xs text-gray-400">已加载全部 {hotspots.length} 条热点</span>
                <div className="flex-1 h-px bg-gray-100"></div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
