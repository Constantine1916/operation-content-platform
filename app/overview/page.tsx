'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AllStats {
  hotspots: number;
  articles: {
    total: number;
    xiaohongshu: number;
    zhihu: number;
    wechat: number;
    x: number;
    reddit: number;
  };
  images: number;
  videos: number;
}

const PLATFORM_LABELS: Record<string, string> = {
  xiaohongshu: '小红书',
  zhihu: '知乎',
  wechat: '微信',
  x: 'X',
  reddit: 'Reddit',
};

export default function Overview() {
  const [stats, setStats] = useState<AllStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllStats();
  }, []);

  const fetchAllStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const platforms = ['xiaohongshu', 'zhihu', 'wechat', 'x', 'reddit'] as const;

      const [hotspotsRes, videoRes, galleryRes, ...articleRess] = await Promise.all([
        fetch('/api/hotspots?limit=1'),
        fetch('/api/ai-video?limit=1'),
        token
          ? fetch('/api/gallery?limit=1', { headers: { Authorization: `Bearer ${token}` } })
          : Promise.resolve(null),
        ...platforms.map(p => fetch(`/api/articles?platform=${p}&limit=1`)),
      ]);

      const hotspotsData = await hotspotsRes.json();
      const videoData = await videoRes.json();
      const galleryData = galleryRes ? await galleryRes.json() : { total: 0 };

      const articleCounts: Record<string, number> = {};
      for (let i = 0; i < platforms.length; i++) {
        const d = await articleRess[i].json();
        articleCounts[platforms[i]] = d.pagination?.total ?? 0;
      }

      const articleTotal = Object.values(articleCounts).reduce((a, b) => a + b, 0);

      setStats({
        hotspots: hotspotsData.pagination?.total ?? 0,
        articles: {
          total: articleTotal,
          xiaohongshu: articleCounts.xiaohongshu,
          zhihu: articleCounts.zhihu,
          wechat: articleCounts.wechat,
          x: articleCounts.x,
          reddit: articleCounts.reddit,
        },
        images: galleryData.total ?? 0,
        videos: videoData.pagination?.total ?? 0,
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
        <div className="h-7 w-16 bg-gray-100 rounded-lg mb-10" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl" />)}
        </div>
        <div className="h-48 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  if (!stats) return null;

  const resources = [
    { key: 'hotspots', label: 'AI 资讯', icon: '📡', count: stats.hotspots, desc: '每 2 小时自动采集' },
    { key: 'articles', label: 'AI 文章', icon: '📝', count: stats.articles.total, desc: '多平台内容聚合' },
    { key: 'images',   label: 'AI 图片', icon: '🖼️', count: stats.images,   desc: '创作者公开作品' },
    { key: 'videos',   label: 'AI 视频', icon: '🎬', count: stats.videos,   desc: '持续扩充中' },
  ];

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-12">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">概览</h1>
        <p className="text-sm text-gray-400 tracking-[0.12em] uppercase">Dashboard Overview</p>
      </div>

      {/* 四大资源类型统计 */}
      <div className="mb-4">
        <h2 className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.2em] mb-4">内容总量</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {resources.map(r => (
            <ResourceCard key={r.key} label={r.label} icon={r.icon} count={r.count} desc={r.desc} />
          ))}
        </div>
      </div>

      {/* 文章平台分布 */}
      <div className="mt-10">
        <h2 className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.2em] mb-4">文章平台分布</h2>
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          {Object.entries(PLATFORM_LABELS).map(([key, name], idx, arr) => {
            const count = stats.articles[key as keyof typeof stats.articles] as number;
            const pct = stats.articles.total > 0
              ? Math.round((count / stats.articles.total) * 100)
              : 0;
            const isLast = idx === arr.length - 1;
            return (
              <div
                key={key}
                className={`flex items-center gap-4 px-6 py-4 ${!isLast ? 'border-b border-gray-50' : ''}`}
              >
                <span className="w-16 text-sm font-medium text-gray-700 flex-shrink-0">{name}</span>
                <div className="flex-1">
                  <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-900 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <span className="w-12 text-right text-sm font-semibold text-gray-900 flex-shrink-0">{count.toLocaleString()}</span>
                <span className="w-10 text-right text-xs text-gray-400 flex-shrink-0">{pct}%</span>
              </div>
            );
          })}
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50">
            <span className="text-[11px] text-gray-400 uppercase tracking-widest">合计</span>
            <span className="text-sm font-semibold text-gray-900">{stats.articles.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

    </div>
  );
}

function ResourceCard({
  label, icon, count, desc,
}: {
  label: string; icon: string; count: number; desc: string;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-gray-300 hover:shadow-sm transition-all">
      <div className="text-2xl mb-4">{icon}</div>
      <div className="text-[28px] font-bold text-gray-900 leading-none mb-1">
        {count.toLocaleString()}
      </div>
      <div className="text-[13px] font-medium text-gray-700 mb-0.5">{label}</div>
      <div className="text-[11px] text-gray-400">{desc}</div>
    </div>
  );
}
