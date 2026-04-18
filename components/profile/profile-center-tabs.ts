export const PROFILE_CENTER_PRIMARY_TABS = [
  { key: 'assets', label: '我的资产' },
  { key: 'uploads', label: '上传资源' },
  { key: 'favorites', label: '我的收藏' },
  { key: 'settings', label: '个人资料' },
] as const;

export const PROFILE_CENTER_ASSET_TABS = [
  { key: 'images', label: 'AI 图片' },
  { key: 'videos', label: 'AI 视频' },
  { key: 'courses', label: 'AI 课程' },
] as const;

export const PROFILE_CENTER_FAVORITE_TABS = [
  { key: 'images', label: 'AI 图片' },
  { key: 'videos', label: 'AI 视频' },
  { key: 'hotspots', label: 'AI 资讯' },
  { key: 'articles', label: 'AI 文章' },
] as const;

export const PROFILE_CENTER_UPLOAD_TABS = [
  { key: 'images', label: '上传图片' },
] as const;

export type ProfileCenterPrimaryTab = typeof PROFILE_CENTER_PRIMARY_TABS[number]['key'];
export type ProfileCenterAssetTab = typeof PROFILE_CENTER_ASSET_TABS[number]['key'];
export type ProfileCenterFavoriteTab = typeof PROFILE_CENTER_FAVORITE_TABS[number]['key'];
export type ProfileCenterUploadTab = typeof PROFILE_CENTER_UPLOAD_TABS[number]['key'];

export function getProfileCenterSecondaryTabs(
  primaryTab: ProfileCenterPrimaryTab
) {
  if (primaryTab === 'assets') return PROFILE_CENTER_ASSET_TABS;
  if (primaryTab === 'uploads') return PROFILE_CENTER_UPLOAD_TABS;
  if (primaryTab === 'favorites') return PROFILE_CENTER_FAVORITE_TABS;
  return [];
}
