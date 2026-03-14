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
  const [stats, setStats] = useState<PlatformStats>({
    xiaohongshu: 0,
    zhihu: 0,
    wechat: 0,
    x: 0,
    reddit: 0,
  });
  const [hotspotsCount, setHotspotsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

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
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalArticles = Object.values(stats).reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-8 h-8 border border-white/10 rounded-full bg-white/5"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-light tracking-wide text-white/90 mb-2">概览</h1>
        <p className="text-xs text-white/30 tracking-[0.2em] uppercase">Dashboard Overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <StatCard 
          title="热点资讯" 
          count={hotspotsCount} 
          icon="📰" 
        />
        <StatCard 
          title="文章总数" 
          count={totalArticles} 
          icon="📝" 
        />
        <StatCard 
          title="运营Agents" 
          count={6} 
          icon="🤖" 
        />
      </div>

      {/* Platform Stats */}
      <div className="mb-10">
        <h2 className="text-xs font-medium text-white/30 uppercase tracking-[0.2em] mb-4">平台分布</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <PlatformCard title="小红书" count={stats.xiaohongshu} icon="📕" />
          <PlatformCard title="知乎" count={stats.zhihu} icon="💡" />
          <PlatformCard title="微信" count={stats.wechat} icon="💬" />
          <PlatformCard title="X" count={stats.x} icon="🐦" />
          <PlatformCard title="Reddit" count={stats.reddit} icon="🟠" />
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-xs font-medium text-white/30 uppercase tracking-[0.2em] mb-4">快捷访问</h2>
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
    <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 hover:border-white/20 hover:bg-white/[0.04] transition-all group">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-xl border border-white/10 group-hover:border-white/20 transition-colors">
          <span className="filter grayscale opacity-50">{icon}</span>
        </div>
        <span className="text-4xl font-light text-white/80">{count}</span>
      </div>
      <p className="text-xs tracking-widest text-white/40 uppercase">{title}</p>
    </div>
  );
}

function PlatformCard({ title, count, icon }: { title: string; count: number; icon: string }) {
  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 flex items-center gap-3 hover:border-white/20 hover:bg-white/[0.04] transition-all">
      <span className="text-lg filter grayscale opacity-40">{icon}</span>
      <div>
        <p className="text-xl font-light text-white/60">{count}</p>
        <p className="text-[10px] text-white/30 tracking-widest uppercase">{title}</p>
      </div>
    </div>
  );
}

function QuickLink({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-4 p-5 bg-white/[0.02] border border-white/10 rounded-2xl hover:border-white/30 hover:bg-white/[0.04] transition-all group"
    >
      <span className="text-2xl filter grayscale opacity-40 group-hover:opacity-60 transition-opacity">{icon}</span>
      <div>
        <p className="text-sm font-light text-white/70 group-hover:text-white transition-colors">{title}</p>
        <p className="text-xs text-white/30">{desc}</p>
      </div>
    </a>
  );
}
