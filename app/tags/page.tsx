'use client';

import { useEffect, useState } from 'react';

interface Tag {
  id: string;
  name: string;
  count: number;
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const res = await fetch('/api/tags');
      const data = await res.json();
      setTags(data.data || []);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🏷️ 标签管理</h1>
        <p className="text-gray-600">查看和管理文章标签</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : tags.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无标签</h3>
          <p className="text-gray-500">当文章包含标签时，这里会显示标签列表</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-400 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl filter grayscale">🏷️</span>
                  <span className="text-2xl font-bold text-gray-900">{tag.count}</span>
                </div>
                <h3 className="text-sm font-medium text-gray-700 truncate">
                  #{tag.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">篇文章</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
