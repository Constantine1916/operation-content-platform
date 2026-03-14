'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface Hotspot {
  id: string;
  title: string;
  category: string;
  source: string;
  summary: string;
  url: string;
  热度: string;
  collected_date: string;
  collected_time: string;
}

const PAGE_SIZE = 20;

export default function HotspotsPage() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHotspots([]);
    setPage(0);
    setHasMore(true);
    fetchHotspots(0, true);
  }, [selectedCategory]);

  useEffect(() => {
    const options = { root: null, rootMargin: '100px', threshold: 0.1 };
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
        loadMore();
      }
    }, options);
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    return () => { if (observerRef.current) observerRef.current.disconnect(); };
  }, [hasMore, loading, loadingMore, page]);

  useEffect(() => { fetchCategories(); }, []);

  const fetchHotspots = async (pageNum: number, isFirstLoad = false) => {
    if (isFirstLoad) setLoading(true);
    else setLoadingMore(true);
    try {
      const apiPage = pageNum + 1;
      const url = selectedCategory
        ? `/api/hotspots?category=${encodeURIComponent(selectedCategory)}&limit=${PAGE_SIZE}&page=${apiPage}`
        : `/api/hotspots?limit=${PAGE_SIZE}&page=${apiPage}`;
      const res = await fetch(url);
      const result = await res.json();
      const newHotspots = result.data || [];
      if (newHotspots.length < PAGE_SIZE) setHasMore(false);
      setHotspots(prev => pageNum === 0 ? newHotspots : [...prev, ...newHotspots]);
    } catch (error) {
      console.error('Failed to fetch hotspots:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchHotspots(nextPage, false);
  }, [page, selectedCategory]);

  const fetchCategories = async () => {
    const res = await fetch('/api/hotspots?limit=1000');
    const data = await res.json();
    const cats = new Set<string>();
    data.data?.forEach((h: Hotspot) => { if (h.category) cats.add(h.category); });
    setCategories(Array.from(cats).sort());
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-normal tracking-wide black mb-2">热点资讯</h1>
        <p className="text-xs gray-600 tracking-[0.2em] uppercase">Hotspot News</p>
      </div>

      {/* Category Filter */}
      <div className="mb-8">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-full text-xs tracking-widest uppercase transition-all ${
              selectedCategory === '' ? 'bg-gray-900 text-white' : 'bg-white gray-700 border border-gray-200 hover:border-gray-300'
            }`}
          >
            全部
          </button>
          {categories.slice(0, 12).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs tracking-widest uppercase transition-all ${
                selectedCategory === cat ? 'bg-gray-900 text-white' : 'bg-white gray-700 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Hotspots List */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 bg-gray-100 rounded-full"></div></div>
      ) : hotspots.length === 0 ? (
        <div className="text-center py-20 gray-600">暂无数据</div>
      ) : (
        <>
          <div className="space-y-3">
            {hotspots.map((hotspot) => (
              <a
                key={hotspot.id}
                href={hotspot.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white border border-gray-100 rounded-2xl p-6 hover:border-gray-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      {hotspot.热度 && (
                        <span className="px-2 py-1 rounded-full text-[10px] tracking-widest uppercase bg-gray-50 gray-700 border border-gray-100">
                          🔥 {hotspot.热度}
                        </span>
                      )}
                      {hotspot.category && (
                        <span className="px-2 py-1 rounded-full text-[10px] tracking-widest uppercase bg-gray-50 gray-600 border border-gray-100">
                          {hotspot.category}
                        </span>
                      )}
                      <span className="text-[10px] gray-500 uppercase tracking-widest">
                        {formatDate(hotspot.collected_date)}
                      </span>
                    </div>
                    <h3 className="text-sm font-normal black group-hover:black transition-colors mb-2 line-clamp-2">
                      {hotspot.title}
                    </h3>
                    {hotspot.summary && (
                      <p className="text-xs gray-600 line-clamp-2 mb-3">{hotspot.summary}</p>
                    )}
                    {hotspot.source && (
                      <div className="text-[10px] gray-500 uppercase tracking-widest">
                        📰 {hotspot.source}
                      </div>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
          <div ref={loadMoreRef} className="mt-8">
            {loadingMore && <div className="flex justify-center py-8"><div className="w-6 h-6 bg-gray-100 rounded-full animate-spin"></div></div>}
            {!hasMore && hotspots.length > 0 && <div className="text-center py-8 gray-500 text-xs tracking-widest uppercase">已加载全部 {hotspots.length} 条热点</div>}
          </div>
        </>
      )}
    </div>
  );
}
