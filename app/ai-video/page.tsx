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
    <div className="min-h-screen bg-[#0d0d0f] text-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-1">AI 视频</h1>
            <p className="text-gray-500 tracking-widest uppercase text-sm">Video Prompts</p>
          </div>
          <div className="flex gap-6 text-right">
            <div>
              <p className="text-2xl font-light">{loading ? '—' : videos.length}</p>
              <p className="text-xs text-gray-600 uppercase tracking-widest">视频</p>
            </div>
            <div>
              <p className="text-2xl font-light">{loading ? '—' : allModels.length}</p>
              <p className="text-xs text-gray-600 uppercase tracking-widest">模型</p>
            </div>
          </div>
        </div>

        {/* Model filter */}
        {allModels.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setModelFilter('all')}
              className={`px-4 py-1.5 rounded-full text-sm transition-all ${modelFilter === 'all' ? 'bg-white text-black' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
            >全部</button>
            {allModels.map(m => (
              <button
                key={m}
                onClick={() => setModelFilter(m!)}
                className={`px-4 py-1.5 rounded-full text-sm transition-all ${modelFilter === m ? 'bg-white text-black' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
              >{m}</button>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white/40" />
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            <p className="text-lg">暂无数据</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videos.map(video => (
              <div
                key={video.id}
                className="group relative bg-[#161618] rounded-2xl overflow-hidden border border-white/5 hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-1"
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
                <div className="relative aspect-[9/16] bg-black overflow-hidden">
                  {video.video_url ? (
                    <>
                      <video
                        ref={el => { videoRefs.current[video.id] = el; }}
                        src={video.video_url}
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover transition-opacity duration-300"
                        style={{ opacity: hoveredId === video.id ? 1 : 0.4 }}
                      />
                      {/* Overlay on hover */}
                      <div
                        className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
                        style={{ opacity: hoveredId === video.id ? 1 : 0 }}
                      >
                        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                          <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                      {/* Duration badge */}
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-mono">video</div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">无视频</div>
                  )}

                  {/* Model badge */}
                  {video.model && (
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white/90 text-[10px] px-2 py-0.5 rounded-full">{video.model}</div>
                  )}
                </div>

                {/* Info area */}
                <div className="p-4">
                  <h3 className="text-sm font-medium text-white/90 leading-snug mb-3 line-clamp-2">{video.title}</h3>

                  {/* Prompt copy area */}
                  <div
                    className="relative bg-[#1e1e22] rounded-xl p-3 cursor-pointer hover:bg-[#262630] transition-colors"
                    onClick={e => copyPrompt(video.id, video.prompt, e)}
                  >
                    <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-3 font-mono">{video.prompt.slice(0, 120)}...</p>
                    <div className={`mt-2 text-xs font-medium transition-all ${copied === video.id ? 'text-emerald-400' : 'text-white/40 hover:text-white/70'}`}>
                      {copied === video.id ? '✓ 已复制' : '点击复制 Prompt'}
                    </div>
                  </div>

                  {/* Source link */}
                  {video.source_url && (
                    <a
                      href={video.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center gap-1 text-[11px] text-gray-600 hover:text-gray-400 transition-colors"
                      onClick={e => e.stopPropagation()}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                      </svg>
                      awesomevideoprompts
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
