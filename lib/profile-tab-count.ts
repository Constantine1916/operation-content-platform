export type ProfileTabKey = 'images' | 'videos' | 'courses';

export function getProfileTabCount(
  tabKey: ProfileTabKey,
  counts: { totalImages: number; totalVideos: number }
): number | null {
  const count =
    tabKey === 'images'
      ? counts.totalImages
      : tabKey === 'videos'
        ? counts.totalVideos
        : 0;

  return count > 0 ? count : null;
}
