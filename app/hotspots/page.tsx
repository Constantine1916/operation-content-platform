'use client';

import { useEffect, useState } from 'react';

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

export default function HotspotsPage() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHotspots();
    fetchCategories();
  }, [selectedCategory]);

  const fetchHotspots = async () => {
    setLoading(true);
    try {
      const url = selectedCategory
        ? `/api/hotspots?category=${encodeURIComponent(selectedCategory)}&limit=50`
        : `/api/hotspots?limit=50`;
      
      const res = await fetch(url);
      const data = await res.json();
      setHotspots(data.data || []);
    } catch (error) {
      console.error('Failed to fetch hotspots:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    // 从现有数据中提取所有分类
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

  const getHeatColor = (heat: string) => {
    switch (heat) {
      case '极高':
        return 'text-red-600 bg-red-50';
      case '高':
        return 'text-orange-600 bg-orange-50';
      case '中':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
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
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
        <div className="space-y-4">
          {hotspots.map((hotspot) => (
            <div
              key={hotspot.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {hotspot.热度 && (
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${getHeatColor(
                          hotspot.热度
                        )}`}
                      >
                        🔥 {hotspot.热度}
                      </span>
                    )}
                    {hotspot.category && (
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
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
                        className="hover:text-blue-600 transition-colors"
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
      )}
    </div>
  );
}
