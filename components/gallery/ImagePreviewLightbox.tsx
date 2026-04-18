'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import FavoriteButton from '@/components/favorites/FavoriteButton';

export interface ImagePreviewItem {
  id: string;
  url: string;
  prompt: string;
  width: number;
  height: number;
  created_at?: string;
  username?: string | null;
  avatar_url?: string | null;
  user_id?: string;
}

interface ImagePreviewLightboxProps {
  items: ImagePreviewItem[];
  selectedIndex: number | null;
  onClose: () => void;
  onSelect: (index: number) => void;
  beforeDownload?: () => Promise<boolean> | boolean;
  getFavoriteState?: (item: ImagePreviewItem) => { isFavorite: boolean; isPending: boolean };
  onToggleFavorite?: (item: ImagePreviewItem) => void;
}

function formatTimestamp(value?: string) {
  if (!value) return null;
  return new Date(value).toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour12: false,
  });
}

function formatAspectRatio(width: number, height: number) {
  if (!width || !height) return '未知';

  const findGcd = (a: number, b: number): number => (b === 0 ? a : findGcd(b, a % b));
  const divisor = findGcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}

function PreviewIconButton({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/5 bg-white text-gray-500 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.32)] transition-all duration-200 hover:-translate-y-px hover:border-gray-300 hover:text-gray-800"
    >
      {children}
    </button>
  );
}

function PreviewMetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">{label}</div>
      <div className="mt-1 text-sm font-medium leading-6 text-gray-800">{value}</div>
    </div>
  );
}

function PreviewAuthor({
  username,
  avatarUrl,
  fallback,
}: {
  username: string | null;
  avatarUrl: string | null;
  fallback: string;
}) {
  const initial = (username ?? fallback).charAt(0).toUpperCase();

  const avatar = avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarUrl}
      alt={initial}
      className="h-10 w-10 rounded-full object-cover ring-1 ring-black/5"
    />
  ) : (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
      {initial}
    </div>
  );

  const name = username ?? fallback;

  if (username) {
    return (
      <Link
        href={`/profile/${username}`}
        className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-3 py-3 transition-colors hover:border-gray-200 hover:bg-gray-50"
      >
        {avatar}
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">创作者</div>
          <div className="truncate text-sm font-medium text-gray-900">@{name}</div>
        </div>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-3 py-3">
      {avatar}
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">创作者</div>
        <div className="truncate text-sm font-medium text-gray-900">{name}</div>
      </div>
    </div>
  );
}

export default function ImagePreviewLightbox({
  items,
  selectedIndex,
  onClose,
  onSelect,
  beforeDownload,
  getFavoriteState,
  onToggleFavorite,
}: ImagePreviewLightboxProps) {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const currentIndex =
    selectedIndex === null || items.length === 0
      ? null
      : Math.min(selectedIndex, items.length - 1);

  const item = currentIndex === null ? null : items[currentIndex];
  const favoriteState = item && getFavoriteState ? getFavoriteState(item) : null;
  const hasPrev = currentIndex !== null && currentIndex > 0;
  const hasNext = currentIndex !== null && currentIndex < items.length - 1;

  useEffect(() => {
    if (!item) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft' && hasPrev && currentIndex !== null) onSelect(currentIndex - 1);
      if (event.key === 'ArrowRight' && hasNext && currentIndex !== null) onSelect(currentIndex + 1);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex, hasNext, hasPrev, item, onClose, onSelect]);

  useEffect(() => {
    setCopiedPrompt(false);
    setCopiedLink(false);
  }, [item?.id]);

  if (!item || currentIndex === null) return null;

  const fallbackName = item.user_id ? item.user_id.slice(0, 8) : '匿名用户';
  const createdAtText = formatTimestamp(item.created_at) ?? '未知';
  const sizeText = item.width && item.height ? `${item.width} × ${item.height}` : '未知';
  const ratioText = formatAspectRatio(item.width, item.height);

  const handleDownload = async () => {
    if (beforeDownload && !(await beforeDownload())) return;

    try {
      const res = await fetch(item.url);
      const blob = await res.blob();
      const ext = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aicave_${Date.now()}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(item.url, '_blank');
    }
  };

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(item.prompt);
    setCopiedPrompt(true);
    window.setTimeout(() => setCopiedPrompt(false), 1500);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(item.url);
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 1500);
  };

  return (
    <div
      className="fixed inset-0 z-[1000] bg-[#f3f1ed]/95 backdrop-blur-md"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex h-full flex-col lg:flex-row">
        <div className="relative flex min-h-[52vh] flex-1 items-center justify-center overflow-hidden px-4 pb-4 pt-16 lg:min-h-0 lg:px-8 lg:py-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.92),rgba(243,241,237,0.25)_38%,rgba(232,229,224,0.45)_100%)]" />
          <div className="pointer-events-none absolute inset-x-12 bottom-8 h-16 rounded-full bg-black/5 blur-3xl" />

          <button
            type="button"
            aria-label="关闭预览"
            onClick={onClose}
            className="absolute left-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-black/5 bg-white/90 text-gray-500 shadow-[0_14px_34px_-24px_rgba(15,23,42,0.5)] transition-all duration-200 hover:text-gray-900 lg:left-6 lg:top-6"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="absolute right-4 top-4 rounded-full border border-black/5 bg-white/80 px-3 py-1.5 text-[11px] font-medium tracking-[0.18em] text-gray-500 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.32)] lg:right-6 lg:top-6">
            {(currentIndex + 1).toString().padStart(2, '0')} / {items.length.toString().padStart(2, '0')}
          </div>

          {hasPrev && (
            <button
              type="button"
              aria-label="上一张"
              onClick={() => onSelect(currentIndex - 1)}
              className="absolute left-4 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-2xl border border-black/5 bg-white/90 text-gray-500 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.38)] transition-all duration-200 hover:-translate-y-[calc(50%+1px)] hover:text-gray-900 lg:left-6"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {hasNext && (
            <button
              type="button"
              aria-label="下一张"
              onClick={() => onSelect(currentIndex + 1)}
              className="absolute right-4 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-2xl border border-black/5 bg-white/90 text-gray-500 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.38)] transition-all duration-200 hover:-translate-y-[calc(50%+1px)] hover:text-gray-900 lg:right-6"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          <div className="relative z-10 flex max-h-full max-w-[min(980px,100%-24px)] items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url}
              alt={item.prompt}
              className="max-h-[calc(100vh-132px)] w-auto rounded-[28px] border border-black/5 object-contain shadow-[0_40px_90px_-42px_rgba(15,23,42,0.55)]"
            />
            <div className="pointer-events-none absolute bottom-4 right-4 rounded-full bg-black/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-white/82 backdrop-blur-sm">
              AiCave
            </div>
          </div>
        </div>

        <aside className="flex w-full shrink-0 flex-col border-t border-black/5 bg-white/88 shadow-[-24px_0_64px_-44px_rgba(15,23,42,0.35)] backdrop-blur-xl lg:w-[380px] lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-5 lg:px-6">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">图片预览</div>
              <div className="mt-1 text-sm font-medium text-gray-500">沉浸式查看与操作</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-[0_12px_28px_-22px_rgba(15,23,42,0.35)] transition-all duration-200 hover:-translate-y-px hover:border-gray-300"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                下载
              </button>

              {item && favoriteState && onToggleFavorite && (
                <FavoriteButton
                  isFavorite={favoriteState.isFavorite}
                  isPending={favoriteState.isPending}
                  onToggle={() => onToggleFavorite(item)}
                />
              )}

              <PreviewIconButton title={copiedLink ? '链接已复制' : '复制图片链接'} onClick={() => { void handleCopyLink(); }}>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 11-5.656-5.656l1.5-1.5M10.172 13.828a4 4 0 010-5.656l3-3a4 4 0 115.656 5.656l-1.5 1.5" />
                </svg>
              </PreviewIconButton>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-6 pt-5 lg:px-6">
            <PreviewAuthor
              username={item.username ?? null}
              avatarUrl={item.avatar_url ?? null}
              fallback={fallbackName}
            />

            <div className="mt-5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-400">图片提示词</div>
              <p className="mt-3 text-[15px] leading-7 text-gray-800">
                {item.prompt || '暂无提示词'}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <PreviewMetaCard label="尺寸" value={sizeText} />
              <PreviewMetaCard label="比例" value={ratioText} />
              <PreviewMetaCard label="时间" value={createdAtText} />
              <PreviewMetaCard label="编号" value={(currentIndex + 1).toString().padStart(2, '0')} />
            </div>

            <div className="mt-5 rounded-[24px] border border-gray-100 bg-[linear-gradient(180deg,rgba(250,250,250,0.96),rgba(244,244,244,0.94))] p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-400">快捷操作</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => { void handleCopyPrompt(); }}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-900"
                >
                  {copiedPrompt ? '提示词已复制' : '复制提示词'}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-900"
                >
                  下载原图
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
