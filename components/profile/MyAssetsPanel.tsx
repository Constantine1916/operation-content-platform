'use client';

import { useEffect, useRef, useState } from 'react';
import Masonry from 'react-masonry-css';
import { message } from 'antd';
import { useFavoriteStatuses } from '@/components/favorites/useFavoriteStatuses';
import { useFavoriteToggle } from '@/components/favorites/useFavoriteToggle';
import {
  ProfileEmptyState,
  ProfileImageCard,
  ProfileVideoCard,
  type ProfileContentImage,
  type ProfileContentVideo,
} from '@/components/profile/ProfileContentCards';
import {
  PROFILE_CENTER_ASSET_TABS,
  type ProfileCenterAssetTab,
} from '@/components/profile/profile-center-tabs';
import { getFavoriteButtonState } from '@/lib/favorite-view-model';
import { getProfileTabCount } from '@/lib/profile-tab-count';
import { supabase } from '@/lib/supabase';

const BREAKPOINTS = { default: 4, 1280: 4, 1024: 3, 768: 2, 640: 1 };
const PAGE_LIMIT = 20;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const DAILY_UPLOAD_LIMITS: Record<number, number> = {
  0: 5,
  1: 10,
  2: 500,
};

interface PendingUploadItem {
  id: string;
  file: File;
  prompt: string;
  width: number;
  height: number;
}

export default function MyAssetsPanel({ userId }: { userId: string }) {
  const [activeTab, setActiveTab] = useState<ProfileCenterAssetTab>('images');
  const [images, setImages] = useState<ProfileContentImage[]>([]);
  const [videos, setVideos] = useState<ProfileContentVideo[]>([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(true);
  const [imagesLoadingMore, setImagesLoadingMore] = useState(false);
  const [videosLoadingMore, setVideosLoadingMore] = useState(false);
  const [imagesHasMore, setImagesHasMore] = useState(true);
  const [videosHasMore, setVideosHasMore] = useState(true);
  const [totalImages, setTotalImages] = useState(0);
  const [totalVideos, setTotalVideos] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pendingUploads, setPendingUploads] = useState<PendingUploadItem[]>([]);
  const [vipLevel, setVipLevel] = useState(0);
  const imagePageRef = useRef(1);
  const videoPageRef = useRef(1);
  const imageUploadInputRef = useRef<HTMLInputElement>(null);

  const { favoriteIds: imageFavoriteIds, setFavoriteIds: setImageFavoriteIds } = useFavoriteStatuses(
    'image',
    images.map(image => image.id),
  );
  const { pendingIds: imagePendingIds, toggleFavorite: toggleImageFavorite } = useFavoriteToggle({
    contentType: 'image',
    setFavoriteIds: setImageFavoriteIds,
  });

  const { favoriteIds: videoFavoriteIds, setFavoriteIds: setVideoFavoriteIds } = useFavoriteStatuses(
    'video',
    videos.map(video => video.id),
  );
  const { pendingIds: videoPendingIds, toggleFavorite: toggleVideoFavorite } = useFavoriteToggle({
    contentType: 'video',
    setFavoriteIds: setVideoFavoriteIds,
  });

  useEffect(() => {
    fetchImages(1, true);
    fetchVideos(1, true);
    fetchVipLevel();
  }, [userId]);

  async function fetchVipLevel() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setVipLevel(Number(data.data?.vip_level ?? 0));
      }
    } catch {
      setVipLevel(0);
    }
  }

  async function fetchImages(page: number, isFirst = false) {
    if (isFirst) setImagesLoading(true);
    else setImagesLoadingMore(true);

    try {
      const res = await fetch(`/api/gallery?user_id=${encodeURIComponent(userId)}&page=${page}&limit=${PAGE_LIMIT}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? '加载图片失败');
      setImages(prev => page === 1 ? data.items : [...prev, ...data.items]);
      setImagesHasMore(Boolean(data.hasMore));
      setTotalImages(data.total ?? 0);
      imagePageRef.current = page;
    } finally {
      setImagesLoading(false);
      setImagesLoadingMore(false);
    }
  }

  async function fetchVideos(page: number, isFirst = false) {
    if (isFirst) setVideosLoading(true);
    else setVideosLoadingMore(true);

    try {
      const params = new URLSearchParams({
        user_id: userId,
        page: String(page),
        limit: String(PAGE_LIMIT),
      });
      const res = await fetch(`/api/ai-video?${params}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? '加载视频失败');
      setVideos(prev => page === 1 ? data.data : [...prev, ...data.data]);
      setVideosHasMore(data.pagination.page < data.pagination.totalPages);
      setTotalVideos(data.pagination.total ?? 0);
      videoPageRef.current = page;
    } finally {
      setVideosLoading(false);
      setVideosLoadingMore(false);
    }
  }

  async function resolveImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const image = new window.Image();
      image.onload = () => {
        resolve({ width: image.naturalWidth, height: image.naturalHeight });
        URL.revokeObjectURL(objectUrl);
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('无法读取图片尺寸'));
      };
      image.src = objectUrl;
    });
  }

  async function handleImageSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;

    try {
      const invalidType = files.find(file => !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type));
      if (invalidType) {
        throw new Error(`仅支持 JPG/PNG/WebP/GIF 格式：${invalidType.name}`);
      }

      const oversized = files.find(file => file.size > MAX_FILE_SIZE_BYTES);
      if (oversized) {
        throw new Error(`单张图片大小不能超过 10MB：${oversized.name}`);
      }

      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      if (totalSize > files.length * MAX_FILE_SIZE_BYTES) {
        throw new Error(`本次批量上传总大小不能超过 ${files.length * 10}MB`);
      }

      const items = await Promise.all(
        files.map(async (file) => {
          const { width, height } = await resolveImageDimensions(file);
          return {
            id: `${file.name}-${file.lastModified}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
            file,
            prompt: file.name.replace(/\.[^/.]+$/, ''),
            width,
            height,
          };
        })
      );

      setPendingUploads(current => [...current, ...items]);
    } catch (error: any) {
      message.error(error.message ?? '选择图片失败');
    }
  }

  function updatePendingPrompt(id: string, prompt: string) {
    setPendingUploads(current =>
      current.map(item => (item.id === id ? { ...item, prompt } : item))
    );
  }

  function removePendingUpload(id: string) {
    setPendingUploads(current => current.filter(item => item.id !== id));
  }

  async function handleSubmitUploads() {
    if (pendingUploads.length === 0) {
      message.error('请先选择图片');
      return;
    }

    if (pendingUploads.some(item => !item.prompt.trim())) {
      message.error('请为每张图片填写提示词');
      return;
    }

    setUploadingImage(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('请先登录后再上传图片');
      }

      const formData = new FormData();
      pendingUploads.forEach(item => {
        formData.append('files', item.file);
      });
      formData.append('prompts', JSON.stringify(pendingUploads.map(item => item.prompt.trim())));
      formData.append('widths', JSON.stringify(pendingUploads.map(item => item.width)));
      formData.append('heights', JSON.stringify(pendingUploads.map(item => item.height)));

      const res = await fetch('/api/profile/images/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? '上传图片失败');
      }

      message.success(`成功上传 ${pendingUploads.length} 张图片`);
      setPendingUploads([]);
      await fetchImages(1, true);
      await fetchVipLevel();
      setActiveTab('images');
    } catch (error: any) {
      message.error(error.message ?? '上传图片失败');
    } finally {
      setUploadingImage(false);
    }
  }

  const uploadLimit = DAILY_UPLOAD_LIMITS[vipLevel] ?? DAILY_UPLOAD_LIMITS[2];
  const uploadPlanLabel = vipLevel >= 2 ? 'SVIP' : vipLevel >= 1 ? 'VIP' : '免费';
  const pendingTotalSizeMb = (pendingUploads.reduce((sum, item) => sum + item.file.size, 0) / (1024 * 1024)).toFixed(1);

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4 border-b border-gray-100">
        <div className="flex gap-0">
          {PROFILE_CENTER_ASSET_TABS.map(tab => {
            const count = getProfileTabCount(tab.key, { totalImages, totalVideos });
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab.key ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab.label}
                {count !== null && <span className="ml-1.5 text-xs text-gray-400 tabular-nums">{count}</span>}
                {activeTab === tab.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-gray-900" />}
              </button>
            );
          })}
        </div>

        {activeTab === 'images' && (
          <div className="pb-2">
            <input
              ref={imageUploadInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleImageSelection}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => imageUploadInputRef.current?.click()}
                disabled={uploadingImage}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:border-gray-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 5v14M5 12h14" />
                </svg>
                上传图片
              </button>
              {pendingUploads.length > 0 && (
                <button
                  type="button"
                  onClick={handleSubmitUploads}
                  disabled={uploadingImage}
                  className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploadingImage ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : null}
                  {uploadingImage ? '上传中...' : `上传 ${pendingUploads.length > 0 ? pendingUploads.length : ''} 张`}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {activeTab === 'images' && (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">上传图片</div>
              <div className="mt-2 text-sm text-gray-600">
                当前会员：<span className="font-medium text-gray-900">{uploadPlanLabel}</span>
                ，每日最多上传 <span className="font-medium text-gray-900">{uploadLimit}</span> 张图片。
                单张图片不超过 <span className="font-medium text-gray-900">10MB</span>，支持多张批量上传。
              </div>
            </div>
            {pendingUploads.length > 0 && (
              <div className="text-sm text-gray-500">
                已选择 <span className="font-medium text-gray-900">{pendingUploads.length}</span> 张，
                合计 <span className="font-medium text-gray-900">{pendingTotalSizeMb}MB</span>
              </div>
            )}
          </div>

          {pendingUploads.length > 0 && (
            <div className="mt-4 space-y-3">
              {pendingUploads.map(item => (
                <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-3 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gray-900">{item.file.name}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      {item.width} × {item.height} · {(item.file.size / (1024 * 1024)).toFixed(1)}MB
                    </div>
                  </div>
                  <input
                    type="text"
                    value={item.prompt}
                    onChange={(event) => updatePendingPrompt(item.id, event.target.value)}
                    placeholder="请输入这张图片的提示词"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-400 lg:w-[340px]"
                  />
                  <button
                    type="button"
                    onClick={() => removePendingUpload(item.id)}
                    className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-900"
                  >
                    移除
                  </button>
                </div>
              ))}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPendingUploads([])}
                  disabled={uploadingImage}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 disabled:opacity-60"
                >
                  清空列表
                </button>
                <button
                  type="button"
                  onClick={handleSubmitUploads}
                  disabled={uploadingImage}
                  className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-60"
                >
                  {uploadingImage ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : null}
                  {uploadingImage ? '上传中...' : `提交 ${pendingUploads.length} 张图片`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'images' && (
        <AssetSection
          loading={imagesLoading}
          loadingMore={imagesLoadingMore}
          hasMore={imagesHasMore}
          isEmpty={images.length === 0}
          emptyText="暂无公开图片"
          onLoadMore={() => fetchImages(imagePageRef.current + 1)}
        >
          <Masonry breakpointCols={BREAKPOINTS} className="flex gap-4" columnClassName="flex flex-col gap-4">
            {images.map((image, index) => (
              <ProfileImageCard
                key={`${image.id}-${index}`}
                image={image}
                {...getFavoriteButtonState(image.id, imageFavoriteIds, imagePendingIds)}
                onToggleFavorite={() => toggleImageFavorite(image.id, !imageFavoriteIds.has(image.id))}
              />
            ))}
          </Masonry>
        </AssetSection>
      )}

      {activeTab === 'videos' && (
        <AssetSection
          loading={videosLoading}
          loadingMore={videosLoadingMore}
          hasMore={videosHasMore}
          isEmpty={videos.length === 0}
          emptyText="暂无视频"
          onLoadMore={() => fetchVideos(videoPageRef.current + 1)}
        >
          <Masonry breakpointCols={BREAKPOINTS} className="flex gap-4" columnClassName="flex flex-col gap-4">
            {videos.map((video, index) => (
              <ProfileVideoCard
                key={`${video.id}-${index}`}
                video={video}
                {...getFavoriteButtonState(video.id, videoFavoriteIds, videoPendingIds)}
                onToggleFavorite={() => toggleVideoFavorite(video.id, !videoFavoriteIds.has(video.id))}
              />
            ))}
          </Masonry>
        </AssetSection>
      )}

      {activeTab === 'courses' && <ProfileEmptyState text="暂无 AI 课程" />}
    </div>
  );
}

function AssetSection({
  loading,
  loadingMore,
  hasMore,
  isEmpty,
  emptyText,
  onLoadMore,
  children,
}: {
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  isEmpty: boolean;
  emptyText: string;
  onLoadMore: () => void;
  children: React.ReactNode;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
      </div>
    );
  }

  if (isEmpty) {
    return <ProfileEmptyState text={emptyText} />;
  }

  return (
    <>
      {children}
      <div className="mt-8 flex justify-center">
        {hasMore ? (
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 disabled:opacity-60"
          >
            {loadingMore ? '加载中...' : '加载更多'}
          </button>
        ) : (
          <div className="text-xs text-gray-400">已经到底了</div>
        )}
      </div>
    </>
  );
}
