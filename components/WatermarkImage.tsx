// components/WatermarkImage.tsx
'use client';

import { useState } from 'react';

interface WatermarkImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  loading?: 'lazy' | 'eager';
  /** If true, render as antd-compatible plain img (no preview wrapper) */
}

export default function WatermarkImage({
  src,
  alt,
  className,
  style,
  loading = 'lazy',
}: WatermarkImageProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const ext = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aicave_${Date.now()}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(src, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="relative group/wm overflow-hidden" style={{ display: 'block' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={className}
        style={style}
        loading={loading}
      />

      {/* Watermark — always visible, bottom-right */}
      <div className="absolute bottom-2 right-2 pointer-events-none select-none z-10">
        <span className="text-white/50 text-[10px] font-semibold tracking-widest uppercase"
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
          AiCave
        </span>
      </div>

      {/* Download button — appears on hover */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="absolute top-2 right-2 z-20 opacity-0 group-hover/wm:opacity-100 transition-opacity duration-200 w-7 h-7 flex items-center justify-center rounded-lg bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white disabled:opacity-50"
        title="下载原图"
      >
        {downloading ? (
          <div className="w-3 h-3 border border-white/60 border-t-white rounded-full animate-spin" />
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        )}
      </button>
    </div>
  );
}
