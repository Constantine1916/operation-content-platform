'use client';

import { useEffect, useState } from 'react';
import Masonry from 'react-masonry-css';
import FavoriteButton from '@/components/favorites/FavoriteButton';
import { useFavoriteToggle } from '@/components/favorites/useFavoriteToggle';
import {
  ProfileArticleCard,
  ProfileEmptyState,
  ProfileHotspotCard,
  ProfileImageCard,
  ProfileVideoCard,
  type ProfileContentArticle,
  type ProfileContentHotspot,
  type ProfileContentImage,
  type ProfileContentVideo,
} from '@/components/profile/ProfileContentCards';
import {
  PROFILE_CENTER_FAVORITE_TABS,
  type ProfileCenterFavoriteTab,
} from '@/components/profile/profile-center-tabs';
import { supabase } from '@/lib/supabase';

const IMAGE_BREAKPOINTS = { default: 4, 1280: 4, 1024: 3, 768: 2, 640: 2 };
const VIDEO_BREAKPOINTS = { default: 4, 1280: 4, 1024: 3, 768: 2, 640: 1 };

const FAVORITE_TYPE_BY_TAB = {
  images: 'image',
  videos: 'video',
  hotspots: 'hotspot',
  articles: 'article',
} as const;

type FavoriteItemsState = {
  images: ProfileContentImage[];
  videos: ProfileContentVideo[];
  hotspots: ProfileContentHotspot[];
  articles: ProfileContentArticle[];
};

type FavoriteBooleanState = Record<ProfileCenterFavoriteTab, boolean>;
type FavoriteNumberState = Record<ProfileCenterFavoriteTab, number>;

const EMPTY_ITEMS: FavoriteItemsState = {
  images: [],
  videos: [],
  hotspots: [],
  articles: [],
};

const EMPTY_BOOLEAN_STATE: FavoriteBooleanState = {
  images: false,
  videos: false,
  hotspots: false,
  articles: false,
};

const EMPTY_NUMBER_STATE: FavoriteNumberState = {
  images: 1,
  videos: 1,
  hotspots: 1,
  articles: 1,
};

export default function MyFavoritesPanel() {
  const [activeTab, setActiveTab] = useState<ProfileCenterFavoriteTab>('images');
  const [itemsByTab, setItemsByTab] = useState<FavoriteItemsState>(EMPTY_ITEMS);
  const [loadingByTab, setLoadingByTab] = useState<FavoriteBooleanState>({
    ...EMPTY_BOOLEAN_STATE,
    images: true,
  });
  const [loadingMoreByTab, setLoadingMoreByTab] = useState<FavoriteBooleanState>(EMPTY_BOOLEAN_STATE);
  const [loadedByTab, setLoadedByTab] = useState<FavoriteBooleanState>(EMPTY_BOOLEAN_STATE);
  const [hasMoreByTab, setHasMoreByTab] = useState<FavoriteBooleanState>({
    images: true,
    videos: true,
    hotspots: true,
    articles: true,
  });
  const [pageByTab, setPageByTab] = useState<FavoriteNumberState>(EMPTY_NUMBER_STATE);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [selectedArticle, setSelectedArticle] = useState<ProfileContentArticle | null>(null);

  const currentItems = itemsByTab[activeTab];
  const currentIds = currentItems.map(item => item.id).join(',');

  useEffect(() => {
    setFavoriteIds(new Set(currentItems.map(item => item.id)));
  }, [activeTab, currentIds]);

  const { pendingIds, toggleFavorite } = useFavoriteToggle({
    contentType: FAVORITE_TYPE_BY_TAB[activeTab],
    setFavoriteIds,
    onRemoved: (contentId) => {
      setItemsByTab(prev => ({
        ...prev,
        [activeTab]: prev[activeTab].filter(item => item.id !== contentId) as FavoriteItemsState[typeof activeTab],
      }));
      if (activeTab === 'articles' && selectedArticle?.id === contentId) {
        setSelectedArticle(null);
      }
    },
  });

  useEffect(() => {
    if (!loadedByTab[activeTab]) {
      fetchFavorites(activeTab, 1, true);
    }
  }, [activeTab, loadedByTab]);

  async function fetchFavorites(tab: ProfileCenterFavoriteTab, page: number, isFirst = false) {
    if (isFirst) {
      setLoadingByTab(prev => ({ ...prev, [tab]: true }));
    } else {
      setLoadingMoreByTab(prev => ({ ...prev, [tab]: true }));
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('未登录');
      }

      const limit = tab === 'hotspots' ? 30 : 20;
      const params = new URLSearchParams({
        type: FAVORITE_TYPE_BY_TAB[tab],
        page: String(page),
        limit: String(limit),
      });
      const res = await fetch(`/api/favorites?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? '加载收藏失败');

      setItemsByTab(prev => ({
        ...prev,
        [tab]: page === 1 ? data.data : [...prev[tab], ...data.data],
      }));
      setPageByTab(prev => ({ ...prev, [tab]: page }));
      setHasMoreByTab(prev => ({
        ...prev,
        [tab]: data.pagination.page < data.pagination.totalPages,
      }));
      setLoadedByTab(prev => ({ ...prev, [tab]: true }));
    } finally {
      setLoadingByTab(prev => ({ ...prev, [tab]: false }));
      setLoadingMoreByTab(prev => ({ ...prev, [tab]: false }));
    }
  }

  function renderCurrentTab() {
    if (loadingByTab[activeTab]) {
      return (
        <div className="flex justify-center py-20">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
        </div>
      );
    }

    if (currentItems.length === 0) {
      const emptyText = {
        images: '暂无收藏图片',
        videos: '暂无收藏视频',
        hotspots: '暂无收藏资讯',
        articles: '暂无收藏文章',
      }[activeTab];
      return <ProfileEmptyState text={emptyText} />;
    }

    if (activeTab === 'images') {
      return (
        <Masonry breakpointCols={IMAGE_BREAKPOINTS} className="flex gap-3 sm:gap-4" columnClassName="flex flex-col gap-3 sm:gap-4">
          {itemsByTab.images.map((image, index) => (
            <ProfileImageCard
              key={`${image.id}-${index}`}
              image={image}
              isFavorite={favoriteIds.has(image.id)}
              isPending={pendingIds.has(image.id)}
              onToggleFavorite={() => toggleFavorite(image.id, false)}
            />
          ))}
        </Masonry>
      );
    }

    if (activeTab === 'videos') {
      return (
        <Masonry breakpointCols={VIDEO_BREAKPOINTS} className="flex gap-3 sm:gap-4" columnClassName="flex flex-col gap-3 sm:gap-4">
          {itemsByTab.videos.map((video, index) => (
            <ProfileVideoCard
              key={`${video.id}-${index}`}
              video={video}
              isFavorite={favoriteIds.has(video.id)}
              isPending={pendingIds.has(video.id)}
              onToggleFavorite={() => toggleFavorite(video.id, false)}
            />
          ))}
        </Masonry>
      );
    }

    if (activeTab === 'hotspots') {
      return (
        <div className="space-y-4">
          {itemsByTab.hotspots.map((hotspot) => (
            <ProfileHotspotCard
              key={hotspot.id}
              hotspot={hotspot}
              isFavorite={favoriteIds.has(hotspot.id)}
              isPending={pendingIds.has(hotspot.id)}
              onToggleFavorite={() => toggleFavorite(hotspot.id, false)}
            />
          ))}
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {itemsByTab.articles.map((article) => (
            <ProfileArticleCard
              key={article.id}
              article={article}
              isFavorite={favoriteIds.has(article.id)}
              isPending={pendingIds.has(article.id)}
              onToggleFavorite={() => toggleFavorite(article.id, false)}
              onOpen={() => setSelectedArticle(article)}
            />
          ))}
        </div>
        {selectedArticle && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm sm:p-4"
            onClick={(event) => {
              if (event.target === event.currentTarget) setSelectedArticle(null);
            }}
          >
            <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl sm:max-h-[85vh]">
              <div className="flex flex-col gap-4 border-b border-gray-200 px-4 pb-4 pt-4 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:pt-6">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                    {selectedArticle.platform}
                  </div>
                  <h2 className="text-base font-semibold leading-snug text-gray-900">{selectedArticle.title}</h2>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <FavoriteButton
                    isFavorite={favoriteIds.has(selectedArticle.id)}
                    isPending={pendingIds.has(selectedArticle.id)}
                    onToggle={() => toggleFavorite(selectedArticle.id, false)}
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedArticle(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                  {selectedArticle.content || '暂无正文内容'}
                </p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div>
      <div className="mb-6 border-b border-gray-100">
        <div className="-mx-1 flex gap-0 overflow-x-auto px-1">
          {PROFILE_CENTER_FAVORITE_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.key ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-gray-900" />}
            </button>
          ))}
        </div>
      </div>

      {renderCurrentTab()}

      {currentItems.length > 0 && (
        <div className="mt-8 flex justify-center">
          {hasMoreByTab[activeTab] ? (
            <button
              type="button"
              disabled={loadingMoreByTab[activeTab]}
              onClick={() => fetchFavorites(activeTab, pageByTab[activeTab] + 1)}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 disabled:opacity-60"
            >
              {loadingMoreByTab[activeTab] ? '加载中...' : '加载更多'}
            </button>
          ) : (
            <div className="text-xs text-gray-400">已经到底了</div>
          )}
        </div>
      )}
    </div>
  );
}
