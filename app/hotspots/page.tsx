'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface Hotspot { id: string; title: string; category: string; source: string; summary: string; url: string; 热度: string; collected_date: string; }

const PAGE_SIZE = 20;

export default function HotspotsPage() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setHotspots([]); setPage(0); setHasMore(true); fetchHotspots(0, true); }, [selectedCategory]);
  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) loadMore();
    }, { rootMargin: '100px', threshold: 0.1 });
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    return () => { observerRef.current?.disconnect(); };
  }, [hasMore, loading, loadingMore, page]);
  useEffect(() => { fetchCategories(); }, []);

  const fetchHotspots = async (pageNum: number, isFirst = false) => {
    if (isFirst) setLoading(true); else setLoadingMore(true);
    try {
      const url = selectedCategory
        ? `/api/hotspots?category=${encodeURIComponent(selectedCategory)}&limit=${PAGE_SIZE}&page=${pageNum + 1}`
        : `/api/hotspots?limit=${PAGE_SIZE}&page=${pageNum + 1}`;
      const result = await fetch(url).then(r => r.json());
      const items = result.data || [];
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

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">热点资讯</h1>
        <p className="text-xs text-gray-400 tracking-[0.15em] uppercase">Hotspot News</p>
      </div>

      <div className="mb-6 flex gap-2 flex-wrap">
        <button onClick={() => setSelectedCategory('')} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedCategory === '' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'}`}>全部</button>
        {categories.slice(0, 12).map(cat => (
          <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedCategory === cat ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'}`}>{cat}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse"></div></div>
      ) : hotspots.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">暂无数据</div>
      ) : (
        <>
          <div className="space-y-3">
            {hotspots.map((hotspot) => (
              <a key={hotspot.id} href={hotspot.url} target="_blank" rel="noopener noreferrer"
                className="block bg-white border border-gray-100 rounded-2xl p-5 hover:border-gray-300 hover:shadow-sm transition-all group">
                <div className="flex items-center gap-2 mb-2">
                  {hotspot.热度 && <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-50 text-gray-600 border border-gray-100">🔥 {hotspot.热度}</span>}
                  {hotspot.category && <span className="px-2 py-0.5 rounded-full text-[11px] bg-gray-50 text-gray-500 border border-gray-100">{hotspot.category}</span>}
                  <span className="text-[11px] text-gray-400">{formatDate(hotspot.collected_date)}</span>
                </div>
                <h3 className="text-sm font-medium text-gray-800 group-hover:text-gray-900 line-clamp-2 mb-2">{hotspot.title}</h3>
                {hotspot.summary && <p className="text-xs text-gray-500 line-clamp-2 mb-2">{hotspot.summary}</p>}
                {hotspot.source && <div className="text-[11px] text-gray-400">📰 {hotspot.source}</div>}
              </a>
            ))}
          </div>
          <div ref={loadMoreRef} className="mt-8">
            {loadingMore && <div className="flex justify-center py-8"><div className="w-6 h-6 bg-gray-100 rounded-full animate-spin"></div></div>}
            {!hasMore && <div className="text-center py-8 text-gray-300 text-xs tracking-widest">已加载全部 {hotspots.length} 条热点</div>}
          </div>
        </>
      )}
    </div>
  );
}
