'use client';

import MediaPreviewShell, { formatPreviewTimestamp } from './MediaPreviewShell';
import type { PublicVideo } from '@/lib/server/public-content';

export interface VideoPreviewLightboxProps {
  items: PublicVideo[];
  selectedIndex: number | null;
  onClose: () => void;
  onSelect: (index: number) => void;
  beforeDownload?: () => Promise<boolean> | boolean;
  getFavoriteState?: (item: PublicVideo) => { isFavorite: boolean; isPending: boolean };
  onToggleFavorite?: (item: PublicVideo) => void;
}

export default function VideoPreviewLightbox({
  items,
  selectedIndex,
  onClose,
  onSelect,
  beforeDownload,
  getFavoriteState,
  onToggleFavorite,
}: VideoPreviewLightboxProps) {
  const shellItems = items.map(item => ({
    ...item,
    mediaUrl: item.video_url ?? '',
    authorName: item.author ?? null,
  }));

  return (
    <MediaPreviewShell
      items={shellItems}
      selectedIndex={selectedIndex}
      onClose={onClose}
      onSelect={onSelect}
      mediaLabel="视频预览"
      beforeDownload={beforeDownload ? async () => beforeDownload() : undefined}
      getFavoriteState={getFavoriteState ? (item) => getFavoriteState(item) : undefined}
      onToggleFavorite={onToggleFavorite ? (item) => onToggleFavorite(item) : undefined}
      defaultDownloadExtension="mp4"
      renderStage={({ item }) => (
        item.mediaUrl ? (
          <video
            key={item.id}
            src={item.mediaUrl}
            controls
            playsInline
            autoPlay
            preload="metadata"
            className="max-h-[calc(100vh-132px)] max-w-full rounded-[28px] border border-black/5 bg-black object-contain shadow-[0_40px_90px_-42px_rgba(15,23,42,0.55)]"
          />
        ) : (
          <div className="flex min-h-[320px] min-w-[min(720px,80vw)] items-center justify-center rounded-[28px] border border-black/5 bg-black/80 px-8 text-sm text-white/70 shadow-[0_40px_90px_-42px_rgba(15,23,42,0.55)]">
            当前视频暂不可预览
          </div>
        )
      )}
      getMetaItems={(item, currentIndex) => [
        { label: '模型', value: item.model ?? '未知' },
        { label: '平台', value: item.platform || '未知' },
        { label: '时间', value: formatPreviewTimestamp(item.created_at) ?? '未知' },
        { label: '编号', value: (currentIndex + 1).toString().padStart(2, '0') },
      ]}
    />
  );
}
