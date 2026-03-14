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
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}个月`;
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
        <div className="w-8 h-8 border border-white/10 rounded-full bg-white/5 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-light tracking-wide text-white/90 mb-2">小红书研究</h1>
        <p className="text-xs text-white/30 tracking-[0.2em] uppercase">Redbook Research</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard label="关键词" value={keywords.length} />
        <StatCard label="收录笔记" value={totalNotes} />
        <StatCard label="总点赞" value={formatNumber(totalLikes)} />
        <StatCard label="总收藏" value={formatNumber(totalCollects)} />
      </div>

      {/* Keywords */}
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-xs tracking-[0.2em] text-white/40 uppercase">搜索关键词</h2>
        </div>
        <div className="divide-y divide-white/5">
          {keywords.map((kw) => (
            <Link
              key={kw.keyword}
              href={`/xhs/search/${encodeURIComponent(kw.keyword)}`}
              className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 bg-white/5 text-white/60 text-xs rounded-full border border-white/10 group-hover:border-white/20 transition-colors">
                  {kw.keyword}
                </span>
                <span className="text-xs text-white/30">{kw.noteCount} 条笔记</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-white/30">
                <span>👍 {formatNumber(kw.totalLikes)}</span>
                <span>⭐ {formatNumber(kw.totalCollects)}</span>
                <span>💬 {formatNumber(kw.totalComments)}</span>
                <span className="opacity-50">{timeAgo(kw.lastSearched)}</span>
              </div>
            </Link>
          ))}
          {keywords.length === 0 && (
            <div className="px-6 py-12 text-center text-white/30 text-sm">
              暂无搜索记录，使用 redbook CLI 搜索后数据会自动出现
            </div>
          )}
        </div>
      </div>

      {/* Top Notes */}
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-xs tracking-[0.2em] text-white/40 uppercase">TOP 笔记排行</h2>
        </div>
        <div className="divide-y divide-white/5">
          {topNotes.map((note, i) => (
            <div key={note.note_id} className="flex items-center gap-4 px-6 py-4">
              <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-light ${
                i < 3 ? 'bg-white text-black' : 'bg-white/10 text-white/40'
              }`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white/70 truncate group-hover:text-white transition-colors">
                  {note.title || '无标题'}
                </div>
                <div className="text-[10px] text-white/30 mt-0.5">
                  @{note.nickname} · {note.keyword}
                </div>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-white/30 flex-shrink-0">
                <span>👍 {formatNumber(note.likes)}</span>
                <span>⭐ {formatNumber(note.collects)}</span>
                {note.collect_like_ratio && (
                  <span className={`px-2 py-0.5 rounded-full ${
                    note.collect_like_ratio > 50 ? 'bg-white/10 text-white/60' : 'bg-white/5 text-white/40'
                  }`}>
                    {note.collect_like_ratio}%
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

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5">
      <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">{label}</p>
      <p className="text-2xl font-light text-white/70">{value}</p>
    </div>
  );
}
