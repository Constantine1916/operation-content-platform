'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import Masonry from 'react-masonry-css';

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
      <Masonry
        breakpointCols={BREAKPOINTS}
        className="flex gap-4"
        columnClassName="flex flex-col gap-4"
      >
        {images.map((img, i) => (
          <ImageCard key={`${img.task_id}-${img.index}-${i}`} image={img} allImages={images} />
        ))}
      </Masonry>
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

function CopyButton({ text, className = '' }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={copy}
      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
        copied
          ? 'bg-gray-900 text-white'
          : 'bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm'
      } ${className}`}
      title="复制 Prompt"
    >
      {copied ? (
        <>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          已复制
        </>
      ) : (
        <>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          复制
        </>
      )}
    </button>
  );
}

function ImageCard({ image, allImages }: { image: GalleryImage; allImages: GalleryImage[] }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const { siblings, startIndex } = useMemo(() => {
    const siblings = allImages
      .filter(img => img.task_id === image.task_id)
      .sort((a, b) => a.index - b.index);
    const startIndex = siblings.findIndex(img => img.index === image.index);
    return { siblings, startIndex };
  }, [allImages, image.task_id, image.index]);

  return (
    <>
      <div
        className="group rounded-xl overflow-hidden bg-white cursor-pointer transition-shadow hover:shadow-lg"
        onClick={() => setLightboxOpen(true)}
      >
        {/* 图片 + hover overlay */}
        <div className="relative overflow-hidden">
          <img
            src={image.url}
            alt={image.prompt}
            className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {/* hover 时显示 prompt + 复制按钮 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
            <p className="text-white/90 text-[11px] leading-relaxed line-clamp-3 mb-2">{image.prompt}</p>
            <div className="flex justify-end">
              <CopyButton text={image.prompt} />
            </div>
          </div>
        </div>

        {/* 底部：头像 + 用户名 */}
        <div className="px-3 py-2.5 flex items-center gap-2">
          <Avatar user_id={image.user_id} username={image.username} avatar_url={image.avatar_url} />
          <span className="text-xs text-gray-600 font-medium truncate">
            {image.username ?? image.user_id.slice(0, 8)}
          </span>
        </div>
      </div>

      {lightboxOpen && (
        <Lightbox
          images={siblings}
          initialIndex={startIndex >= 0 ? startIndex : 0}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}

function Avatar({ user_id, username, avatar_url }: { user_id: string; username: string | null; avatar_url: string | null }) {
  const initial = (username ?? user_id).charAt(0).toUpperCase();
  if (avatar_url) {
    return <img src={avatar_url} alt={initial} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />;
  }
  return (
    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
      <span className="text-[10px] font-semibold text-gray-500">{initial}</span>
    </div>
  );
}

function Lightbox({ images, initialIndex, onClose }: {
  images: GalleryImage[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(initialIndex);
  const img = images[current];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setCurrent(i => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setCurrent(i => Math.min(images.length - 1, i + 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [images.length, onClose]);

  if (!img) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center max-w-2xl w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/60 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="relative">
          <img
            src={img.url}
            alt={img.prompt}
            className="rounded-xl max-h-[75vh] w-auto object-contain"
          />

          {images.length > 1 && (
            <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
              <button
                onClick={() => setCurrent(i => Math.max(0, i - 1))}
                disabled={current === 0}
                className="pointer-events-auto w-9 h-9 flex items-center justify-center rounded-full bg-black/40 text-white/80 hover:bg-black/60 hover:text-white disabled:opacity-20 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrent(i => Math.min(images.length - 1, i + 1))}
                disabled={current === images.length - 1}
                className="pointer-events-auto w-9 h-9 flex items-center justify-center rounded-full bg-black/40 text-white/80 hover:bg-black/60 hover:text-white disabled:opacity-20 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 w-full bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-white/90 text-sm leading-relaxed flex-1">{img.prompt}</p>
            <CopyButton text={img.prompt} className="flex-shrink-0 mt-0.5" />
          </div>
          {images.length > 1 && (
            <p className="text-white/40 text-xs mt-2">{current + 1} / {images.length}</p>
          )}
        </div>

      </div>
    </div>
  );
}
