'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Masonry from 'react-masonry-css';
import { Image } from 'antd';
import FavoriteButton from '@/components/favorites/FavoriteButton';
import { useFavoriteStatuses } from '@/components/favorites/useFavoriteStatuses';
import { useFavoriteToggle } from '@/components/favorites/useFavoriteToggle';
import { useAuthActionGate } from '@/components/auth/useAuthActionGate';
import AdminModerationActions from '@/components/moderation/AdminModerationActions';
import NsfwPlaceholder from '@/components/moderation/NsfwPlaceholder';
import { useAdminModeration } from '@/components/moderation/useAdminModeration';
import { getFavoriteButtonState } from '@/lib/favorite-view-model';
import { useMobileViewportState } from '@/lib/use-mobile-viewport';
import ImagePreviewLightbox from '@/components/gallery/ImagePreviewLightbox';
import { getStableImageFrameStyles } from '@/lib/image-aspect-ratio';
import type { ModerationStatus } from '@/lib/moderation';
import type { PublicGalleryImage } from '@/lib/server/public-content';

const PAGE_LIMIT = 50;
const BREAKPOINTS = { default: 4, 1280: 4, 1024: 3, 768: 2, 640: 2 };

export default function PublicAiGalleryPage({
  initialImages,
  initialHasMore,
}: {
  initialImages: PublicGalleryImage[];
  initialHasMore: boolean;
}) {
  const [images, setImages] = useState<PublicGalleryImage[]>(initialImages);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [error, setError] = useState<string | null>(null);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState<number | null>(null);
  const pageRef = useRef(1);
  const { favoriteIds, setFavoriteIds } = useFavoriteStatuses('image', images.map(image => image.id));
  const requireAuthForAction = useAuthActionGate();
  const { isAdmin, pendingId, moderate } = useAdminModeration();
  const { pendingIds, toggleFavorite } = useFavoriteToggle({
    contentType: 'image',
    setFavoriteIds,
  });

  const fetchPage = useCallback(async (
    page: number,
    isFirst = false,
    silent = false,
  ) => {
    if (!silent) {
      setError(null);
      if (isFirst) setLoading(true); else setLoadingMore(true);
    }
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT) });
      const res = await fetch(`/api/gallery?${params}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setImages(prev => page === 1 ? data.items : [...prev, ...data.items]);
      setHasMore(Boolean(data.hasMore));
      pageRef.current = page;
    } catch (e: any) {
      if (silent) {
        console.error(e);
      } else {
        setError(e.message);
        setHasMore(false);
      }
    } finally {
      if (!silent) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchPage(1, initialImages.length === 0, initialImages.length > 0);
  }, [fetchPage, initialImages.length]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    void fetchPage(pageRef.current + 1);
  }, [fetchPage, hasMore, loadingMore]);

  const applyModerationStatus = useCallback((contentId: string, status: ModerationStatus) => {
    setImages(current => current
      .map(image => image.id === contentId ? { ...image, moderation_status: status } : image)
      .filter(image => image.moderation_status !== 'hidden'));
  }, []);

  if (loading) return <GallerySkeleton />;
  if (error) return <div className="text-center py-20 text-red-500 text-sm">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader />
      {images.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">暂无图片</div>
      ) : (
        <Masonry
          breakpointCols={BREAKPOINTS}
          className="flex gap-3 sm:gap-4"
          columnClassName="flex flex-col gap-3 sm:gap-4"
        >
          {images.map((img, i) => (
            <ImageCard
              key={`${img.id}-${i}`}
              image={img}
              onOpenPreview={() => setSelectedPreviewIndex(i)}
              {...getFavoriteButtonState(img.id, favoriteIds, pendingIds)}
              onToggleFavorite={() => toggleFavorite(img.id, !favoriteIds.has(img.id))}
              adminModerationAction={isAdmin ? (
                <AdminModerationActions
                  contentType="image"
                  contentId={img.id}
                  status={(img.moderation_status ?? 'active') as ModerationStatus}
                  pending={pendingId === img.id}
                  onModerate={async (input) => {
                    const status = await moderate(input);
                    if (!status) return false;
                    applyModerationStatus(img.id, status);
                    return true;
                  }}
                />
              ) : undefined}
            />
          ))}
        </Masonry>
      )}
      <ImagePreviewLightbox
        items={images}
        selectedIndex={selectedPreviewIndex}
        onClose={() => setSelectedPreviewIndex(null)}
        onSelect={setSelectedPreviewIndex}
        beforeDownload={() => requireAuthForAction({ kind: 'download' }).then(Boolean)}
        getFavoriteState={(item) => getFavoriteButtonState(item.id, favoriteIds, pendingIds)}
        onToggleFavorite={(item) => toggleFavorite(item.id, !favoriteIds.has(item.id))}
      />
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
      <div className="columns-2 gap-3 sm:gap-4 lg:columns-3">
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

function ImageCard({
  image,
  onOpenPreview,
  isFavorite,
  isPending,
  onToggleFavorite,
  adminModerationAction,
}: {
  image: PublicGalleryImage;
  onOpenPreview: () => void;
  isFavorite: boolean;
  isPending: boolean;
  onToggleFavorite: () => void;
  adminModerationAction?: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const { touchFirst } = useMobileViewportState();
  const imageFrameStyles = getStableImageFrameStyles(image.width, image.height);
  const isNsfw = image.moderation_status === 'nsfw';

  const copy = (event: React.MouseEvent) => {
    event.stopPropagation();
    navigator.clipboard.writeText(image.prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div
      className="group rounded-xl overflow-hidden cursor-pointer transition-shadow hover:shadow-lg relative"
      onClick={onOpenPreview}
    >
      <div className="absolute right-3 top-3 z-10 pointer-events-auto">
        <FavoriteButton
          variant="overlay"
          isFavorite={isFavorite}
          isPending={isPending}
          onToggle={onToggleFavorite}
        />
      </div>
      {adminModerationAction && (
        <div
          className="absolute left-3 top-3 z-10 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          onClick={event => event.stopPropagation()}
        >
          {adminModerationAction}
        </div>
      )}
      <div style={imageFrameStyles.frame}>
        {isNsfw ? (
          <NsfwPlaceholder className="h-full min-h-0 rounded-none" />
        ) : (
          <Image
            src={image.url ?? ''}
            alt={image.prompt}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            styles={{
              root: imageFrameStyles.root,
              image: imageFrameStyles.image,
            }}
            preview={false}
            loading="lazy"
          />
        )}
      </div>

      {!touchFirst && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent flex flex-col justify-end p-3 pointer-events-none rounded-xl">
          <div className="mb-2.5 pointer-events-auto opacity-0 transition-opacity duration-200 group-hover:opacity-100">
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

          {image.username ? (
            <Link
              href={`/profile/${image.username}`}
              className="flex items-center gap-2 pointer-events-auto hover:opacity-80 transition-opacity"
              onClick={event => event.stopPropagation()}
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
      )}
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
