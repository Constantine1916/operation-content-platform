export function getFavoriteButtonState(
  contentId: string,
  favoriteIds: Set<string>,
  pendingIds: Set<string>
) {
  return {
    isFavorite: favoriteIds.has(contentId),
    isPending: pendingIds.has(contentId),
  };
}
