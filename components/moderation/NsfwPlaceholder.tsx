export default function NsfwPlaceholder({
  label = 'NSFW',
  className = '',
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={`flex aspect-[9/16] min-h-[220px] w-full flex-col items-center justify-center rounded-xl border border-red-200/70 bg-[radial-gradient(circle_at_top,rgba(254,226,226,0.95),rgba(254,242,242,0.72)_42%,rgba(17,24,39,0.08)_100%)] px-5 text-center ${className}`}>
      <div className="rounded-full border border-red-200 bg-white/85 px-4 py-1.5 text-[11px] font-semibold tracking-[0.28em] text-red-600 shadow-sm">
        {label}
      </div>
      <p className="mt-3 max-w-[220px] text-xs leading-5 text-red-900/70">
        该内容已被管理员标记为不适宜公开展示，原始媒体已隐藏。
      </p>
    </div>
  );
}
