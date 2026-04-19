import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  orderFavoriteItems,
  parseFavoriteListParams,
  parseFavoriteMutationInput,
} from '@/lib/favorites-api';
import { authRequiredResponse } from '@/lib/server/auth-required-response';

export const dynamic = 'force-dynamic';

function getUserClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SVC_KEY!,
  );
}

async function requireUser(token: string) {
  const userClient = getUserClient(token);
  const { data: { user }, error } = await userClient.auth.getUser(token);

  if (error || !user) {
    throw Object.assign(new Error('AUTH_REQUIRED'), { status: 401 });
  }

  return { userClient, userId: user.id };
}

async function fetchFavoriteItems(
  contentType: 'image' | 'video' | 'hotspot' | 'article',
  contentIds: string[]
) {
  const db = getServiceClient();

  if (contentIds.length === 0) {
    return [];
  }

  if (contentType === 'image') {
    const { data, error } = await db
      .from('ai_images')
      .select('id, task_id, prompt, url, width, height, "index", is_public, user_id, created_at, profiles(username, avatar_url)')
      .eq('is_public', true)
      .in('id', contentIds);

    if (error) throw error;

    return (data ?? []).map((img: any) => ({
      id: img.id,
      task_id: img.task_id,
      prompt: img.prompt,
      url: img.url,
      width: img.width,
      height: img.height,
      index: img.index,
      is_public: img.is_public,
      created_at: img.created_at,
      user_id: img.user_id,
      username: img.profiles?.username ?? null,
      avatar_url: img.profiles?.avatar_url ?? null,
    }));
  }

  if (contentType === 'video') {
    const { data, error } = await db
      .from('ai_videos')
      .select('id, title, prompt, author, author_url, platform, model, video_url, source_url, created_at, user_id, profiles(username, avatar_url)')
      .in('id', contentIds);

    if (error) throw error;

    return (data ?? []).map((video: any) => ({
      ...video,
      username: video.profiles?.username ?? null,
      avatar_url: video.profiles?.avatar_url ?? null,
    }));
  }

  if (contentType === 'hotspot') {
    const { data, error } = await db
      .from('hotspots')
      .select('id, title, category, source, summary, url, 热度, collected_date, collected_time')
      .in('id', contentIds);

    if (error) throw error;

    return data ?? [];
  }

  const { data, error } = await db
    .from('articles')
    .select('id, platform, author, title, content, created_at')
    .in('id', contentIds);

  if (error) throw error;

  return data ?? [];
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return authRequiredResponse();
    }

    const { contentType, page, limit, from, to } = parseFavoriteListParams(request.nextUrl.searchParams);
    const { userClient, userId } = await requireUser(token);

    const { data: favorites, error, count } = await userClient
      .from('user_favorites')
      .select('content_id, created_at', { count: 'exact' })
      .eq('user_id', userId)
      .eq('content_type', contentType)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const contentIds = (favorites ?? []).map(item => item.content_id);
    const items = await fetchFavoriteItems(contentType, contentIds);
    const orderedItems = orderFavoriteItems(items, favorites ?? []);

    return NextResponse.json({
      success: true,
      data: orderedItems,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    });
  } catch (error: any) {
    if (error?.status === 401) {
      return authRequiredResponse();
    }

    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: error.status ?? 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return authRequiredResponse();
    }

    const body = await request.json();
    const { contentType, contentId } = parseFavoriteMutationInput(body);
    const { userClient, userId } = await requireUser(token);

    const { data, error } = await userClient
      .from('user_favorites')
      .upsert(
        { user_id: userId, content_type: contentType, content_id: contentId },
        { onConflict: 'user_id,content_type,content_id', ignoreDuplicates: false }
      )
      .select('content_id, content_type, created_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    if (error?.status === 401) {
      return authRequiredResponse();
    }

    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: error.status ?? 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return authRequiredResponse();
    }

    const body = await request.json();
    const { contentType, contentId } = parseFavoriteMutationInput(body);
    const { userClient, userId } = await requireUser(token);

    const { error } = await userClient
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('content_type', contentType)
      .eq('content_id', contentId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.status === 401) {
      return authRequiredResponse();
    }

    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: error.status ?? 500 });
  }
}
