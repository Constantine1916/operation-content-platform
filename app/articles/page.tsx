'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface Article {
  id: string;
  platform: string;
  author: string | null;
  title: string;
  content: string;
  filename: string;
  created_at: string;
}

const PAGE_SIZE = 20;

const platformNames: Record<string, string> = {
  xiaohongshu: '小红书',
  zhihu: '知乎',
  wechat: '微信公众号',
  x: 'X (Twitter)',
  reddit: 'Reddit',
};

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setArticles([]);
    setPage(0);
    setHasMore(true);
    fetchArticles(0, true);
  }, [selectedPlatform]);

  useEffect(() => {
    const options = { root: null, rootMargin: '100px', threshold: 0.1 };
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) loadMore();
    }, options);
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    return () => { if (observerRef.current) observerRef.current.disconnect(); };
  }, [hasMore, loading, loadingMore, page]);

  const fetchArticles = async (pageNum: number, isFirstLoad = false) => {
    if (isFirstLoad) setLoading(true);
    else setLoadingMore(true);
    try {
      const apiPage = pageNum + 1;
      let url = `/api/articles?limit=${PAGE_SIZE}&page=${apiPage}`;
      if (selectedPlatform) url += `&platform=${selectedPlatform}`;
      const res = await fetch(url);
      const result = await res.json();
      const newArticles = result.data || [];
      if (newArticles.length < PAGE_SIZE) setHasMore(false);
      setArticles(prev => pageNum === 0 ? newArticles : [...prev, ...newArticles]);
    } catch (error) {
      console.error('Failed to fetch articles:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchArticles(nextPage, false);
  }, [page, selectedPlatform]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-normal tracking-wide black mb-2">文章管理</h1>
        <p className="text-lg text-gray-600 tracking-[0.2em] uppercase">Article Management</p>
      </div>

      <div className="mb-8 overflow-x-auto">
        <div className="flex gap-2">
          <button onClick={() => setSelectedPlatform('')} className={`px-4 py-2 rounded-full text-lg tracking-widest uppercase transition-all whitespace-nowrap ${selectedPlatform === '' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'}`}>全部</button>
          {Object.entries(platformNames).map(([key, name]) => (
            <button key={key} onClick={() => setSelectedPlatform(key)} className={`px-4 py-2 rounded-full text-lg tracking-widest uppercase transition-all whitespace-nowrap ${selectedPlatform === key ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'}`}>{name}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 bg-gray-100 rounded-full"></div></div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20 text-gray-600">暂无文章</div>
      ) : (
        <>
          <div className="space-y-3">
            {articles.map((article) => (
              <div key={article.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-gray-300 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 rounded-full text-[10px] tracking-widest uppercase bg-gray-50 text-gray-700 border border-gray-100">{platformNames[article.platform] || article.platform}</span>
                      {article.author && <span className="text-[10px] text-gray-500 uppercase tracking-widest">@{article.author}</span>}
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest">{formatDate(article.created_at)}</span>
                    </div>
                    <h3 className="text-lg font-normal black line-clamp-2 mb-2">{article.title}</h3>
                    {article.content && <p className="text-lg text-gray-600 line-clamp-2">{article.content}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div ref={loadMoreRef} className="mt-8">
            {loadingMore && <div className="flex justify-center py-8"><div className="w-6 h-6 bg-gray-100 rounded-full animate-spin"></div></div>}
            {!hasMore && articles.length > 0 && <div className="text-center py-8 text-gray-500 text-lg tracking-widest uppercase">已加载全部 {articles.length} 篇文章</div>}
          </div>
        </>
      )}
    </div>
  );
}
