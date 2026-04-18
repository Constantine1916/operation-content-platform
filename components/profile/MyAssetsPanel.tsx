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
  previewUrl: string;
}

function formatUploadSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))}KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)}MB`;
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
  const pendingUploadsRef = useRef<PendingUploadItem[]>([]);

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

  useEffect(() => {
    pendingUploadsRef.current = pendingUploads;
  }, [pendingUploads]);

  useEffect(() => {
    return () => {
      pendingUploadsRef.current.forEach(item => {
        URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

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
            previewUrl: URL.createObjectURL(file),
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
    setPendingUploads(current => {
      const removed = current.find(item => item.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return current.filter(item => item.id !== id);
    });
  }

  function clearPendingUploads() {
    setPendingUploads(current => {
      current.forEach(item => {
        URL.revokeObjectURL(item.previewUrl);
      });
      return [];
    });
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
      clearPendingUploads();
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
      <div className="mb-6 border-b border-gray-100">
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
      </div>

      {activeTab === 'images' && (
        <div className="mb-6 overflow-hidden rounded-[28px] border border-gray-200 bg-gradient-to-br from-white via-white to-gray-50/90 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.28)]">
          <input
            ref={imageUploadInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleImageSelection}
          />

          <div className="relative p-5 sm:p-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-gray-100/80 via-white/0 to-transparent" />

            <div className="relative flex flex-col gap-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-2xl">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-400">
                    图片上传工作台
                  </div>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight text-gray-950">
                    批量上传 AI 图片
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600">
                    当前为
                    <span className="mx-1 font-medium text-gray-950">{uploadPlanLabel}</span>
                    会员，每日最多可上传
                    <span className="mx-1 font-medium text-gray-950">{uploadLimit}</span>
                    张图片。支持 JPG、PNG、WebP、GIF，单张大小不超过
                    <span className="mx-1 font-medium text-gray-950">10MB</span>。
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="min-w-[140px] rounded-2xl border border-gray-200 bg-white/90 px-4 py-3 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.25)]">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                      今日额度
                    </div>
                    <div className="mt-2 text-sm font-medium text-gray-900">
                      {uploadPlanLabel} · {uploadLimit} 张/日
                    </div>
                  </div>
                  <div className="min-w-[160px] rounded-2xl border border-gray-200 bg-white/90 px-4 py-3 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.25)]">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                      当前队列
                    </div>
                    <div className="mt-2 text-sm font-medium text-gray-900">
                      {pendingUploads.length} 张 · {pendingTotalSizeMb}MB
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-[24px] border border-gray-200/80 bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm leading-6 text-gray-500">
                  先选择图片，再逐张完善提示词。批量上传时，编辑区会保留你已输入的内容。
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => imageUploadInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.4)] transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:text-gray-950 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 5v14M5 12h14" />
                    </svg>
                    {pendingUploads.length > 0 ? '继续添加图片' : '选择图片'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmitUploads}
                    disabled={uploadingImage || pendingUploads.length === 0}
                    className="inline-flex items-center gap-2 rounded-full bg-gray-950 px-4 py-2.5 text-sm font-medium text-white shadow-[0_18px_40px_-24px_rgba(17,17,17,0.7)] transition-all hover:-translate-y-0.5 hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploadingImage ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                    ) : null}
                    {uploadingImage ? '上传中...' : pendingUploads.length > 0 ? `提交 ${pendingUploads.length} 张图片` : '等待选择图片'}
                  </button>
                </div>
              </div>

              {pendingUploads.length > 0 ? (
                <div className="space-y-4">
                  {pendingUploads.map(item => (
                    <div
                      key={item.id}
                      className="group relative overflow-hidden rounded-[26px] border border-gray-200 bg-white p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.3)] transition-all hover:border-gray-300 hover:shadow-[0_24px_54px_-36px_rgba(15,23,42,0.34)] sm:p-5"
                    >
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-gray-100/75 via-white/0 to-transparent opacity-70" />

                      <div className="relative grid gap-4 lg:grid-cols-[112px_minmax(0,1fr)]">
                        <div className="overflow-hidden rounded-[20px] border border-gray-200 bg-gray-100 shadow-inner">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.previewUrl}
                            alt={item.prompt || item.file.name}
                            className="h-28 w-full object-cover"
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-gray-950">
                                {item.file.name}
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600">
                                  {item.width} × {item.height}
                                </span>
                                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600">
                                  {formatUploadSize(item.file.size)}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => removePendingUpload(item.id)}
                              className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-900"
                            >
                              移除
                            </button>
                          </div>

                          <div className="mt-4">
                            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                              图片提示词
                            </div>
                            <div className="rounded-[22px] border border-gray-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_24px_-24px_rgba(15,23,42,0.4)] transition-all focus-within:border-gray-400 focus-within:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_16px_36px_-28px_rgba(15,23,42,0.45)]">
                              <textarea
                                value={item.prompt}
                                onChange={(event) => updatePendingPrompt(item.id, event.target.value)}
                                placeholder="请输入这张图片的提示词，建议包含主体、风格、镜头、光线、构图等信息"
                                rows={4}
                                spellCheck={false}
                                className="min-h-[118px] w-full resize-y rounded-[22px] bg-transparent px-4 py-3.5 text-sm leading-6 text-gray-900 outline-none placeholder:text-gray-400"
                              />
                            </div>
                            <div className="mt-2 text-xs text-gray-400">
                              提示词会和图片一起提交，上传前请确认每张图片都已填写完整。
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex flex-col gap-2 border-t border-gray-100 pt-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-gray-500">
                      已准备
                      <span className="mx-1 font-medium text-gray-950">{pendingUploads.length}</span>
                      张图片，合计
                      <span className="mx-1 font-medium text-gray-950">{pendingTotalSizeMb}MB</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={clearPendingUploads}
                        disabled={uploadingImage}
                        className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 disabled:opacity-60"
                      >
                        清空列表
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmitUploads}
                        disabled={uploadingImage}
                        className="inline-flex items-center gap-2 rounded-full bg-gray-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-60"
                      >
                        {uploadingImage ? (
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                        ) : null}
                        {uploadingImage ? '上传中...' : `确认上传 ${pendingUploads.length} 张`}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-gray-200 bg-white/70 px-6 py-10 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M12 16V7m0 0-3.5 3.5M12 7l3.5 3.5M5 17.5A2.5 2.5 0 0 0 7.5 20h9a2.5 2.5 0 0 0 2.5-2.5" />
                    </svg>
                  </div>
                  <div className="mt-4 text-base font-medium text-gray-900">先选择图片，再统一编辑提示词</div>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                    上传区会按工作台方式展示已选图片。你可以逐张完善提示词，确认无误后再一次性提交。
                  </p>
                </div>
              )}
            </div>
          </div>
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
