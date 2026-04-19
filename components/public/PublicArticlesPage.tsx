'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import FavoriteButton from '@/components/favorites/FavoriteButton';
import { useFavoriteStatuses } from '@/components/favorites/useFavoriteStatuses';
import { useFavoriteToggle } from '@/components/favorites/useFavoriteToggle';
import { getFavoriteButtonState } from '@/lib/favorite-view-model';
import type { PublicArticle } from '@/lib/server/public-content';

const PAGE_SIZE = 20;
const platformNames: Record<string, string> = { xiaohongshu: '小红书', zhihu: '知乎', wechat: '微信公众号', x: 'X', reddit: 'Reddit' };
const platformColors: Record<string, string> = { xiaohongshu: 'bg-red-50 text-red-600 border-red-100', zhihu: 'bg-blue-50 text-blue-600 border-blue-100', wechat: 'bg-green-50 text-green-600 border-green-100', x: 'bg-gray-50 text-gray-900 border-gray-200', reddit: 'bg-orange-50 text-orange-600 border-orange-100' };
const allAuthors = ['xiaohongshu-1', 'xiaohongshu-2', 'zhihu-1', 'wechat-1', 'x-1', 'reddit-1'];

export default function PublicArticlesPage({
  initialArticles,
  initialHasMore,
}: {
  initialArticles: PublicArticle[];
  initialHasMore: boolean;
}) {
  const [articles, setArticles] = useState<PublicArticle[]>(initialArticles);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(0);
  const [selectedArticle, setSelectedArticle] = useState<PublicArticle | null>(null);
  const [copied, setCopied] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const hasMountedRef = useRef(false);
  const { favoriteIds, setFavoriteIds } = useFavoriteStatuses('article', articles.map(article => article.id));
  const { pendingIds, toggleFavorite } = useFavoriteToggle({
    contentType: 'article',
    setFavoriteIds,
  });

  const fetchArticles = useCallback(async (pageNum: number, isFirst = false) => {
    if (isFirst) setLoading(true); else setLoadingMore(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        page: String(pageNum + 1),
      });

      if (selectedPlatform) params.set('platform', selectedPlatform);
      if (selectedAuthor) params.set('author', selectedAuthor);

      const result = await fetch(`/api/articles?${params}`).then(r => r.json());
      const items = result.data || [];

      setHasMore((result.pagination?.page ?? 1) < (result.pagination?.totalPages ?? 1));
      setArticles(prev => pageNum === 0 ? items : [...prev, ...items]);
    } catch (error) {
      console.error(error);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedAuthor, selectedPlatform]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    setArticles([]);
    setPage(0);
    setHasMore(true);
    void fetchArticles(0, true);
  }, [fetchArticles]);

  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
        void loadMore();
      }
    }, { rootMargin: '100px', threshold: 0.1 });

    if (loadMoreRef.current) obs.observe(loadMoreRef.current);
    return () => obs.disconnect();
  }, [hasMore, loading, loadingMore, page]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedArticle(null);
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const loadMore = useCallback(async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchArticles(nextPage, false);
  }, [fetchArticles, page]);

  const formatDate = (value: string) => new Date(value).toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleCopy = (article: PublicArticle) => {
    const text = `${article.title}\n\n${article.content || ''}`.trim();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">AI 文章</h1>
        <p className="text-xs text-gray-500 tracking-[0.15em] uppercase">Article Management</p>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setSelectedPlatform('')} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${selectedPlatform === '' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900 border border-gray-200 hover:border-gray-400'}`}>全部</button>
        {Object.entries(platformNames).map(([key, name]) => (
          <button key={key} onClick={() => setSelectedPlatform(key)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${selectedPlatform === key ? 'bg-gray-900 text-white' : 'bg-white text-gray-900 border border-gray-200 hover:border-gray-400'}`}>{name}</button>
        ))}
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setSelectedAuthor('')} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${selectedAuthor === '' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900 border border-gray-200 hover:border-gray-400'}`}>全部作者</button>
        {allAuthors.map((author) => (
          <button key={author} onClick={() => setSelectedAuthor(author)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${selectedAuthor === author ? 'bg-gray-900 text-white' : 'bg-white text-gray-900 border border-gray-200 hover:border-gray-400'}`}>@{author}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse" /></div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20 text-gray-900 text-sm">暂无文章</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {articles.map((article) => (
              <div
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className="group flex cursor-pointer flex-col rounded-2xl border border-gray-200 bg-white p-4 transition-all hover:border-gray-500 hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${platformColors[article.platform] || 'bg-gray-50 text-gray-900 border-gray-200'}`}>
                      {platformNames[article.platform] || article.platform}
                    </span>
                    <span className="text-[10px] text-gray-500">{formatDate(article.created_at)}</span>
                  </div>
                  <FavoriteButton
                    isFavorite={getFavoriteButtonState(article.id, favoriteIds, pendingIds).isFavorite}
                    isPending={getFavoriteButtonState(article.id, favoriteIds, pendingIds).isPending}
                    onToggle={() => toggleFavorite(article.id, !favoriteIds.has(article.id))}
                    className="flex-shrink-0"
                  />
                </div>

                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-black line-clamp-3 flex-1 mb-3">
                  {article.title}
                </h3>

                {article.content && (
                  <p className="text-xs text-gray-900 line-clamp-2 mb-3">{article.content}</p>
                )}

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                  <span className="text-[10px] text-gray-900">{article.author ? `@${article.author}` : '—'}</span>
                  <span className="text-[10px] text-gray-900 group-hover:text-gray-900 transition-colors">阅读全文 →</span>
                </div>
              </div>
            ))}
          </div>

          <div ref={loadMoreRef} className="mt-4">
            {loadingMore && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex flex-col rounded-2xl border border-gray-200 bg-white p-4 animate-pulse">
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-4 w-14 bg-gray-100 rounded-full" />
                      <div className="h-3 w-12 bg-gray-100 rounded-full" />
                    </div>
                    <div className="h-4 w-full bg-gray-100 rounded-lg mb-2" />
                    <div className="h-4 w-4/5 bg-gray-100 rounded-lg mb-2" />
                    <div className="h-4 w-2/3 bg-gray-100 rounded-lg mb-3 flex-1" />
                    <div className="border-t border-gray-50 pt-2 flex justify-between">
                      <div className="h-3 w-16 bg-gray-100 rounded-full" />
                      <div className="h-3 w-12 bg-gray-100 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!hasMore && articles.length > 0 && (
              <div className="flex items-center gap-3 justify-center py-8">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">已加载全部 {articles.length} 篇文章</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
            )}
          </div>
        </>
      )}

      {selectedArticle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm sm:p-4"
          onClick={(event) => { if (event.target === event.currentTarget) setSelectedArticle(null); }}
        >
          <div className="flex max-h-[90svh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex flex-col gap-3 border-b border-gray-200 px-4 pb-4 pt-4 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:pt-6">
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
              <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0">
                <FavoriteButton
                  isFavorite={selectedArticle ? favoriteIds.has(selectedArticle.id) : false}
                  isPending={selectedArticle ? pendingIds.has(selectedArticle.id) : false}
                  onToggle={() => {
                    if (!selectedArticle) return;
                    toggleFavorite(selectedArticle.id, !favoriteIds.has(selectedArticle.id));
                  }}
                />
                <button
                  onClick={() => handleCopy(selectedArticle)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    copied
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-900 hover:text-white border border-gray-200'
                  }`}
                >
                  {copied ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      已复制
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      一键复制
                    </>
                  )}
                </button>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-gray-700 hover:text-gray-900"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
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
