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

const platformNames: Record<string, string> = {
  xiaohongshu: '小红书',
  zhihu: '知乎',
  wechat: '微信公众号',
  x: 'X (Twitter)',
  reddit: 'Reddit',
};

const platformEmojis: Record<string, string> = {
  xiaohongshu: '📕',
  zhihu: '💡',
  wechat: '📱',
  x: '🐦',
  reddit: '🤖',
};

// 作者名称映射
const authorNames: Record<string, string> = {
  'xiaohongshu-1': '小红',
  'xiaohongshu-2': '小红2',
  'zhihu-1': '小知',
  'wechat-1': '小微',
  'x-1': '小X',
  'reddit-1': '小Reddit',
};

const authorEmojis: Record<string, string> = {
  'xiaohongshu-1': '📕',
  'xiaohongshu-2': '📕',
  'zhihu-1': '💡',
  'wechat-1': '📱',
  'x-1': '🐦',
  'reddit-1': '🤖',
};

const PAGE_SIZE = 30;

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [authors, setAuthors] = useState<string[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 提取所有唯一的作者
  useEffect(() => {
    const uniqueAuthors = [...new Set(articles.map(a => a.author).filter(Boolean))] as string[];
    setAuthors(uniqueAuthors);
  }, [articles]);

  // 重置状态并加载第一页
  useEffect(() => {
    setArticles([]);
    setPage(0);
    setHasMore(true);
    fetchArticles(0, true);
  }, [selectedPlatform, selectedAuthor]);

  // 设置滚动加载观察器
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

  const fetchArticles = async (pageNum: number, isFirstLoad = false) => {
    if (isFirstLoad) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const apiPage = pageNum + 1; // API uses 1-based page numbers
      let url = `/api/articles?limit=${PAGE_SIZE}&page=${apiPage}`;
      if (selectedPlatform) {
        url += `&platform=${selectedPlatform}`;
      }
      if (selectedAuthor) {
        url += `&author=${selectedAuthor}`;
      }
      
      const res = await fetch(url);
      const result = await res.json();
      const newArticles = result.data || [];

      if (newArticles.length < PAGE_SIZE) {
        setHasMore(false);
      }

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
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📝 文章管理</h1>
        <p className="text-gray-600">各平台运营agent产出的内容</p>
      </div>

      {/* 平台切换 - horizontal scroll on mobile */}
      <div className="mb-4 overflow-x-auto pb-2 -mx-4 px-4">
        <div className="flex gap-2 flex-nowrap">
          <button
          onClick={() => setSelectedPlatform('')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedPlatform === ''
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          全部平台
        </button>
        {Object.entries(platformNames).map(([key, name]) => (
          <button
            key={key}
            onClick={() => setSelectedPlatform(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              selectedPlatform === key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>{platformEmojis[key]}</span>
            <span>{name}</span>
          </button>
        ))}
      </div>

      {/* 作者筛选 - horizontal scroll on mobile */}
      {authors.length > 0 && (
        <div className="mb-6 overflow-x-auto pb-2 -mx-4 px-4">
          <div className="flex gap-2 flex-nowrap">
            <button
            onClick={() => setSelectedAuthor('')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedAuthor === ''
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            全部作者
          </button>
          {authors.map((author) => (
            <button
              key={author}
              onClick={() => setSelectedAuthor(author)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                selectedAuthor === author
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{authorEmojis[author] || '👤'}</span>
              <span>{authorNames[author] || author}</span>
            </button>
          ))}
        </div>
      )}

      {/* 文章列表 */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12 text-gray-500">暂无数据</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((article) => (
              <div
                key={article.id}
                className="bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedArticle(article)}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{platformEmojis[article.platform]}</span>
                  <span className="text-xs font-medium text-gray-500">
                    {platformNames[article.platform]}
                  </span>
                  {article.author && (
                    <>
                      <span className="text-gray-300">|</span>
                      <span className="text-xs font-medium text-purple-500">
                        {authorEmojis[article.author] || '👤'} {authorNames[article.author] || article.author}
                      </span>
                    </>
                  )}
                </div>

                <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
                  {article.title}
                </h3>

                <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                  {article.content.substring(0, 100)}...
                </p>

                <div className="text-xs text-gray-500">
                  📅 {formatDate(article.created_at)}
                </div>
              </div>
            ))}
          </div>

          {/* 滚动加载触发器 */}
          <div ref={loadMoreRef} className="mt-8">
            {loadingMore && (
              <div className="text-center py-4 text-gray-500">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2">加载更多...</p>
              </div>
            )}
            {!hasMore && articles.length > 0 && (
              <div className="text-center py-4 text-gray-400 text-sm">
                已加载全部 {articles.length} 篇文章
              </div>
            )}
          </div>
        </>
      )}

      {/* 文章详情弹窗 */}
      {selectedArticle && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedArticle(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{platformEmojis[selectedArticle.platform]}</span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedArticle.title}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {platformNames[selectedArticle.platform]}
                    {selectedArticle.author && (
                      <> • {authorEmojis[selectedArticle.author] || '👤'} {authorNames[selectedArticle.author] || selectedArticle.author}</>
                    )}
                     • {formatDate(selectedArticle.created_at)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-gray-700">
                {selectedArticle.content}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
