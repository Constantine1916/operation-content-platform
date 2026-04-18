export const FAVORITE_CONTENT_TYPES = ['image', 'video', 'hotspot', 'article'] as const;

export type FavoriteContentType = typeof FAVORITE_CONTENT_TYPES[number];

export function isFavoriteContentType(value: string): value is FavoriteContentType {
  return FAVORITE_CONTENT_TYPES.includes(value as FavoriteContentType);
}

export function parseFavoriteIdsParam(value: string | null): string[] {
  if (!value) return [];

  return Array.from(
    new Set(
      value
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)
    )
  );
}

export function toggleFavoriteState(
  current: Set<string>,
  contentId: string,
  shouldFavorite: boolean
): Set<string> {
  const next = new Set(current);

  if (shouldFavorite) {
    next.add(contentId);
  } else {
    next.delete(contentId);
  }

  return next;
}
