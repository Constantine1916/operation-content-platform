'use client';

import { useEffect, useState } from 'react';

interface Tag { id: string; name: string; count: number; }

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tags').then(r => r.json()).then(data => { setTags(data.data || []); setLoading(false); }).catch(console.error);
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-light tracking-wide text-gray-700 mb-2">标签管理</h1>
        <p className="text-xs text-gray-400 tracking-[0.2em] uppercase">Tag Management</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 bg-gray-100 rounded-full"></div></div>
      ) : tags.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center"><span className="text-2xl opacity-30">🏷️</span></div>
          <p className="text-gray-400 text-sm">暂无标签</p>
          <p className="text-gray-300 text-xs mt-1">当文章包含标签时，这里会显示标签列表</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {tags.map((tag) => (
            <div key={tag.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg opacity-30 group-hover:opacity-50 transition-opacity">🏷️</span>
                <span className="text-2xl font-light text-gray-700">{tag.count}</span>
              </div>
              <h3 className="text-sm font-light text-gray-600 truncate group-hover:text-gray-700 transition-colors">#{tag.name}</h3>
              <p className="text-[10px] text-gray-300 mt-1">篇文章</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
