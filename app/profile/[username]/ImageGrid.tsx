// app/profile/[username]/ImageGrid.tsx
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Masonry from 'react-masonry-css';
import { Image } from 'antd';

function PreviewWithWatermark({ originalNode }: { originalNode: React.ReactNode }) {
  const [rect, setRect] = useState<{ bottom: number; right: number } | null>(null);

  useEffect(() => {
    let rafId: number;
    const update = () => {
      const img = document.querySelector<HTMLImageElement>('.ant-image-preview-img');
      if (img) {
        const r = img.getBoundingClientRect();
        setRect({ bottom: window.innerHeight - r.bottom, right: window.innerWidth - r.right });
      }
      rafId = requestAnimationFrame(update);
    };
    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <>
      {originalNode}
      {rect && (
        <div
          className="pointer-events-none select-none z-[9999]"
          style={{ position: 'fixed', bottom: rect.bottom + 12, right: rect.right + 12 }}
        >
          <span
            className="text-white/80 text-sm font-semibold tracking-[0.2em] uppercase"
            style={{ textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}
          >
            AiCave
          </span>
        </div>
      )}
    </>
  );
}

export interface ProfileImage {
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

const PAGE_LIMIT = 20;
const BREAKPOINTS = { default: 4, 1280: 4, 1024: 3, 768: 2, 640: 1 };

interface ImageGridProps {
  initialImages: ProfileImage[];
  hasMore: boolean;
  userId: string;
}

export default function ImageGrid({ initialImages, hasMore: initialHasMore, userId }: ImageGridProps) {
  const [images, setImages] = useState<ProfileImage[]>(initialImages);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [paginationError, setPaginationError] = useState<string | null>(null);
  const pageRef = useRef(1);
  const loadingMoreRef = useRef(false);

  const fetchMore = useCallback(async () => {
    if (!hasMore || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setPaginationError(null);
    try {
      const nextPage = pageRef.current + 1;
      const res = await fetch(
        `/api/gallery?user_id=${encodeURIComponent(userId)}&page=${nextPage}&limit=${PAGE_LIMIT}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? '加载失败');
      setImages(prev => [...prev, ...data.items]);
      setHasMore(data.hasMore);
      pageRef.current = nextPage;
    } catch (e: unknown) {
      setPaginationError(e instanceof Error ? e.message : '加载失败');
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [hasMore, userId]);

  if (images.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400 text-sm">暂无公开图片</div>
    );
  }

  return (
    <>
      <Image.PreviewGroup
        preview={{
          imageRender: (originalNode) => (
            <PreviewWithWatermark originalNode={originalNode} />
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
            <ProfileImageCard key={`${img.task_id}-${img.index}-${i}`} image={img} />
          ))}
        </Masonry>
      </Image.PreviewGroup>
      <LoadMoreTrigger
        onVisible={fetchMore}
        hasMore={hasMore}
        loadingMore={loadingMore}
        paginationError={paginationError}
        onRetry={fetchMore}
        total={images.length}
      />
    </>
  );
}

function ProfileImageCard({ image }: { image: ProfileImage }) {
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

      {/* hover 时浮出 prompt + 复制按钮 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent flex flex-col justify-end p-3 pointer-events-none rounded-xl">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto">
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
      </div>
    </div>
  );
}

function LoadMoreTrigger({
  onVisible,
  hasMore,
  loadingMore,
  paginationError,
  onRetry,
  total,
}: {
  onVisible: () => void;
  hasMore: boolean;
  loadingMore: boolean;
  paginationError: string | null;
  onRetry: () => void;
  total: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onVisible();
      },
      { rootMargin: '200px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [onVisible]);

  return (
    <div ref={ref} className="mt-8 flex items-center justify-center py-8">
      {loadingMore && (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          加载中...
        </div>
      )}
      {paginationError && (
        <div className="flex items-center gap-3 text-sm text-red-500">
          <span>{paginationError}</span>
          <button
            onClick={onRetry}
            className="px-3 py-1 bg-gray-900 text-white rounded-lg text-xs hover:bg-gray-800 transition-colors"
          >
            重试
          </button>
        </div>
      )}
      {!hasMore && !paginationError && total > 0 && (
        <div className="flex items-center gap-3 w-full max-w-sm">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400">共 {total} 张图片</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
      )}
    </div>
  );
}
