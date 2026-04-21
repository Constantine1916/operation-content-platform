import { createClient } from '@supabase/supabase-js';
import { getBeijingDateRange } from '@/lib/beijing-date-range';

const PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const PLACEHOLDER_KEY = 'placeholder-key';

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || PLACEHOLDER_URL;
}

function getSupabaseKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || PLACEHOLDER_KEY;
}

function usesPlaceholderConfig() {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  return url === PLACEHOLDER_URL || key === PLACEHOLDER_KEY || key.startsWith('placeholder');
}

function createPublicContentClient() {
  return createClient(getSupabaseUrl(), getSupabaseKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://aicave.cn';
}

export interface PublicArticle {
  id: string;
  platform: string;
  author: string | null;
  title: string;
  content: string;
  created_at: string;
}

export interface PublicHotspot {
  id: string;
  title: string;
  category: string;
  source: string;
  summary: string;
  url: string;
  热度: string;
  created_at: string;
  collected_date: string;
  collected_time: string;
}

export interface PublicVideo {
  id: string;
  title: string;
  prompt: string;
  author?: string;
  author_url?: string;
  platform: string;
  model?: string;
  video_url?: string;
  source_url?: string;
  created_at: string;
  user_id?: string;
  username?: string | null;
  avatar_url?: string | null;
}

export interface PublicGalleryImage {
  id: string;
  task_id: string;
  prompt: string;
  url: string;
  width: number;
  height: number;
  index: number;
  created_at: string;
  user_id: string;
  username: string | null;
  avatar_url: string | null;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export async function getPublicArticles({
  page = 1,
  limit = 20,
  platform,
  author,
}: {
  page?: number;
  limit?: number;
  platform?: string | null;
  author?: string | null;
} = {}): Promise<PaginatedResult<PublicArticle>> {
  if (usesPlaceholderConfig()) {
    return {
      items: [],
      page,
      limit,
      total: 0,
      totalPages: 0,
      hasMore: false,
    };
  }

  const db = createPublicContentClient();
  let query = db.from('articles').select('*', { count: 'exact' });

  if (platform && platform !== 'all') {
    query = query.eq('platform', platform);
  }

  if (author && author !== 'all') {
    query = query.eq('author', author);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const total = count || 0;

  return {
    items: (data || []) as PublicArticle[],
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasMore: from + limit < total,
  };
}

export async function getPublicHotspots({
  page = 1,
  limit = 100,
  category,
  date,
  sourceType,
}: {
  page?: number;
  limit?: number;
  category?: string | null;
  date?: string | null;
  sourceType?: 'all' | 'web' | 'twitter';
} = {}): Promise<PaginatedResult<PublicHotspot>> {
  if (usesPlaceholderConfig()) {
    return {
      items: [],
      page,
      limit,
      total: 0,
      totalPages: 0,
      hasMore: false,
    };
  }

  const db = createPublicContentClient();
  let query = db.from('hotspots').select('*', { count: 'exact' });

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  if (sourceType === 'twitter') {
    query = query.or('source.ilike.%twitter%,source.ilike.%@%');
  } else if (sourceType === 'web') {
    query = query.not('source', 'ilike', '%twitter%').not('source', 'ilike', '%@%');
  }

  if (date) {
    const { startIso, endIso } = getBeijingDateRange(date);
    query = query.gte('created_at', startIso).lt('created_at', endIso);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const total = count || 0;

  return {
    items: (data || []) as PublicHotspot[],
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasMore: from + limit < total,
  };
}

export async function getPublicVideos({
  page = 1,
  limit = 20,
  platform,
  model,
  sort = 'latest',
  date,
  userId,
}: {
  page?: number;
  limit?: number;
  platform?: string | null;
  model?: string | null;
  sort?: 'latest' | 'oldest';
  date?: string | null;
  userId?: string | null;
} = {}): Promise<PaginatedResult<PublicVideo>> {
  if (usesPlaceholderConfig()) {
    return {
      items: [],
      page,
      limit,
      total: 0,
      totalPages: 0,
      hasMore: false,
    };
  }

  const db = createPublicContentClient();
  let query = db
    .from('ai_videos')
    .select('*, profiles(username, avatar_url)', { count: 'exact' });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  if (platform) {
    query = query.eq('platform', platform);
  }

  if (model) {
    query = query.eq('model', model);
  }

  if (date) {
    const { startIso, endIso } = getBeijingDateRange(date);
    query = query.gte('created_at', startIso).lt('created_at', endIso);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const { data, error, count } = await query
    .order('created_at', { ascending: sort === 'oldest' })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const total = count || 0;

  return {
    items: (data || []).map((item: any) => ({
      ...item,
      username: item.profiles?.username ?? null,
      avatar_url: item.profiles?.avatar_url ?? null,
      profiles: undefined,
    })) as PublicVideo[],
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasMore: from + limit < total,
  };
}

export async function getPublicVideoModels() {
  if (usesPlaceholderConfig()) {
    return [];
  }

  const db = createPublicContentClient();
  const { data, error } = await db
    .from('ai_videos')
    .select('model')
    .not('model', 'is', null);

  if (error) {
    throw new Error(error.message);
  }

  return Array.from(new Set((data || []).map((item: any) => item.model).filter(Boolean))).sort();
}

export async function getPublicGalleryImages({
  page = 1,
  limit = 50,
  userId,
  date,
}: {
  page?: number;
  limit?: number;
  userId?: string | null;
  date?: string | null;
} = {}): Promise<PaginatedResult<PublicGalleryImage>> {
  if (usesPlaceholderConfig()) {
    return {
      items: [],
      page,
      limit,
      total: 0,
      totalPages: 0,
      hasMore: false,
    };
  }

  const db = createPublicContentClient();
  let query = db
    .from('ai_images')
    .select(
      'id, url, prompt, width, height, "index", is_public, task_id, user_id, created_at, profiles(username, avatar_url)',
      { count: 'exact' },
    )
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  if (date) {
    const { startIso, endIso } = getBeijingDateRange(date);
    query = query.gte('created_at', startIso).lt('created_at', endIso);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const { data, error, count } = await query.range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const items = (data || []).map((img: any) => ({
    id: img.id,
    task_id: img.task_id,
    prompt: img.prompt,
    url: img.url,
    width: img.width,
    height: img.height,
    index: img.index,
    created_at: img.created_at,
    user_id: img.user_id,
    username: img.profiles?.username ?? null,
    avatar_url: img.profiles?.avatar_url ?? null,
  })) as PublicGalleryImage[];

  const total = count || 0;

  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasMore: from + limit < total,
  };
}
