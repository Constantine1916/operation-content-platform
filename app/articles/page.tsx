'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface Article { id: string; platform: string; author: string | null; title: string; content: string; created_at: string; }

const PAGE_SIZE = 20;
const platformNames: Record<string, string> = { xiaohongshu: '小红书', zhihu: '知乎', wechat: '微信公众号', x: 'X', reddit: 'Reddit' };

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setArticles([]); setPage(0); setHasMore(true); fetchArticles(0, true); }, [selectedPlatform]);
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) loadMore();
    }, { rootMargin: '100px', threshold: 0.1 });
    if (loadMoreRef.current) obs.observe(loadMoreRef.current);
    return () => obs.disconnect();
  }, [hasMore, loading, loadingMore, page]);

  const fetchArticles = async (pageNum: number, isFirst = false) => {
    if (isFirst) setLoading(true); else setLoadingMore(true);
    try {
      let url = `/api/articles?limit=${PAGE_SIZE}&page=${pageNum + 1}`;
      if (selectedPlatform) url += `&platform=${selectedPlatform}`;
      const result = await fetch(url).then(r => r.json());
      const items = result.data || [];
      if (items.length < PAGE_SIZE) setHasMore(false);
      setArticles(prev => pageNum === 0 ? items : [...prev, ...items]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setLoadingMore(false); }
  };

  const loadMore = useCallback(() => { const n = page + 1; setPage(n); fetchArticles(n, false); }, [page, selectedPlatform]);
  const formatDate = (d: string) => new Date(d).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">文章管理</h1>
        <p className="text-xs text-gray-400 tracking-[0.15em] uppercase">Article Management</p>
      </div>
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setSelectedPlatform('')} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${selectedPlatform === '' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'}`}>全部</button>
        {Object.entries(platformNames).map(([key, name]) => (
          <button key={key} onClick={() => setSelectedPlatform(key)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${selectedPlatform === key ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'}`}>{name}</button>
        ))}
      </div>
      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse"></div></div>
        : articles.length === 0 ? <div className="text-center py-20 text-gray-400 text-sm">暂无文章</div>
        : <>
          <div className="space-y-3">
            {articles.map((article) => (
              <div key={article.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-gray-300 hover:shadow-sm transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-50 text-gray-600 border border-gray-100">{platformNames[article.platform] || article.platform}</span>
                  {article.author && <span className="text-[11px] text-gray-400">@{article.author}</span>}
                  <span className="text-[11px] text-gray-400">{formatDate(article.created_at)}</span>
                </div>
                <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-1">{article.title}</h3>
                {article.content && <p className="text-xs text-gray-500 line-clamp-2">{article.content}</p>}
              </div>
            ))}
          </div>
          <div ref={loadMoreRef} className="mt-8">
            {loadingMore && <div className="flex justify-center py-8"><div className="w-6 h-6 bg-gray-100 rounded-full animate-spin"></div></div>}
            {!hasMore && <div className="text-center py-8 text-gray-300 text-xs">已加载全部 {articles.length} 篇文章</div>}
          </div>
        </>}
    </div>
  );
}
