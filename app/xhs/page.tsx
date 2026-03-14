'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface KeywordStat {
  keyword: string;
  noteCount: number;
  totalLikes: number;
  totalCollects: number;
  totalComments: number;
  avgLikes: number;
  lastSearched: string;
}

interface TopNote {
  note_id: string;
  title: string;
  nickname: string;
  likes: number;
  collects: number;
  comments: number;
  shares: number;
  collect_like_ratio: number;
  keyword: string;
  cover_url: string;
  url: string;
}

function formatNumber(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return '刚刚';
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return `${Math.floor(days / 30)}个月前`;
}

export default function XhsPage() {
  const [keywords, setKeywords] = useState<KeywordStat[]>([]);
  const [topNotes, setTopNotes] = useState<TopNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/xhs/keywords').then(r => r.json()),
      fetch('/api/xhs/top-notes?limit=10').then(r => r.json()),
    ]).then(([kwData, topData]) => {
      setKeywords(kwData.data || []);
      setTopNotes(topData.data || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalNotes = keywords.reduce((s, k) => s + k.noteCount, 0);
  const totalLikes = keywords.reduce((s, k) => s + k.totalLikes, 0);
  const totalCollects = keywords.reduce((s, k) => s + k.totalCollects, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📕 小红书研究</h1>
          <p className="text-sm text-gray-500 mt-1">搜索历史 · 笔记排行 · 创作者分析</p>
        </div>
        <Link
          href="/xhs/creators"
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          查看创作者 →
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">关键词数</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{keywords.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">收录笔记</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{totalNotes}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">总点赞</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{formatNumber(totalLikes)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">总收藏</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{formatNumber(totalCollects)}</div>
        </div>
      </div>

      {/* Keywords */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">🔍 搜索关键词</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {keywords.map(kw => (
            <Link
              key={kw.keyword}
              href={`/xhs/search/${encodeURIComponent(kw.keyword)}`}
              className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium border border-gray-200">
                  {kw.keyword}
                </span>
                <span className="text-sm text-gray-500">{kw.noteCount} 条笔记</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>👍 {formatNumber(kw.totalLikes)}</span>
                <span>⭐ {formatNumber(kw.totalCollects)}</span>
                <span>💬 {formatNumber(kw.totalComments)}</span>
                <span className="text-xs">{timeAgo(kw.lastSearched)}</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
          {keywords.length === 0 && (
            <div className="px-6 py-12 text-center text-gray-400">
              暂无搜索记录，使用 redbook CLI 搜索后数据会自动出现
            </div>
          )}
        </div>
      </div>

      {/* Top Notes */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">🔥 TOP 笔记排行</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {topNotes.map((note, i) => (
            <div key={note.note_id} className="flex items-center gap-4 px-6 py-4">
              <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                i < 3 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {note.title || '无标题'}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  @{note.nickname} · {note.keyword}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 flex-shrink-0">
                <span>👍 {formatNumber(note.likes)}</span>
                <span>⭐ {formatNumber(note.collects)}</span>
                <span>💬 {formatNumber(note.comments)}</span>
                {note.collect_like_ratio && (
                  <span className={`px-2 py-0.5 rounded ${
                    note.collect_like_ratio > 50 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    收藏率 {note.collect_like_ratio}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
