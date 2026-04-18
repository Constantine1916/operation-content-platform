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

  const sizeClasses = variant === 'overlay' ? 'h-[34px] w-[34px]' : 'h-[32px] w-[32px]';
  const iconClasses = variant === 'overlay' ? 'h-[16px] w-[16px]' : 'h-[15px] w-[15px]';
  const baseClasses =
    variant === 'overlay'
      ? 'text-white drop-shadow-[0_12px_20px_rgba(15,23,42,0.75)] hover:-translate-y-0.5'
      : 'text-gray-400 drop-shadow-[0_8px_12px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:text-gray-700';
  const activeClasses =
    variant === 'overlay'
      ? 'text-rose-500 drop-shadow-[0_12px_24px_rgba(244,63,94,0.42)]'
      : 'text-rose-500 drop-shadow-[0_10px_20px_rgba(244,63,94,0.18)] hover:text-rose-600';
  const auraClasses =
    variant === 'overlay'
      ? isFavorite
        ? 'bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.24),rgba(251,113,133,0.18)_32%,rgba(244,63,94,0.06)_56%,transparent_80%)] opacity-100'
        : 'bg-[radial-gradient(circle_at_50%_45%,rgba(15,23,42,0.42),rgba(15,23,42,0.14)_46%,transparent_78%)] opacity-70 group-hover:opacity-100'
      : isFavorite
        ? 'bg-[radial-gradient(circle_at_50%_45%,rgba(251,113,133,0.24),rgba(251,113,133,0.08)_48%,transparent_80%)] opacity-100'
        : 'bg-[radial-gradient(circle_at_50%_45%,rgba(15,23,42,0.1),rgba(15,23,42,0.03)_48%,transparent_80%)] opacity-45 group-hover:opacity-100';

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
      className={`group relative inline-flex shrink-0 items-center justify-center transition-[transform,color,filter,opacity] duration-200 ease-out active:scale-[0.9] disabled:cursor-not-allowed disabled:opacity-60 ${sizeClasses} ${isFavorite ? activeClasses : baseClasses} ${isBursting ? 'favorite-button-pop' : ''} ${className}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -inset-[4px] rounded-full blur-[2px] transition-[opacity,transform] duration-200 ${auraClasses} ${isBursting ? 'favorite-button-burst' : ''}`}
      />
      <svg
        className={`relative z-10 transition-transform duration-200 ease-out ${iconClasses} ${isBursting ? 'favorite-heart-pop' : ''} ${!isFavorite ? 'group-hover:scale-[1.06]' : ''}`}
        viewBox="0 0 24 24"
        fill={isFavorite ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.75"
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
