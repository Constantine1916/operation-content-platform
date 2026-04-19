'use client';

import { useEffect, useState } from 'react';
import MediaPreviewShell, { formatPreviewTimestamp } from './MediaPreviewShell';

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

function formatAspectRatio(width: number, height: number) {
  if (!width || !height) return '未知';

  const findGcd = (a: number, b: number): number => (b === 0 ? a : findGcd(b, a % b));
  const divisor = findGcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}

function TransformAction({
  label,
  onClick,
  icon,
  className = '',
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-900 ${className}`}
    >
      {icon}
      {label}
    </button>
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
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const currentItemId =
    selectedIndex === null || items.length === 0
      ? null
      : items[Math.min(selectedIndex, items.length - 1)]?.id ?? null;

  useEffect(() => {
    setScale(1);
    setRotation(0);
    setFlipX(false);
    setFlipY(false);
  }, [currentItemId]);

  const resetTransforms = () => {
    setScale(1);
    setRotation(0);
    setFlipX(false);
    setFlipY(false);
  };

  const transform = `scale(${scale * (flipX ? -1 : 1)}, ${scale * (flipY ? -1 : 1)}) rotate(${rotation}deg)`;
  const shellItems = items.map(item => ({
    ...item,
    mediaUrl: item.url,
    authorName: null,
  }));

  return (
    <MediaPreviewShell
      items={shellItems}
      selectedIndex={selectedIndex}
      onClose={onClose}
      onSelect={onSelect}
      mediaLabel="图片预览"
      beforeDownload={beforeDownload ? async () => beforeDownload() : undefined}
      getFavoriteState={getFavoriteState ? (item) => getFavoriteState(item) : undefined}
      onToggleFavorite={onToggleFavorite ? (item) => onToggleFavorite(item) : undefined}
      defaultDownloadExtension="jpg"
      renderStage={({ item }) => (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.url}
            alt={item.prompt}
            className="max-h-[calc(100vh-132px)] w-auto rounded-[28px] border border-black/5 object-contain shadow-[0_40px_90px_-42px_rgba(15,23,42,0.55)]"
            style={{ transform, transition: 'transform 220ms ease-out' }}
          />
        </>
      )}
      getMetaItems={(item, currentIndex) => [
        { label: '尺寸', value: item.width && item.height ? `${item.width} × ${item.height}` : '未知' },
        { label: '比例', value: formatAspectRatio(item.width, item.height) },
        { label: '时间', value: formatPreviewTimestamp(item.created_at) ?? '未知' },
        { label: '编号', value: (currentIndex + 1).toString().padStart(2, '0') },
      ]}
      renderQuickActions={() => (
        <div className="grid grid-cols-2 gap-2.5">
          <TransformAction
            label="放大"
            onClick={() => setScale(current => Math.min(3, Number((current + 0.2).toFixed(2))))}
            icon={(
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 5v14M5 12h14" />
              </svg>
            )}
          />
          <TransformAction
            label="缩小"
            onClick={() => setScale(current => Math.max(0.6, Number((current - 0.2).toFixed(2))))}
            icon={(
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 12h14" />
              </svg>
            )}
          />
          <TransformAction
            label="左转"
            onClick={() => setRotation(current => current - 90)}
            icon={(
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 10H5V6" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 10a7 7 0 111.747 4.622" />
              </svg>
            )}
          />
          <TransformAction
            label="右转"
            onClick={() => setRotation(current => current + 90)}
            icon={(
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10h4V6" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 10a7 7 0 11-1.747 4.622" />
              </svg>
            )}
          />
          <TransformAction
            label="水平镜像"
            onClick={() => setFlipX(current => !current)}
            icon={(
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 7l7 5-7 5V7zM12 7L5 12l7 5" />
              </svg>
            )}
          />
          <TransformAction
            label="垂直镜像"
            onClick={() => setFlipY(current => !current)}
            icon={(
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 12h16" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 12l5 7 5-7H7zM7 12l5-7 5 7" />
              </svg>
            )}
          />
          <TransformAction
            label="重置视图"
            onClick={resetTransforms}
            className="col-span-2 justify-center border-dashed border-gray-300"
            icon={(
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v6h6M20 20v-6h-6" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 14a8 8 0 00-2.343-5.657A8 8 0 006 10M4 10a8 8 0 002.343 5.657A8 8 0 0018 14" />
              </svg>
            )}
          />
        </div>
      )}
    />
  );
}
