'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Creator {
  user_id: string;
  nickname: string;
  avatar_url: string | null;
  noteCount: number;
  totalLikes: number;
  totalCollects: number;
  totalComments: number;
}

function formatNumber(n: number): string {
  if (!n) return '0';
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/xhs/creators')
      .then(r => r.json())
      .then(data => setCreators(data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/xhs" className="gray-600 hover:gray-800">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-gray-800">👥 创作者排行</h1>
          <p className="text-lg text-gray-700">{creators.length} 位创作者</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-lg text-gray-700 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">创作者</th>
              <th className="px-4 py-3 text-right">笔记数</th>
              <th className="px-4 py-3 text-right">总点赞</th>
              <th className="px-4 py-3 text-right">总收藏</th>
              <th className="px-4 py-3 text-right">总评论</th>
              <th className="px-4 py-3 text-right">篇均点赞</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {creators.map((c, i) => (
              <tr key={c.user_id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-lg font-bold ${
                    i < 3 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {i + 1}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-white text-lg font-bold">
                      {(c.nickname || '?').charAt(0)}
                    </div>
                    <span className="text-lg font-medium text-text-gray-800">{c.nickname}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-lg text-right">{c.noteCount}</td>
                <td className="px-4 py-3 text-lg text-right font-medium text-text-gray-800">
                  {formatNumber(c.totalLikes)}
                </td>
                <td className="px-4 py-3 text-lg text-right font-medium text-text-gray-800">
                  {formatNumber(c.totalCollects)}
                </td>
                <td className="px-4 py-3 text-lg text-right">
                  {formatNumber(c.totalComments)}
                </td>
                <td className="px-4 py-3 text-lg text-right text-gray-700">
                  {formatNumber(Math.round(c.totalLikes / Math.max(c.noteCount, 1)))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {creators.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-600">
            暂无创作者数据
          </div>
        )}
      </div>
    </div>
  );
}
