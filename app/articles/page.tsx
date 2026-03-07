'use client';

import { useEffect, useState } from 'react';

interface Article {
  id: string;
  platform: string;
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

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, [selectedPlatform]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const url = selectedPlatform
        ? `/api/articles?platform=${selectedPlatform}&limit=100`
        : `/api/articles?limit=100`;
      
      const res = await fetch(url);
      const data = await res.json();
      setArticles(data.data || []);
    } catch (error) {
      console.error('Failed to fetch articles:', error);
    } finally {
      setLoading(false);
    }
  };

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

      {/* 平台切换 */}
      <div className="mb-6 flex gap-2 flex-wrap">
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

      {/* 文章列表 */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12 text-gray-500">暂无数据</div>
      ) : (
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
                    {platformNames[selectedArticle.platform]} • {formatDate(selectedArticle.created_at)}
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
