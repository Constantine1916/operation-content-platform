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
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-light tracking-wide text-white/90 mb-2">标签管理</h1>
        <p className="text-xs text-white/30 tracking-[0.2em] uppercase">Tag Management</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border border-white/10 rounded-full bg-white/5 animate-pulse"></div>
        </div>
      ) : tags.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-center">
            <span className="text-2xl opacity-30">🏷️</span>
          </div>
          <p className="text-white/30 text-sm">暂无标签</p>
          <p className="text-white/20 text-xs mt-1">当文章包含标签时，这里会显示标签列表</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 hover:border-white/30 hover:bg-white/[0.04] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg filter grayscale opacity-30 group-hover:opacity-50 transition-opacity">🏷️</span>
                <span className="text-2xl font-light text-white/60">{tag.count}</span>
              </div>
              <h3 className="text-sm font-light text-white/70 truncate group-hover:text-white transition-colors">
                #{tag.name}
              </h3>
              <p className="text-[10px] text-white/30 mt-1">篇文章</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
