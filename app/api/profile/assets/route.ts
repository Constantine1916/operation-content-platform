import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { maskModeratedMedia } from '@/lib/moderation';
import { authRequiredResponse } from '@/lib/server/auth-required-response';

export const dynamic = 'force-dynamic';

function getUserClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
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
  if (error || !user) throw Object.assign(new Error('AUTH_REQUIRED'), { status: 401 });
  return user.id;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return authRequiredResponse();

    const userId = await requireUser(token);
    const { searchParams } = request.nextUrl;
    const type = searchParams.get('type') === 'video' ? 'video' : 'image';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')));
    const from = (page - 1) * limit;
    const db = getServiceClient();

    if (type === 'image') {
      const { data, error, count } = await db
        .from('ai_images')
        .select('id, task_id, prompt, url, width, height, "index", is_public, moderation_status, user_id, created_at, profiles(username, avatar_url)', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, from + limit - 1);

      if (error) throw error;
      const items = (data ?? []).map((img: any) => maskModeratedMedia({
        id: img.id,
        task_id: img.task_id,
        prompt: img.prompt,
        url: img.url,
        width: img.width,
        height: img.height,
        index: img.index,
        is_public: img.is_public,
        moderation_status: img.moderation_status ?? 'active',
        created_at: img.created_at,
        user_id: img.user_id,
        username: img.profiles?.username ?? null,
        avatar_url: img.profiles?.avatar_url ?? null,
      }, 'url'));

      return NextResponse.json({
        success: true,
        items,
        hasMore: from + limit < (count ?? 0),
        total: count ?? 0,
      });
    }

    const { data, error, count } = await db
      .from('ai_videos')
      .select('id, title, prompt, author, author_url, platform, model, video_url, source_url, is_public, moderation_status, created_at, user_id, profiles(username, avatar_url)', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) throw error;
    const items = (data ?? []).map((video: any) => maskModeratedMedia({
      ...video,
      moderation_status: video.moderation_status ?? 'active',
      username: video.profiles?.username ?? null,
      avatar_url: video.profiles?.avatar_url ?? null,
      profiles: undefined,
    }, 'video_url'));

    return NextResponse.json({
      success: true,
      items,
      hasMore: from + limit < (count ?? 0),
      total: count ?? 0,
    });
  } catch (error: any) {
    if (error?.status === 401) return authRequiredResponse();
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: error.status ?? 500 });
  }
}
