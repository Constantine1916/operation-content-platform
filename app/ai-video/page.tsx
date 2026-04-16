'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Masonry from 'react-masonry-css';

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
  user_id?: string;
  username?: string | null;
  avatar_url?: string | null;
}

const PAGE_LIMIT = 20;
const BREAKPOINTS = { default: 4, 1280: 4, 1024: 3, 768: 2, 640: 1 };

export default function AiVideoPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modelFilter, setModelFilter] = useState('all');
  const [allModels, setAllModels] = useState<string[]>([]);
  const pageRef = useRef(1);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    fetch('/api/ai-video?models=true')
      .then(r => r.json())
      .then(data => { if (data.success) setAllModels(data.models); })
      .catch(() => {});
  }, []);

  const fetchPage = useCallback(async (page: number, model: string, isFirst = false) => {
    if (isFirst) setLoading(true); else setLoadingMore(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT) });
      if (model !== 'all') params.set('model', model);
      const res = await fetch(`/api/ai-video?${params}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setVideos(prev => page === 1 ? data.data : [...prev, ...data.data]);
      setHasMore(data.pagination.page < data.pagination.totalPages);
      pageRef.current = page;
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    pageRef.current = 1;
    fetchPage(1, modelFilter, true);
  }, [modelFilter, fetchPage]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    fetchPage(pageRef.current + 1, modelFilter).finally(() => {
      loadingMoreRef.current = false;
    });
  }, [hasMore, modelFilter, fetchPage]);

  if (loading) return <VideoSkeleton />;
  if (error) return <div className="text-center py-20 text-red-500 text-sm">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">AI 视频</h1>
        <p className="text-xs text-gray-500 tracking-[0.15em] uppercase">AI Video</p>
      </div>

      {/* Model filter */}
      {allModels.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-6">
          <button
            onClick={() => setModelFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${modelFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >全部</button>
          {allModels.map(m => (
            <button
              key={m}
              onClick={() => setModelFilter(m)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${modelFilter === m ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >{m}</button>
          ))}
        </div>
      )}

      {videos.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">暂无视频</div>
      ) : (
        <>
          <Masonry
            breakpointCols={BREAKPOINTS}
            className="flex gap-4"
            columnClassName="flex flex-col gap-4"
          >
            {videos.map((video, i) => (
              <VideoCard key={`${video.id}-${i}`} video={video} />
            ))}
          </Masonry>
          <LoadMoreTrigger onVisible={loadMore} hasMore={hasMore} loadingMore={loadingMore} total={videos.length} />
        </>
      )}
    </div>
  );
}

function VideoCard({ video }: { video: VideoItem }) {
  const [copied, setCopied] = useState(false);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(video.prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleMouseEnter = () => {
    const v = videoRef.current;
    if (v) { v.currentTime = 0; v.play().catch(() => {}); setPlaying(true); }
  };

  const handleMouseLeave = () => {
    const v = videoRef.current;
    if (v) { v.pause(); v.currentTime = 0; setPlaying(false); }
  };

  return (
    <div
      className="group rounded-xl overflow-hidden cursor-pointer transition-shadow hover:shadow-lg"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative overflow-hidden bg-gray-100">
        {video.video_url ? (
          <video
            ref={videoRef}
            src={video.video_url}
            muted
            loop
            playsInline
            className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full aspect-[9/16] flex items-center justify-center text-gray-300 text-xs">无视频</div>
        )}

        {/* Play icon — visible when not playing */}
        {video.video_url && !playing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-10 h-10 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center">
              <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        )}

        {/* Model badge */}
        {video.model && (
          <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white/90 text-[10px] px-2 py-0.5 rounded-full pointer-events-none">
            {video.model}
          </div>
        )}

        {/* Hover overlay: prompt + copy + author */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent flex flex-col justify-end p-3 pointer-events-none">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 mb-2.5 pointer-events-auto">
            <p className="text-white/90 text-[11px] leading-relaxed line-clamp-3 mb-1.5">{video.prompt}</p>
            <div className="flex justify-end">
              <button
                onClick={copy}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  copied ? 'bg-gray-900 text-white' : 'bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm'
                }`}
              >
                {copied ? '已复制' : '复制'}
              </button>
            </div>
          </div>

          {/* Author — always visible */}
          {video.username ? (
            <Link
              href={`/profile/${video.username}`}
              className="flex items-center gap-2 pointer-events-auto hover:opacity-80 transition-opacity"
              onClick={e => e.stopPropagation()}
            >
              <Avatar user_id={video.user_id ?? ''} username={video.username} avatar_url={video.avatar_url ?? null} />
              <span className="text-xs text-white/90 font-medium truncate">{video.username}</span>
            </Link>
          ) : video.author ? (
            <div className="flex items-center gap-2 pointer-events-auto">
              <Avatar user_id={video.id} username={video.author} avatar_url={null} />
              <span className="text-xs text-white/90 font-medium truncate">{video.author}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Avatar({ user_id, username, avatar_url }: { user_id: string; username: string | null; avatar_url: string | null }) {
  const initial = (username ?? user_id).charAt(0).toUpperCase();
  if (avatar_url) {
    return <img src={avatar_url} alt={initial} className="w-6 h-6 rounded-full object-cover flex-shrink-0 ring-1 ring-white/40" />;
  }
  return (
    <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm ring-1 ring-white/40 flex items-center justify-center flex-shrink-0">
      <span className="text-[10px] font-semibold text-white">{initial}</span>
    </div>
  );
}

function LoadMoreTrigger({ onVisible, hasMore, loadingMore, total }: {
  onVisible: () => void;
  hasMore: boolean;
  loadingMore: boolean;
  total: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !loadingMore) onVisible();
    }, { rootMargin: '200px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, onVisible]);

  return (
    <div ref={ref} className="mt-8 flex items-center justify-center py-8">
      {loadingMore && (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          加载中...
        </div>
      )}
      {!hasMore && total > 0 && (
        <div className="flex items-center gap-3 w-full max-w-sm">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400">共 {total} 个视频</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
      )}
    </div>
  );
}

function VideoSkeleton() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="h-7 w-24 bg-gray-100 rounded-lg animate-pulse mb-2" />
        <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
      </div>
      <div className="columns-2 lg:columns-3 xl:columns-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="break-inside-avoid mb-4 rounded-xl overflow-hidden bg-gray-100 animate-pulse"
            style={{ height: `${320 + (i % 3) * 80}px` }}
          />
        ))}
      </div>
    </div>
  );
}
