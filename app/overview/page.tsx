'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AuthLayout from '@/components/AuthLayout';

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

function OverviewPageContent() {
  const [stats, setStats] = useState<AllStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllStats();
  }, []);

  const fetchAllStats = async () => {
    try {
      const platforms = ['xiaohongshu', 'zhihu', 'wechat', 'x', 'reddit'] as const;

      const [hotspotsRes, videoRes, galleryRes, ...articleRess] = await Promise.all([
        fetch('/api/hotspots?limit=1'),
        fetch('/api/ai-video?limit=1'),
        fetch('/api/gallery?limit=1'),
        ...platforms.map(p => fetch(`/api/articles?platform=${p}&limit=1`)),
      ]);

      const hotspotsData = await hotspotsRes.json();
      const videoData = await videoRes.json();
      const galleryData = await galleryRes.json();

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
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl" />)}
        </div>
        <div className="h-48 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  if (!stats) return null;

  const resources = [
    { key: 'hotspots', label: 'AI 资讯', icon: '📡', count: stats.hotspots, desc: '每 2 小时自动采集', href: '/hotspots' },
    { key: 'articles', label: 'AI 文章', icon: '📝', count: stats.articles.total, desc: '多平台内容聚合', href: '/articles' },
    { key: 'images',   label: 'AI 图片', icon: '🖼️', count: stats.images,   desc: '创作者公开作品', href: '/ai-gallery' },
    { key: 'videos',   label: 'AI 视频', icon: '🎬', count: stats.videos,   desc: '持续扩充中', href: '/ai-video' },
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
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {resources.map(r => (
            <ResourceCard
              key={r.key}
              label={r.label}
              icon={r.icon}
              count={r.count}
              desc={r.desc}
              href={r.href}
            />
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
                className={`flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6 ${!isLast ? 'border-b border-gray-50' : ''}`}
              >
                <span className="w-12 flex-shrink-0 text-xs font-medium text-gray-700 sm:w-16 sm:text-sm">{name}</span>
                <div className="flex-1">
                  <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-900 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <span className="w-10 flex-shrink-0 text-right text-xs font-semibold text-gray-900 sm:w-12 sm:text-sm">{count.toLocaleString()}</span>
                <span className="w-8 flex-shrink-0 text-right text-[11px] text-gray-400 sm:w-10 sm:text-xs">{pct}%</span>
              </div>
            );
          })}
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-3 sm:px-6">
            <span className="text-[11px] text-gray-400 uppercase tracking-widest">合计</span>
            <span className="text-sm font-semibold text-gray-900">{stats.articles.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

    </div>
  );
}

export default function OverviewPage() {
  return (
    <AuthLayout>
      <OverviewPageContent />
    </AuthLayout>
  );
}

function ResourceCard({
  label, icon, count, desc, href,
}: {
  label: string;
  icon: string;
  count: number;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 sm:p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="text-2xl">{icon}</div>
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-all group-hover:bg-gray-900 group-hover:text-white">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
      <div className="mb-1 text-2xl font-bold leading-none text-gray-900 sm:text-[28px]">
        {count.toLocaleString()}
      </div>
      <div className="mb-0.5 text-[13px] font-medium text-gray-700">{label}</div>
      <div className="text-[11px] text-gray-400">{desc}</div>
    </Link>
  );
}
