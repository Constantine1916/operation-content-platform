'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface NoteItem {
  note_id: string;
  title: string;
  nickname: string;
  user_id: string;
  likes: number;
  collects: number;
  comments: number;
  shares: number;
  collect_like_ratio: number;
  comment_like_ratio: number;
  rank_position: number;
  cover_url: string;
  url: string;
  snapshot_at: string;
}

function formatNumber(n: number): string {
  if (!n) return '0';
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

export default function SearchKeywordPage() {
  const params = useParams();
  const keyword = decodeURIComponent(params.keyword as string);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('likes');
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [importing, setImporting] = useState<Set<string>>(new Set());

  const fetchData = (page = 1) => {
    setLoading(true);
    fetch(`/api/xhs/search-history?keyword=${encodeURIComponent(keyword)}&sort=${sort}&page=${page}&limit=20`)
      .then(r => r.json())
      .then(data => {
        setNotes(data.data || []);
        setPagination(data.pagination || { page: 1, total: 0, totalPages: 0 });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [keyword, sort]);

  const handleImport = async (noteId: string) => {
    setImporting(prev => new Set(prev).add(noteId));
    try {
      const res = await fetch('/api/xhs/import-to-articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteIds: [noteId] }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`已导入 ${data.imported} 条到文章库`);
      } else {
        alert('导入失败: ' + (data.error || '未知错误'));
      }
    } catch (e) {
      alert('导入失败');
    }
    setImporting(prev => { const s = new Set(prev); s.delete(noteId); return s; });
  };

  const totalLikes = notes.reduce((s, n) => s + (n.likes || 0), 0);
  const totalCollects = notes.reduce((s, n) => s + (n.collects || 0), 0);
  const avgCollectRatio = notes.length > 0
    ? (totalCollects / Math.max(totalLikes, 1) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/xhs" className="gray-600 hover:gray-800">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-gray-800">
            <span className="filter grayscale">🔍</span> {keyword}
          </h1>
          <p className="text-lg text-gray-700">{pagination.total} 条笔记</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-lg text-gray-700">笔记数</div>
          <div className="text-2xl font-bold mt-1">{pagination.total}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-lg text-gray-700">总点赞</div>
          <div className="text-2xl font-bold mt-1">{formatNumber(totalLikes)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-lg text-gray-700">总收藏</div>
          <div className="text-2xl font-bold mt-1">{formatNumber(totalCollects)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-lg text-gray-700">平均收藏率</div>
          <div className="text-2xl font-bold mt-1">{avgCollectRatio}%</div>
        </div>
      </div>

      {/* Sort Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'likes', label: '按点赞' },
          { key: 'collects', label: '按收藏' },
          { key: 'comments', label: '按评论' },
          { key: 'collect_ratio', label: '按收藏率' },
          { key: 'rank', label: '按排名' },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setSort(s.key)}
            className={`px-3 py-1.5 rounded-lg text-lg font-medium transition-colors ${
              sort === s.key
                ? 'bg-gray-900 text-white'
                : 'gray-700 hover:bg-gray-100'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Notes Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600" />
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 text-lg text-gray-700 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">笔记</th>
                <th className="px-4 py-3 text-left">作者</th>
                <th className="px-4 py-3 text-right">👍 点赞</th>
                <th className="px-4 py-3 text-right">⭐ 收藏</th>
                <th className="px-4 py-3 text-right">💬 评论</th>
                <th className="px-4 py-3 text-right">收藏率</th>
                <th className="px-4 py-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {notes.map((note, i) => (
                <tr key={note.note_id + '-' + i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-lg text-gray-600">{i + 1}</td>
                  <td className="px-4 py-3">
                    <a
                      href={note.url || `https://www.xiaohongshu.com/explore/${note.note_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-medium text-black hover:gray-800 line-clamp-1"
                    >
                      {note.title || '无标题'}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-lg text-gray-700">@{note.nickname}</td>
                  <td className="px-4 py-3 text-lg text-right font-medium">{formatNumber(note.likes)}</td>
                  <td className="px-4 py-3 text-lg text-right font-medium">{formatNumber(note.collects)}</td>
                  <td className="px-4 py-3 text-lg text-right font-medium">{formatNumber(note.comments)}</td>
                  <td className="px-4 py-3 text-lg text-right">
                    <span className={`px-2 py-0.5 rounded text-lg ${
                      note.collect_like_ratio && note.collect_like_ratio > 50
                        ? 'bg-gray-900 text-white font-medium'
                        : 'gray-700'
                    }`}>
                      {note.collect_like_ratio ? note.collect_like_ratio + '%' : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleImport(note.note_id)}
                      disabled={importing.has(note.note_id)}
                      className="px-2 py-1 text-lg bg-gray-900 text-white rounded hover:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                      {importing.has(note.note_id) ? '导入中...' : '导入'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => fetchData(p)}
              className={`px-3 py-1 rounded text-lg ${
                p === pagination.page
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 black hover:bg-gray-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
