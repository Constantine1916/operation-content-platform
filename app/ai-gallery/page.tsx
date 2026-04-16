'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Masonry from 'react-masonry-css';
import { Image } from 'antd';

export interface GalleryImage {
  task_id: string;
  prompt: string;
  url: string;
  width: number;
  height: number;
  index: number;
  created_at: string;
  user_id: string;
  username: string | null;
  avatar_url: string | null;
}

const PAGE_LIMIT = 50;
const BREAKPOINTS = { default: 4, 1280: 4, 1024: 3, 768: 2, 640: 1 };

export default function AiGalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(1);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      tokenRef.current = session?.access_token ?? null;
      fetchPage(1, true);
    });
  }, []);

  const fetchPage = useCallback(async (page: number, isFirst = false) => {
    if (!tokenRef.current) return;
    if (isFirst) setLoading(true); else setLoadingMore(true);
    try {
      const res = await fetch(`/api/gallery?page=${page}&limit=${PAGE_LIMIT}`, {
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setImages(prev => page === 1 ? data.items : [...prev, ...data.items]);
      setHasMore(data.hasMore);
      pageRef.current = page;
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    fetchPage(pageRef.current + 1);
  }, [hasMore, loadingMore, fetchPage]);

  if (loading) return <GallerySkeleton />;
  if (error) return <div className="text-center py-20 text-red-500 text-sm">{error}</div>;
  if (images.length === 0) return (
    <div className="max-w-7xl mx-auto">
      <PageHeader />
      <div className="text-center py-20 text-gray-400 text-sm">暂无图片</div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader />
      <Image.PreviewGroup
        preview={{
          imageRender: (originalNode) => (
            <>
              {originalNode}
              <div className="fixed bottom-4 right-4 pointer-events-none select-none z-[9999]">
                <span
                  className="text-white/50 text-sm font-semibold tracking-[0.2em] uppercase"
                  style={{ textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}
                >
                  AiCave
                </span>
              </div>
            </>
          ),
          actionsRender: (originalNode, { image }) => {
            const src = (image as any)?.src ?? '';
            return (
              <>
                {originalNode}
                <button
                  title="下载原图"
                  style={{ color: 'rgba(255,255,255,0.65)', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}
                  onClick={async () => {
                    try {
                      const res = await fetch(src);
                      const blob = await res.blob();
                      const ext = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg';
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url; a.download = `aicave_${Date.now()}.${ext}`; a.click();
                      URL.revokeObjectURL(url);
                    } catch { window.open(src, '_blank'); }
                  }}
                >
                  <svg width="1em" height="1em" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                </button>
              </>
            );
          },
        }}
      >
        <Masonry
          breakpointCols={BREAKPOINTS}
          className="flex gap-4"
          columnClassName="flex flex-col gap-4"
        >
          {images.map((img, i) => (
            <ImageCard key={`${img.task_id}-${img.index}-${i}`} image={img} />
          ))}
        </Masonry>
      </Image.PreviewGroup>
      <LoadMoreTrigger onVisible={loadMore} hasMore={hasMore} loadingMore={loadingMore} total={images.length} />
    </div>
  );
}

function PageHeader() {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">AI 图片</h1>
      <p className="text-xs text-gray-500 tracking-[0.15em] uppercase">AI Gallery</p>
    </div>
  );
}

function GallerySkeleton() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="h-7 w-24 bg-gray-100 rounded-lg animate-pulse mb-2" />
        <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
      </div>
      <div className="columns-2 lg:columns-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="break-inside-avoid mb-4 rounded-xl overflow-hidden bg-gray-100 animate-pulse"
            style={{ height: `${220 + (i % 3) * 60}px` }}
          />
        ))}
      </div>
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
          <span className="text-xs text-gray-400">共 {total} 张图片</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
      )}
    </div>
  );
}

function ImageCard({ image }: { image: GalleryImage }) {
  const [copied, setCopied] = useState(false);

  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(image.prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="group rounded-xl overflow-hidden cursor-pointer transition-shadow hover:shadow-lg relative">
      <Image
        src={image.url}
        alt={image.prompt}
        className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
        style={{ display: 'block', width: '100%' }}
        preview={{ mask: false }}
        loading="lazy"
      />

      {/* 常驻底部渐变 + 作者信息 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent flex flex-col justify-end p-3 pointer-events-none rounded-xl">
        {/* hover 时浮出 prompt + 复制按钮 */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 mb-2.5 pointer-events-auto">
          <p className="text-white/90 text-[11px] leading-relaxed line-clamp-3 mb-1.5">{image.prompt}</p>
          <div className="flex justify-end">
            <button
              onClick={copy}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
                copied
                  ? 'bg-gray-900 text-white'
                  : 'bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm'
              }`}
            >
              {copied ? '已复制' : '复制'}
            </button>
          </div>
        </div>

        {/* 作者信息：始终可见 */}
        {image.username ? (
          <Link
            href={`/profile/${image.username}`}
            className="flex items-center gap-2 pointer-events-auto hover:opacity-80 transition-opacity"
            onClick={e => e.stopPropagation()}
          >
            <Avatar user_id={image.user_id} username={image.username} avatar_url={image.avatar_url} />
            <span className="text-xs text-white/90 font-medium truncate">
              {image.username}
            </span>
          </Link>
        ) : (
          <div className="flex items-center gap-2 pointer-events-auto">
            <Avatar user_id={image.user_id} username={image.username} avatar_url={image.avatar_url} />
            <span className="text-xs text-white/90 font-medium truncate">
              {image.user_id.slice(0, 8)}
            </span>
          </div>
        )}
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
