'use client';

import { useEffect, useState } from 'react';

interface PlatformStats {
  xiaohongshu: number;
  zhihu: number;
  wechat: number;
  x: number;
  reddit: number;
}

export default function Overview() {
  const [stats, setStats] = useState<PlatformStats>({ xiaohongshu: 0, zhihu: 0, wechat: 0, x: 0, reddit: 0 });
  const [hotspotsCount, setHotspotsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const platforms = ['xiaohongshu', 'zhihu', 'wechat', 'x', 'reddit'];
      const statsData: any = {};
      for (const platform of platforms) {
        const res = await fetch(`/api/articles?platform=${platform}&limit=1`);
        const data = await res.json();
        statsData[platform] = data.pagination?.total || 0;
      }
      setStats(statsData);
      const hotspotsRes = await fetch('/api/hotspots?limit=1');
      const hotspotsData = await hotspotsRes.json();
      setHotspotsCount(hotspotsData.pagination?.total || 0);
    } catch (error) { console.error('Failed to fetch stats:', error); }
    finally { setLoading(false); }
  };

  const totalArticles = Object.values(stats).reduce((a, b) => a + b, 0);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse"></div></div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">概览</h1>
        <p className="text-sm text-gray-400 tracking-[0.15em] uppercase">Dashboard Overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <StatCard title="热点资讯" count={hotspotsCount} icon="📰" />
        <StatCard title="文章总数" count={totalArticles} icon="📝" />
        <StatCard title="运营Agents" count={6} icon="🤖" />
      </div>

      <div className="mb-10">
        <h2 className="text-base font-semibold text-gray-500 uppercase tracking-[0.15em] mb-4">平台分布</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <PlatformCard title="小红书" count={stats.xiaohongshu} icon="📕" />
          <PlatformCard title="知乎" count={stats.zhihu} icon="💡" />
          <PlatformCard title="微信" count={stats.wechat} icon="💬" />
          <PlatformCard title="X" count={stats.x} icon="🐦" />
          <PlatformCard title="Reddit" count={stats.reddit} icon="🟠" />
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-gray-500 uppercase tracking-[0.15em] mb-4">快捷访问</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <QuickLink href="/hotspots" icon="📰" title="热点资讯" desc={`${hotspotsCount} 条资讯`} />
          <QuickLink href="/articles" icon="📝" title="文章管理" desc={`${totalArticles} 篇文章`} />
          <QuickLink href="/tags" icon="🏷️" title="标签管理" desc="内容标签" />
          <QuickLink href="/xhs" icon="📕" title="小红书研究" desc="热门笔记分析" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, count, icon }: { title: string; count: number; icon: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-gray-200 hover:shadow-sm transition-all group">
      <div className="flex items-center gap-4 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-lg border border-gray-100">
          <span className="opacity-60">{icon}</span>
        </div>
        <span className="text-3xl font-semibold text-gray-800">{count}</span>
      </div>
      <p className="text-sm tracking-widest text-gray-400 uppercase">{title}</p>
    </div>
  );
}

function PlatformCard({ title, count, icon }: { title: string; count: number; icon: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 hover:border-gray-200 hover:shadow-sm transition-all">
      <span className="text-base opacity-50">{icon}</span>
      <div>
        <p className="text-lg font-semibold text-gray-700">{count}</p>
        <p className="text-[10px] text-gray-400 tracking-widest uppercase">{title}</p>
      </div>
    </div>
  );
}

function QuickLink({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  return (
    <a href={href} className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-2xl hover:border-gray-300 hover:shadow-sm transition-all group">
      <span className="text-xl opacity-50 group-hover:opacity-70 transition-opacity">{icon}</span>
      <div>
        <p className="text-base font-medium text-gray-800 group-hover:text-gray-900 transition-colors">{title}</p>
        <p className="text-sm text-gray-400 mt-0.5">{desc}</p>
      </div>
    </a>
  );
}
