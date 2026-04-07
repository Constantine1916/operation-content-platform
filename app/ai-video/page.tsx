'use client';

import { useEffect, useState, useRef } from 'react';

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
  const [copied, setCopied] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [modelFilter, setModelFilter] = useState('all');
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  useEffect(() => { fetchData(); }, [modelFilter]);

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '50' });
    if (modelFilter !== 'all') params.set('model', modelFilter);
    fetch(`/api/ai-video?${params.toString()}`)
      .then(r => r.json())
      .then(data => { if (data.success) setVideos(data.data || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const copyPrompt = (id: string, prompt: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const allModels = Array.from(new Set(videos.map(v => v.model).filter(Boolean)));

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 pt-10 pb-6">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-2xl font-normal text-gray-900 mb-0.5">AI 视频</h1>
            <p className="text-sm text-gray-400 tracking-[0.2em] uppercase">AI Video Prompts</p>
          </div>
          <div className="flex gap-8 text-right">
            <div>
              <p className="text-2xl font-normal text-gray-900">{loading ? '—' : videos.length}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">视频</p>
            </div>
            <div>
              <p className="text-2xl font-normal text-gray-900">{loading ? '—' : allModels.length}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">模型</p>
            </div>
          </div>
        </div>

        {/* Model filter */}
        {allModels.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setModelFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${modelFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >全部</button>
            {allModels.map(m => (
              <button
                key={m}
                onClick={() => setModelFilter(m!)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${modelFilter === m ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >{m}</button>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400" />
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <p className="text-lg">暂无数据</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {videos.map(video => (
              <div
                key={video.id}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer"
                onMouseEnter={() => {
                  setHoveredId(video.id);
                  const v = videoRefs.current[video.id];
                  if (v) { v.currentTime = 0; v.play().catch(() => {}); }
                }}
                onMouseLeave={() => {
                  setHoveredId(null);
                  const v = videoRefs.current[video.id];
                  if (v) { v.pause(); v.currentTime = 0; }
                }}
              >
                {/* Video area */}
                <div className="relative aspect-[9/16] bg-black/5 overflow-hidden">
                  {video.video_url ? (
                    <>
                      <video
                        ref={el => { videoRefs.current[video.id] = el; }}
                        src={video.video_url}
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover transition-opacity duration-300"
                        style={{ opacity: 1 }}
                      />
                      {/* Play icon */}
                      <div
                        className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
                        style={{ opacity: hoveredId === video.id ? 0 : 1, pointerEvents: hoveredId === video.id ? 'none' : 'auto' }}
                      >
                        <div className="w-12 h-12 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center shadow-sm">
                          <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                      {/* Model badge */}
                      {video.model && (
                        <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white/90 text-[10px] px-2 py-0.5 rounded-full">{video.model}</div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">无视频</div>
                  )}
                </div>

                {/* Info area */}
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-900 leading-snug mb-2 line-clamp-2">{video.title}</h3>

                  {/* Prompt copy block */}
                  <div
                    className="bg-[#fafafa] rounded-xl p-3 hover:bg-gray-100 transition-colors"
                    onClick={e => copyPrompt(video.id, video.prompt, e)}
                  >
                    <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-3 font-mono">{video.prompt.slice(0, 100)}...</p>
                    <div className={`mt-2 text-[11px] font-medium transition-colors ${copied === video.id ? 'text-emerald-500' : 'text-gray-400 hover:text-gray-600'}`}>
                      {copied === video.id ? '✓ 已复制' : '📋 点击复制'}
                    </div>
                  </div>

                  {/* Source */}
                  <div className="mt-2 flex items-center justify-between">
                    {video.author_url ? (
                      <a
                        href={video.author_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={e => e.stopPropagation()}
                      >@{video.author || 'unknown'}</a>
                    ) : (
                      <span className="text-[11px] text-gray-400">{video.author || 'Anonymous'}</span>
                    )}
                    <span className="text-[11px] text-gray-300">{timeAgo(video.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
