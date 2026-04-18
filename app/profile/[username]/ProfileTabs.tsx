// app/profile/[username]/ProfileTabs.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Masonry from 'react-masonry-css';
import ImageGrid, { ProfileImage } from './ImageGrid';
import { getProfileTabCount } from '@/lib/profile-tab-count';

interface VideoItem {
  id: string;
  title: string;
  prompt: string;
  model?: string;
  video_url?: string;
  created_at: string;
  user_id?: string;
  username?: string | null;
  avatar_url?: string | null;
}

interface ProfileTabsProps {
  initialImages: ProfileImage[];
  hasMore: boolean;
  userId: string;
  totalImages: number;
  totalVideos: number;
}

const TABS = [
  { key: 'images', label: 'AI 图片' },
  { key: 'videos', label: 'AI 视频' },
  { key: 'courses', label: 'AI 课程' },
] as const;

type TabKey = typeof TABS[number]['key'];

const BREAKPOINTS = { default: 4, 1280: 4, 1024: 3, 768: 2, 640: 1 };
const VIDEO_PAGE_LIMIT = 20;

export default function ProfileTabs({
  initialImages,
  hasMore,
  userId,
  totalImages,
  totalVideos,
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('images');

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-0 border-b border-gray-100 mb-6">
        {TABS.map(tab => {
          const count = getProfileTabCount(tab.key, { totalImages, totalVideos });

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === tab.key
                  ? 'text-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
              {count !== null && (
                <span className="ml-1.5 text-xs text-gray-400 tabular-nums">{count}</span>
              )}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {activeTab === 'images' && (
        <ImageGrid initialImages={initialImages} hasMore={hasMore} userId={userId} />
      )}
      {activeTab === 'videos' && (
        <VideoGrid userId={userId} />
      )}
      {activeTab === 'courses' && (
        <EmptyState text="暂无 AI 课程" />
      )}
    </div>
  );
}

function VideoGrid({ userId }: { userId: string }) {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(1);
  const loadingMoreRef = useRef(false);

  const fetchPage = useCallback(async (page: number, isFirst = false) => {
    if (isFirst) setLoading(true); else setLoadingMore(true);
    try {
      const params = new URLSearchParams({
        user_id: userId,
        page: String(page),
        limit: String(VIDEO_PAGE_LIMIT),
      });
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
  }, [userId]);

  useEffect(() => { fetchPage(1, true); }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    fetchPage(pageRef.current + 1).finally(() => { loadingMoreRef.current = false; });
  }, [hasMore, fetchPage]);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
    </div>
  );
  if (error) return <div className="text-center py-20 text-red-400 text-sm">{error}</div>;
  if (videos.length === 0) return <EmptyState text="暂无视频" />;

  return (
    <>
      <Masonry breakpointCols={BREAKPOINTS} className="flex gap-4" columnClassName="flex flex-col gap-4">
        {videos.map((video, i) => (
          <VideoCard key={`${video.id}-${i}`} video={video} />
        ))}
      </Masonry>
      <VideoLoadMore onVisible={loadMore} hasMore={hasMore} loadingMore={loadingMore} total={videos.length} />
    </>
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

        {video.video_url && !playing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-10 h-10 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center">
              <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {video.model && (
          <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white/90 text-[10px] px-2 py-0.5 rounded-full pointer-events-none">
            {video.model}
          </div>
        )}

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

          {video.username && (
            <Link
              href={`/profile/${video.username}`}
              className="flex items-center gap-2 pointer-events-auto hover:opacity-80 transition-opacity"
              onClick={e => e.stopPropagation()}
            >
              <VideoAvatar username={video.username} avatar_url={video.avatar_url ?? null} />
              <span className="text-xs text-white/90 font-medium truncate">{video.username}</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function VideoAvatar({ username, avatar_url }: { username: string; avatar_url: string | null }) {
  const initial = username.charAt(0).toUpperCase();
  if (avatar_url) {
    return <img src={avatar_url} alt={initial} className="w-6 h-6 rounded-full object-cover flex-shrink-0 ring-1 ring-white/40" />;
  }
  return (
    <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm ring-1 ring-white/40 flex items-center justify-center flex-shrink-0">
      <span className="text-[10px] font-semibold text-white">{initial}</span>
    </div>
  );
}

function VideoLoadMore({ onVisible, hasMore, loadingMore, total }: {
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

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-20 text-gray-400 text-sm">{text}</div>
  );
}
