'use client';

import { useEffect, useRef, useState } from 'react';

interface FavoriteButtonProps {
  isFavorite: boolean;
  isPending?: boolean;
  onToggle: (event: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: 'overlay' | 'surface';
  className?: string;
}

const FAVORITE_BURST_DURATION_MS = 420;

export default function FavoriteButton({
  isFavorite,
  isPending = false,
  onToggle,
  variant = 'surface',
  className = '',
}: FavoriteButtonProps) {
  const [isBursting, setIsBursting] = useState(false);
  const previousFavoriteRef = useRef(isFavorite);

  useEffect(() => {
    if (!previousFavoriteRef.current && isFavorite) {
      setIsBursting(true);
      const timer = window.setTimeout(() => setIsBursting(false), FAVORITE_BURST_DURATION_MS);
      previousFavoriteRef.current = isFavorite;
      return () => window.clearTimeout(timer);
    }

    previousFavoriteRef.current = isFavorite;
  }, [isFavorite]);

  const sizeClasses = variant === 'overlay' ? 'h-[30px] w-[30px]' : 'h-[31px] w-[31px]';
  const iconClasses = variant === 'overlay' ? 'h-[13px] w-[13px]' : 'h-[14px] w-[14px]';
  const baseClasses =
    variant === 'overlay'
      ? 'border border-white/18 bg-black/22 text-white shadow-[0_12px_30px_-18px_rgba(15,23,42,0.95)] backdrop-blur-md hover:-translate-y-px hover:border-white/32 hover:bg-black/30'
      : 'border border-black/5 bg-white/92 text-gray-400 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.35)] backdrop-blur-sm hover:-translate-y-px hover:border-gray-300 hover:text-gray-700 hover:shadow-[0_14px_28px_-20px_rgba(15,23,42,0.38)]';
  const activeClasses =
    variant === 'overlay'
      ? 'border-white/60 bg-white/92 text-rose-500 shadow-[0_14px_28px_-16px_rgba(244,63,94,0.5)]'
      : 'border-rose-200 bg-rose-50/95 text-rose-500 shadow-[0_14px_28px_-20px_rgba(244,63,94,0.45)] hover:text-rose-600 hover:border-rose-300';

  return (
    <button
      type="button"
      aria-label={isFavorite ? '取消收藏' : '收藏'}
      aria-pressed={isFavorite}
      title={isFavorite ? '取消收藏' : '收藏'}
      disabled={isPending}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle(event);
      }}
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full transition-[transform,background-color,border-color,color,box-shadow,opacity] duration-200 ease-out active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${sizeClasses} ${isFavorite ? activeClasses : baseClasses} ${isBursting ? 'favorite-button-pop' : ''} ${className}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 rounded-full ${
          isFavorite
            ? 'bg-[radial-gradient(circle_at_35%_35%,rgba(251,113,133,0.26),rgba(251,113,133,0.08)_45%,transparent_72%)] opacity-100'
            : variant === 'overlay'
              ? 'bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.16),rgba(255,255,255,0.02)_48%,transparent_74%)] opacity-100'
              : 'opacity-0'
        } ${isBursting ? 'favorite-button-burst' : ''}`}
      />
      <svg
        className={`relative z-10 transition-transform duration-200 ${iconClasses} ${isBursting ? 'favorite-heart-pop' : ''}`}
        viewBox="0 0 24 24"
        fill={isFavorite ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.9"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12.001 20.727l-.668-.607C6.258 15.508 3 12.55 3 8.922 3 5.964 5.26 3.75 8.1 3.75c1.608 0 3.152.736 4.151 1.95 1-1.214 2.543-1.95 4.151-1.95C19.24 3.75 21.5 5.964 21.5 8.922c0 3.628-3.258 6.586-8.333 11.198l-.666.607z"
        />
      </svg>
    </button>
  );
}
