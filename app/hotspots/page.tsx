'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Article {
  id: string;
  title: string;
  content: string;
  source_platform: string;
  author: string;
  published_at: string;
  tags: string[];
  热度: number;
}

const platformNames: Record<string, string> = {
  xiaohongshu: '小红书',
  zhihu: '知乎',
  wechat: '微信',
  x: 'X',
  reddit: 'Reddit',
};

const platformColors: Record<string, string> = {
  xiaohongshu: 'bg-red-100 text-red-700',
  zhihu: 'bg-blue-100 text-blue-700',
  wechat: 'bg-green-100 text-green-700',
  x: 'bg-sky-100 text-sky-700',
  reddit: 'bg-orange-100 text-orange-700',
};

export default function HotspotsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');

  useEffect(() => {
    fetchArticles();
  }, [selectedPlatform]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const url = selectedPlatform
        ? `/api/articles?platform=${selectedPlatform}&sort=热度&limit=20`
        : `/api/articles?sort=热度&limit=20`;
      
      const res = await fetch(url);
      const data = await res.json();
      setArticles(data.data || []);
    } catch (error) {
      console.error('Failed to fetch articles:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">热点资讯</h1>
        <p className="text-gray-600">按热度排序，实时追踪各平台热门内容</p>
      </div>

      {/* 平台筛选 */}
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
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPlatform === key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* 文章列表 */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          暂无数据
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article, index) => (
            <div
              key={article.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl font-bold text-red-500">#{index + 1}</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        platformColors[article.source_platform]
                      }`}
                    >
                      {platformNames[article.source_platform]}
                    </span>
                    <span className="flex items-center text-sm text-gray-500">
                      🔥 {article.热度.toLocaleString()}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {article.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {article.content}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {article.author && (
                      <span>👤 {article.author}</span>
                    )}
                    {article.published_at && (
                      <span>
                        📅 {new Date(article.published_at).toLocaleDateString('zh-CN')}
                      </span>
                    )}
                  </div>

                  {article.tags && article.tags.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {article.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
