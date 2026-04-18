import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getBeijingDateRange } from '@/lib/beijing-date-range';

export const dynamic = 'force-dynamic';

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function requireUser(token: string): Promise<string> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw Object.assign(new Error('未登录'), { status: 401 });
  return user.id;
}

/**
 * GET /api/gallery
 * 返回公开图片，分页
 * Query: page (default 1), limit (default 50), user_id (optional), date (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userIdRaw = searchParams.get('user_id');
    const userId = userIdRaw && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userIdRaw) ? userIdRaw : null;

    // Public profile browsing does not require auth; authenticated gallery does
    if (!userId) {
      const token = request.headers.get('Authorization')?.replace('Bearer ', '');
      if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 });
      try { await requireUser(token); }
      catch (e: any) { return NextResponse.json({ error: e.message }, { status: e.status ?? 401 }); }
    }

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50')));
    const dateRaw = searchParams.get('date');
    const date = dateRaw && /^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? dateRaw : null;

    const db = serviceClient();

    let query = db
      .from('ai_images')
      .select('id, url, prompt, width, height, "index", is_public, task_id, user_id, created_at, profiles(username, avatar_url)', { count: 'exact' })
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (userId) query = query.eq('user_id', userId);

    if (date) {
      const { startIso, endIso } = getBeijingDateRange(date);
      query = query
        .gte('created_at', startIso)
        .lt('created_at', endIso);
    }

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    const items = (data ?? []).map((img: any) => ({
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
    }));

    const totalImages = count ?? 0;
    const hasMore = from + limit < totalImages;

    return NextResponse.json({ success: true, items, hasMore, total: totalImages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
  }
}
