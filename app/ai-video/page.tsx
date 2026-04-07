'use client';

import { useEffect, useState } from 'react';

interface VideoItem {
  id: string;
  title: string;
  prompt: string;
  author?: string;
  author_url?: string;
  platform: string;
  model?: string;
  video_url?: string;
  source_url?: string;
  created_at: string;
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

export default function AiVideoPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, models: 0 });
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<Set<string>>(new Set());
  const [modelFilter, setModelFilter] = useState('all');

  useEffect(() => { fetchData(); }, [modelFilter]);

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '50' });
    if (modelFilter !== 'all') params.set('model', modelFilter);
    fetch(`/api/ai-video?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setVideos(data.data || []);
          const models = new Set((data.data || []).map((v: VideoItem) => v.model).filter(Boolean));
          setStats({ total: data.data?.length || 0, models: models.size });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };

  const copyPrompt = (id: string, prompt: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(prev => new Set(prev).add(id));
      setTimeout(() => setCopied(prev => { const s = new Set(prev); s.delete(id); return s; }), 2000);
    });
  };

  const allModels = Array.from(new Set(videos.map(v => v.model).filter(Boolean)));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-normal text-gray-900 mb-1">AI 视频</h1>
        <p className="text-lg text-gray-900 tracking-[0.2em] uppercase">AI Video Prompts</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-[10px] text-gray-900 uppercase tracking-widest mb-2">视频数</p>
          <p className="text-2xl font-normal text-gray-900">{loading ? '—' : stats.total}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-[10px] text-gray-900 uppercase tracking-widest mb-2">模型</p>
          <p className="text-2xl font-normal text-gray-900">{loading ? '—' : stats.models}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-[10px] text-gray-900 uppercase tracking-widest mb-2">数据来源</p>
          <p className="text-2xl font-normal text-gray-900 truncate text-sm">awesomevideoprompts</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-[10px] text-gray-900 uppercase tracking-widest mb-2">更新日期</p>
          <p className="text-2xl font-normal text-gray-900">{new Date().toLocaleDateString('zh-CN')}</p>
        </div>
      </div>

      {allModels.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          <button onClick={() => setModelFilter('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${modelFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50'}`}>全部</button>
          {allModels.map(m => (
            <button key={m} onClick={() => setModelFilter(m!)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${modelFilter === m ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50'}`}>{m}</button>
          ))}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-lg tracking-[0.2em] text-gray-900 uppercase">视频列表</h2>
          <span className="text-sm text-gray-900">{videos.length} 条</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600" />
          </div>
        ) : videos.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {videos.map((video, i) => {
              const isExpanded = expanded.has(video.id);
              return (
                <div key={video.id} className="px-6 py-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3 mb-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-900 flex items-center justify-center text-xs font-medium mt-0.5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-medium text-gray-900 leading-snug">{video.title}</h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {video.model && <span className="text-[10px] bg-gray-100 text-gray-900 px-2 py-0.5 rounded-full font-medium">{video.model}</span>}
                          <span className="text-[10px] text-gray-900 opacity-50">{timeAgo(video.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {video.author_url ? (
                          <a href={video.author_url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-900 hover:text-gray-700">@{video.author || 'unknown'}</a>
                        ) : (
                          <span className="text-xs text-gray-900">{video.author || 'Anonymous'}</span>
                        )}
                        {video.source_url && (
                          <a href={video.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-900 hover:text-gray-700 ml-1">↗ source</a>
                        )}
                        {video.video_url && (
                          <a href={video.video_url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-900 hover:text-gray-700 ml-1">▶ 观看视频</a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 展开后显示视频 + Prompt */}
                  {isExpanded ? (
                    <div className="mt-2 ml-9 space-y-3">
                      {/* 视频播放器 */}
                      {video.video_url && (
                        <div className="rounded-xl overflow-hidden bg-black">
                          <video
                            src={video.video_url}
                            controls
                            playsInline
                            className="w-full max-h-[400px]"
                          />
                        </div>
                      )}
                      <div className="text-xs text-gray-900 bg-gray-50 rounded-xl p-3">
                        <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed">{video.prompt}</pre>
                      </div>
                      <div className="flex items-center justify-between">
                        <button onClick={() => toggleExpand(video.id)} className="text-xs text-gray-900 hover:text-gray-700">收起 ↑</button>
                        <button onClick={() => copyPrompt(video.id, video.prompt)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${copied.has(video.id) ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-900 text-white hover:bg-gray-700'}`}>
                          {copied.has(video.id) ? '✅ 已复制' : '📋 复制 Prompt'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 ml-9 text-xs text-gray-900 bg-gray-50 rounded-xl p-3 cursor-pointer hover:bg-gray-100 transition-colors line-clamp-3" onClick={() => toggleExpand(video.id)}>
                      <pre className="whitespace-pre-wrap font-sans">{video.prompt.slice(0, 200)}{video.prompt.length > 200 ? '...' : ''}</pre>
                      <div className="text-center text-xs text-gray-900 mt-1 opacity-60">
                        {video.video_url ? '▶ 点击播放视频 + 查看完整Prompt ↓' : '点击展开Prompt ↓'}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <div className="text-4xl mb-4">🎬</div>
            <p className="text-lg text-gray-900 mb-2">暂无 AI 视频数据</p>
            <p className="text-base text-gray-900">运行 scripts/crawl-ai-videos.cjs 导入数据</p>
          </div>
        )}
      </div>
    </div>
  );
}
