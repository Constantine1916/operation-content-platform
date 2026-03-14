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

const PAGE_SIZE = 30;

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
    const options = {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
        loadMore();
      }
    }, options);

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, loadingMore, page]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchHotspots = async (pageNum: number, isFirstLoad = false) => {
    if (isFirstLoad) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const apiPage = pageNum + 1;
      const url = selectedCategory
        ? `/api/hotspots?category=${encodeURIComponent(selectedCategory)}&limit=${PAGE_SIZE}&page=${apiPage}`
        : `/api/hotspots?limit=${PAGE_SIZE}&page=${apiPage}`;
      
      const res = await fetch(url);
      const result = await res.json();
      const newHotspots = result.data || [];

      if (newHotspots.length < PAGE_SIZE) {
        setHasMore(false);
      }

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
    data.data?.forEach((h: Hotspot) => {
      if (h.category) cats.add(h.category);
    });
    setCategories(Array.from(cats).sort());
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
  };

  const getHeatStyle = (heat: string) => {
    switch (heat) {
      case '极高':
        return 'text-gray-900 bg-gray-100 border border-gray-300';
      case '高':
        return 'text-gray-800 bg-gray-50 border border-gray-200';
      case '中':
        return 'text-gray-600 bg-gray-50 border border-gray-200';
      default:
        return 'text-gray-500 bg-gray-50 border border-gray-200';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📰 热点资讯</h1>
        <p className="text-gray-600">小经理每日采集的科技、AI、产品热点</p>
      </div>

      {/* 分类筛选 */}
      <div className="mb-6">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === ''
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            全部
          </button>
          {categories.slice(0, 15).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 热点列表 */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : hotspots.length === 0 ? (
        <div className="text-center py-12 text-gray-500">暂无数据</div>
      ) : (
        <>
          <div className="space-y-4">
            {hotspots.map((hotspot) => (
              <div
                key={hotspot.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-400 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {hotspot.热度 && (
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${getHeatStyle(
                            hotspot.热度
                          )}`}
                        >
                          🔥 {hotspot.热度}
                        </span>
                      )}
                      {hotspot.category && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium border border-gray-200">
                          {hotspot.category}
                        </span>
                      )}
                      <span className="text-sm text-gray-500">
                        📅 {formatDate(hotspot.collected_date)}
                        {hotspot.collected_time && ` ${hotspot.collected_time}`}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {hotspot.url ? (
                        <a
                          href={hotspot.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-gray-600 transition-colors"
                        >
                          {hotspot.title}
                        </a>
                      ) : (
                        hotspot.title
                      )}
                    </h3>

                    {hotspot.summary && (
                      <p className="text-gray-600 text-sm mb-3">{hotspot.summary}</p>
                    )}

                    {hotspot.source && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>📰 来源: {hotspot.source}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 滚动加载触发器 */}
          <div ref={loadMoreRef} className="mt-8">
            {loadingMore && (
              <div className="text-center py-4 text-gray-500">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                <p className="mt-2">加载更多...</p>
              </div>
            )}
            {!hasMore && hotspots.length > 0 && (
              <div className="text-center py-4 text-gray-400 text-sm">
                已加载全部 {hotspots.length} 条热点
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
