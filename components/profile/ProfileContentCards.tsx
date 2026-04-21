'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import FavoriteButton from '@/components/favorites/FavoriteButton';
import { formatBeijingDateTime } from '@/lib/beijing-time';
import { getStableImageFrameStyles } from '@/lib/image-aspect-ratio';
import { useMobileViewportState } from '@/lib/use-mobile-viewport';

export interface ProfileContentImage {
  id: string;
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

export interface ProfileContentVideo {
  id: string;
  title: string;
  prompt: string;
  author?: string;
  author_url?: string;
  platform?: string;
  model?: string;
  video_url?: string;
  source_url?: string;
  created_at: string;
  user_id?: string;
  username?: string | null;
  avatar_url?: string | null;
}

export interface ProfileContentHotspot {
  id: string;
  title: string;
  category: string;
  source: string;
  summary: string;
  url: string;
  热度: string;
  created_at: string;
  collected_date: string;
  collected_time: string;
}

export interface ProfileContentArticle {
  id: string;
  platform: string;
  author: string | null;
  title: string;
  content: string;
  created_at: string;
}

export function ProfileImageCard({
  image,
  isFavorite,
  isPending,
  onToggleFavorite,
}: {
  image: ProfileContentImage;
  isFavorite?: boolean;
  isPending?: boolean;
  onToggleFavorite?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const { touchFirst } = useMobileViewportState();
  const imageFrameStyles = getStableImageFrameStyles(image.width, image.height);

  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(image.prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="group relative overflow-hidden rounded-xl transition-shadow hover:shadow-lg">
      {onToggleFavorite && (
        <div className="absolute right-3 top-3 z-10">
          <FavoriteButton
            variant="overlay"
            isFavorite={Boolean(isFavorite)}
            isPending={Boolean(isPending)}
            onToggle={onToggleFavorite}
          />
        </div>
      )}

      <div style={imageFrameStyles.frame}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt={image.prompt}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {!touchFirst && (
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-end rounded-xl bg-gradient-to-t from-black/65 via-black/10 to-transparent p-3">
          <div className="pointer-events-auto opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <p className="mb-1.5 line-clamp-3 text-[11px] leading-relaxed text-white/90">{image.prompt}</p>
            <div className="flex justify-between gap-2">
              {image.username ? (
                <span className="truncate text-[11px] font-medium text-white/85">@{image.username}</span>
              ) : <span />}
              <button
                onClick={copy}
                className={`rounded-lg px-2 py-1 text-[11px] font-medium transition-all ${
                  copied
                    ? 'bg-gray-900 text-white'
                    : 'bg-black/30 text-white backdrop-blur-sm hover:bg-black/50'
                }`}
              >
                {copied ? '已复制' : '复制'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProfileVideoCard({
  video,
  isFavorite,
  isPending,
  onToggleFavorite,
}: {
  video: ProfileContentVideo;
  isFavorite?: boolean;
  isPending?: boolean;
  onToggleFavorite?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { touchFirst } = useMobileViewportState();

  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(video.prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleMouseEnter = () => {
    if (touchFirst) return;
    const element = videoRef.current;
    if (!element) return;
    element.currentTime = 0;
    element.play().catch(() => {});
    setPlaying(true);
  };

  const handleMouseLeave = () => {
    if (touchFirst) return;
    const element = videoRef.current;
    if (!element) return;
    element.pause();
    element.currentTime = 0;
    setPlaying(false);
  };

  useEffect(() => {
    if (!touchFirst) return;
    const element = videoRef.current;
    if (!element) return;
    element.pause();
    element.currentTime = 0;
    setPlaying(false);
  }, [touchFirst]);

  return (
    <div
      className="group overflow-hidden rounded-xl transition-shadow hover:shadow-lg"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative overflow-hidden bg-gray-100">
        {onToggleFavorite && (
          <div className="absolute right-3 top-3 z-10">
            <FavoriteButton
              variant="overlay"
              isFavorite={Boolean(isFavorite)}
              isPending={Boolean(isPending)}
              onToggle={onToggleFavorite}
            />
          </div>
        )}

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
          <div className="flex aspect-[9/16] w-full items-center justify-center text-xs text-gray-300">无视频</div>
        )}

        {!touchFirst && video.model && (
          <div className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white/90 backdrop-blur-sm">
            {video.model}
          </div>
        )}

        {video.video_url && !playing && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/25 backdrop-blur-sm">
              <svg className="ml-0.5 h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {!touchFirst && (
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/65 via-black/10 to-transparent p-3">
            <div className="pointer-events-auto mb-2.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <p className="mb-1.5 line-clamp-3 text-[11px] leading-relaxed text-white/90">{video.prompt}</p>
              <div className="flex justify-end">
                <button
                  onClick={copy}
                  className={`rounded-lg px-2 py-1 text-[11px] font-medium transition-all ${
                    copied
                      ? 'bg-gray-900 text-white'
                      : 'bg-black/30 text-white backdrop-blur-sm hover:bg-black/50'
                  }`}
                >
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
            </div>

            {video.username ? (
              <Link
                href={`/profile/${video.username}`}
                className="pointer-events-auto flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <ProfileMiniAvatar username={video.username} avatarUrl={video.avatar_url ?? null} />
                <span className="truncate text-xs font-medium text-white/90">{video.username}</span>
              </Link>
            ) : video.author ? (
              <div className="pointer-events-auto flex items-center gap-2">
                <ProfileMiniAvatar username={video.author} avatarUrl={null} />
                <span className="truncate text-xs font-medium text-white/90">{video.author}</span>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileMiniAvatar({ username, avatarUrl }: { username: string; avatarUrl: string | null }) {
  const initial = username.charAt(0).toUpperCase();

  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl} alt={initial} className="h-6 w-6 flex-shrink-0 rounded-full object-cover ring-1 ring-white/40" />;
  }

  return (
    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/40 backdrop-blur-sm">
      <span className="text-[10px] font-semibold text-white">{initial}</span>
    </div>
  );
}

export function ProfileHotspotCard({
  hotspot,
  isFavorite,
  isPending,
  onToggleFavorite,
}: {
  hotspot: ProfileContentHotspot;
  isFavorite: boolean;
  isPending: boolean;
  onToggleFavorite: () => void;
}) {
  return (
    <div className="group flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300 hover:bg-gray-50">
      <a
        href={hotspot.url}
        target="_blank"
        rel="noopener noreferrer"
        className="min-w-0 flex-1"
      >
        <div className="mb-1.5 flex items-center gap-2 flex-wrap">
          {hotspot.热度 && (
            <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
              🔥 {hotspot.热度}
            </span>
          )}
          <span className="text-[10px] text-gray-400">
            {formatBeijingDateTime(hotspot.created_at)}
          </span>
        </div>
        <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">{hotspot.title}</h3>
        {hotspot.summary && <p className="mt-1 text-xs text-gray-600 line-clamp-2">{hotspot.summary}</p>}
        {hotspot.source && <div className="mt-1 text-[10px] text-gray-400">📰 {hotspot.source}</div>}
      </a>

      <FavoriteButton
        isFavorite={isFavorite}
        isPending={isPending}
        onToggle={onToggleFavorite}
        className="mt-0.5 flex-shrink-0"
      />
    </div>
  );
}

export function ProfileArticleCard({
  article,
  isFavorite,
  isPending,
  onToggleFavorite,
  onOpen,
}: {
  article: ProfileContentArticle;
  isFavorite: boolean;
  isPending: boolean;
  onToggleFavorite: () => void;
  onOpen: () => void;
}) {
  return (
    <div
      onClick={onOpen}
      className="group flex cursor-pointer flex-col rounded-2xl border border-gray-200 bg-white p-4 transition-all hover:border-gray-400 hover:shadow-md"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">{article.platform}</div>
          <div className="mt-1 text-[10px] text-gray-500">{formatBeijingDateTime(article.created_at)}</div>
        </div>
        <FavoriteButton
          isFavorite={isFavorite}
          isPending={isPending}
          onToggle={onToggleFavorite}
          className="h-8 w-8 flex-shrink-0"
        />
      </div>

      <h3 className="mb-3 line-clamp-3 flex-1 text-sm font-semibold text-gray-900">{article.title}</h3>
      {article.content && <p className="mb-3 line-clamp-2 text-xs text-gray-600">{article.content}</p>}

      <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-2">
        <span className="text-[10px] text-gray-500">{article.author ? `@${article.author}` : '—'}</span>
        <span className="text-[10px] text-gray-500">阅读全文 →</span>
      </div>
    </div>
  );
}

export function ProfileEmptyState({ text }: { text: string }) {
  return <div className="py-20 text-center text-sm text-gray-400">{text}</div>;
}
