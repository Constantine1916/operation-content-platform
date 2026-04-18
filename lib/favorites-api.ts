const FAVORITE_CONTENT_TYPES = ['image', 'video', 'hotspot', 'article'] as const;

type FavoriteContentType = typeof FAVORITE_CONTENT_TYPES[number];

function isFavoriteContentType(value: string): value is FavoriteContentType {
  return FAVORITE_CONTENT_TYPES.includes(value as FavoriteContentType);
}

function parseFavoriteIdsParam(value: string | null): string[] {
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

export function parseFavoriteMutationInput(body: unknown): {
  contentType: FavoriteContentType;
  contentId: string;
} {
  const input = body as { content_type?: unknown; content_id?: unknown };
  const contentType = typeof input?.content_type === 'string' ? input.content_type : '';
  const contentId = typeof input?.content_id === 'string' ? input.content_id.trim() : '';

  if (!isFavoriteContentType(contentType)) {
    throw new Error('Invalid content_type');
  }

  if (!contentId) {
    throw new Error('Invalid content_id');
  }

  return { contentType, contentId };
}

export function parseFavoriteListParams(searchParams: URLSearchParams): {
  contentType: FavoriteContentType;
  page: number;
  limit: number;
  from: number;
  to: number;
} {
  const contentType = searchParams.get('type') ?? '';
  if (!isFavoriteContentType(contentType)) {
    throw new Error('Invalid type');
  }

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return { contentType, page, limit, from, to };
}

export function parseFavoriteStatusParams(searchParams: URLSearchParams): {
  contentType: FavoriteContentType;
  ids: string[];
} {
  const contentType = searchParams.get('type') ?? '';
  if (!isFavoriteContentType(contentType)) {
    throw new Error('Invalid type');
  }

  return {
    contentType,
    ids: parseFavoriteIdsParam(searchParams.get('ids')),
  };
}

export function orderFavoriteItems<T extends { id: string }>(
  items: T[],
  favorites: Array<{ content_id: string }>
): T[] {
  const byId = new Map(items.map(item => [item.id, item]));

  return favorites
    .map(favorite => byId.get(favorite.content_id))
    .filter((item): item is T => Boolean(item));
}
