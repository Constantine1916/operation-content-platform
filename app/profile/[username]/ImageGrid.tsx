// app/profile/[username]/ImageGrid.tsx
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Masonry from 'react-masonry-css';
import { Image } from 'antd';

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
      <Image.PreviewGroup>
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
  const [downloading, setDownloading] = useState(false);

  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(image.prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const download = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(image.url);
      const blob = await res.blob();
      const ext = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aicave_${Date.now()}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { window.open(image.url, '_blank'); }
    finally { setDownloading(false); }
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

      {/* 水印 */}
      <div className="absolute bottom-10 right-2 pointer-events-none select-none z-10">
        <span className="text-white/40 text-[10px] font-semibold tracking-widest uppercase"
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>AiCave</span>
      </div>

      {/* 下载按钮 */}
      <button
        onClick={download}
        disabled={downloading}
        className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-7 h-7 flex items-center justify-center rounded-lg bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white disabled:opacity-50"
        title="下载原图"
      >
        {downloading
          ? <div className="w-3 h-3 border border-white/60 border-t-white rounded-full animate-spin" />
          : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
        }
      </button>

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
