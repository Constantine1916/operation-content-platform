// app/profile/[username]/ImageGrid.tsx
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Masonry from 'react-masonry-css';
import { supabase } from '@/lib/supabase';

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
  const tokenRef = useRef<string | null>(null);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      tokenRef.current = session?.access_token ?? null;
    });
  }, []);

  const fetchMore = useCallback(async () => {
    if (!hasMore || loadingMoreRef.current) return;
    if (!tokenRef.current) {
      // Token not yet loaded — surface a retryable error rather than silently skipping
      setPaginationError('请先登录后再加载更多图片');
      return;
    }
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setPaginationError(null);
    try {
      const nextPage = pageRef.current + 1;
      const res = await fetch(
        `/api/gallery?user_id=${encodeURIComponent(userId)}&page=${nextPage}&limit=${PAGE_LIMIT}`,
        { headers: { Authorization: `Bearer ${tokenRef.current}` } }
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
      <Masonry
        breakpointCols={BREAKPOINTS}
        className="flex gap-4"
        columnClassName="flex flex-col gap-4"
      >
        {images.map((img, i) => (
          <ProfileImageCard key={`${img.task_id}-${img.index}-${i}`} image={img} />
        ))}
      </Masonry>
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
    <div className="group rounded-xl overflow-hidden cursor-pointer transition-shadow hover:shadow-lg">
      <div className="relative overflow-hidden">
        <img
          src={image.url}
          alt={image.prompt}
          className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {/* hover 时浮出 prompt + 复制按钮 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent flex flex-col justify-end p-3 pointer-events-none">
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
