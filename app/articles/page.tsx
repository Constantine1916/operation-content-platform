'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface Article { id: string; platform: string; author: string | null; title: string; content: string; created_at: string; }

const PAGE_SIZE = 20;
const platformNames: Record<string, string> = { xiaohongshu: '小红书', zhihu: '知乎', wechat: '微信公众号', x: 'X', reddit: 'Reddit' };
const platformColors: Record<string, string> = { xiaohongshu: 'bg-red-50 text-red-600 border-red-100', zhihu: 'bg-blue-50 text-blue-600 border-blue-100', wechat: 'bg-green-50 text-green-600 border-green-100', x: 'bg-gray-50 text-gray-900 border-gray-200', reddit: 'bg-orange-50 text-orange-600 border-orange-100' };

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setArticles([]); setPage(0); setHasMore(true); fetchArticles(0, true); }, [selectedPlatform]);

  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) loadMore();
    }, { rootMargin: '100px', threshold: 0.1 });
    if (loadMoreRef.current) obs.observe(loadMoreRef.current);
    return () => obs.disconnect();
  }, [hasMore, loading, loadingMore, page]);

  // 按 ESC 关闭弹窗
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedArticle(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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
  const formatDate = (d: string) => new Date(d).toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">文章管理</h1>
        <p className="text-xs text-gray-500 tracking-[0.15em] uppercase">Article Management</p>
      </div>

      {/* Platform Filter */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setSelectedPlatform('')} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${selectedPlatform === '' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900 border border-gray-200 hover:border-gray-400'}`}>全部</button>
        {Object.entries(platformNames).map(([key, name]) => (
          <button key={key} onClick={() => setSelectedPlatform(key)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${selectedPlatform === key ? 'bg-gray-900 text-white' : 'bg-white text-gray-900 border border-gray-200 hover:border-gray-400'}`}>{name}</button>
        ))}
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse"></div></div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20 text-gray-900 text-sm">暂无文章</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {articles.map((article) => (
              <div
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className="bg-white border border-gray-200 rounded-2xl p-4 hover:border-gray-500 hover:shadow-md transition-all cursor-pointer group flex flex-col"
              >
                {/* Platform badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${platformColors[article.platform] || 'bg-gray-50 text-gray-900 border-gray-200'}`}>
                    {platformNames[article.platform] || article.platform}
                  </span>
                  <span className="text-[10px] text-gray-500">{formatDate(article.created_at)}</span>
                </div>

                {/* Title */}
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-black line-clamp-3 flex-1 mb-3">
                  {article.title}
                </h3>

                {/* Preview */}
                {article.content && (
                  <p className="text-xs text-gray-900 line-clamp-2 mb-3">{article.content}</p>
                )}

                {/* Author & Read more */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                  <span className="text-[10px] text-gray-900">{article.author ? `@${article.author}` : '—'}</span>
                  <span className="text-[10px] text-gray-900 group-hover:text-gray-900 transition-colors">阅读全文 →</span>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          <div ref={loadMoreRef} className="mt-4">
            {loadingMore && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 animate-pulse flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-4 w-14 bg-gray-100 rounded-full"></div>
                      <div className="h-3 w-12 bg-gray-100 rounded-full"></div>
                    </div>
                    <div className="h-4 w-full bg-gray-100 rounded-lg mb-2"></div>
                    <div className="h-4 w-4/5 bg-gray-100 rounded-lg mb-2"></div>
                    <div className="h-4 w-2/3 bg-gray-100 rounded-lg mb-3 flex-1"></div>
                    <div className="border-t border-gray-50 pt-2 flex justify-between">
                      <div className="h-3 w-16 bg-gray-100 rounded-full"></div>
                      <div className="h-3 w-12 bg-gray-100 rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!hasMore && articles.length > 0 && (
              <div className="flex items-center gap-3 justify-center py-8">
                <div className="flex-1 h-px bg-gray-100"></div>
                <span className="text-xs text-gray-400">已加载全部 {articles.length} 篇文章</span>
                <div className="flex-1 h-px bg-gray-100"></div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Article Modal */}
      {selectedArticle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedArticle(null); }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-200 flex items-start justify-between gap-4 flex-shrink-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${platformColors[selectedArticle.platform] || 'bg-gray-50 text-gray-900 border-gray-200'}`}>
                    {platformNames[selectedArticle.platform] || selectedArticle.platform}
                  </span>
                  {selectedArticle.author && <span className="text-xs text-gray-900">@{selectedArticle.author}</span>}
                  <span className="text-xs text-gray-900">{formatDate(selectedArticle.created_at)}</span>
                </div>
                <h2 className="text-base font-semibold text-gray-900 leading-snug">{selectedArticle.title}</h2>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-gray-900 hover:text-gray-900"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {selectedArticle.content ? (
                <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">{selectedArticle.content}</p>
              ) : (
                <p className="text-sm text-gray-900 text-center py-8">暂无正文内容</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
