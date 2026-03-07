'use client';

import { useEffect, useState } from 'react';

interface PlatformStats {
  xiaohongshu: number;
  zhihu: number;
  wechat: number;
  x: number;
  reddit: number;
}

export default function Home() {
  const [stats, setStats] = useState<PlatformStats>({
    xiaohongshu: 0,
    zhihu: 0,
    wechat: 0,
    x: 0,
    reddit: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 获取各平台文章数量
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
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const totalArticles = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">运营内容管理平台</h1>
        <p className="text-gray-600">聚合多平台热点内容，一站式管理</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard title="小红书" count={stats.xiaohongshu} icon="📕" color="bg-red-50" />
            <StatCard title="知乎" count={stats.zhihu} icon="💡" color="bg-blue-50" />
            <StatCard title="微信公众号" count={stats.wechat} icon="📱" color="bg-green-50" />
            <StatCard title="X (Twitter)" count={stats.x} icon="🐦" color="bg-sky-50" />
            <StatCard title="Reddit" count={stats.reddit} icon="🤖" color="bg-orange-50" />
          </div>

          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">数据概览</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{totalArticles}</div>
                <div className="text-sm text-gray-600 mt-1">总文章数</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">5</div>
                <div className="text-sm text-gray-600 mt-1">接入平台</div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">快速开始</h2>
            <ul className="space-y-2 text-gray-600">
              <li>• 点击侧边栏"热点资讯"查看最新内容</li>
              <li>• 使用"文章管理"进行内容管理</li>
              <li>• 多平台聚合，统一浏览</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ title, count, icon, color }: { title: string; count: number; icon: string; color: string }) {
  return (
    <div className={`${color} rounded-lg p-6 border border-gray-200`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-3xl font-bold text-gray-900">{count}</span>
      </div>
      <h3 className="text-sm font-medium text-gray-700">{title}</h3>
      <p className="text-xs text-gray-500 mt-1">篇文章</p>
    </div>
  );
}
