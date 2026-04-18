'use client';

interface FavoriteButtonProps {
  isFavorite: boolean;
  isPending?: boolean;
  onToggle: (event: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: 'overlay' | 'surface';
  className?: string;
}

export default function FavoriteButton({
  isFavorite,
  isPending = false,
  onToggle,
  variant = 'surface',
  className = '',
}: FavoriteButtonProps) {
  const baseClasses =
    variant === 'overlay'
      ? 'bg-black/35 text-white backdrop-blur-sm hover:bg-black/50'
      : 'bg-white text-gray-500 ring-1 ring-gray-200 hover:text-gray-700 hover:ring-gray-300';
  const activeClasses =
    variant === 'overlay'
      ? 'bg-white/95 text-rose-500'
      : 'bg-rose-50 text-rose-500 ring-1 ring-rose-200 hover:text-rose-600 hover:ring-rose-300';

  return (
    <button
      type="button"
      aria-label={isFavorite ? '取消收藏' : '收藏'}
      aria-pressed={isFavorite}
      disabled={isPending}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle(event);
      }}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-all disabled:cursor-not-allowed disabled:opacity-60 ${isFavorite ? activeClasses : baseClasses} ${className}`}
    >
      <svg
        className="h-4.5 w-4.5"
        viewBox="0 0 24 24"
        fill={isFavorite ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
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
