import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
 * 返回所有用户已完成的生成图片，分页
 * Query: page (default 1), limit (default 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userIdRaw = searchParams.get('user_id'); // optional UUID filter
    const userId = userIdRaw && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userIdRaw) ? userIdRaw : null;

    // Public profile browsing (user_id provided) does not require auth.
    // Authenticated endpoints (no user_id) still require a valid token.
    if (!userId) {
      const token = request.headers.get('Authorization')?.replace('Bearer ', '');
      if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 });
      try { await requireUser(token); }
      catch (e: any) { return NextResponse.json({ error: e.message }, { status: e.status ?? 401 }); }
    }

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50')));
    const date = searchParams.get('date'); // YYYY-MM-DD

    const db = serviceClient();

    // Fetch all matching tasks (no DB-level range — pagination is done at the image level below)
    let taskQuery = db
      .from('generate_tasks')
      .select('task_id, prompt, images, created_at, user_id')
      .eq('status', 3)
      .filter('images', 'cs', '[{"is_public":true}]')
      .order('created_at', { ascending: false });

    if (userId) {
      taskQuery = taskQuery.eq('user_id', userId);
    }

    if (date) {
      taskQuery = taskQuery
        .gte('created_at', `${date}T00:00:00`)
        .lt('created_at', `${date}T23:59:59`);
    }

    const { data: tasks, error } = await taskQuery;
    if (error) throw new Error(error.message);

    // 批量查询涉及的用户 profile
    const userIds = [...new Set((tasks ?? []).map((t: any) => t.user_id).filter(Boolean))];
    const profileMap: Record<string, { username: string | null; avatar_url: string | null }> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await db
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);
      for (const p of profiles ?? []) {
        profileMap[p.id] = { username: p.username ?? null, avatar_url: p.avatar_url ?? null };
      }
    }

    // Flatten all public images, then paginate at the image level
    const allImages = (tasks ?? []).flatMap((task: any) => {
      const profile = profileMap[task.user_id] ?? { username: null, avatar_url: null };
      return (task.images ?? []).filter((img: any) => img.is_public === true).map((img: any) => ({
        task_id: task.task_id,
        prompt: task.prompt as string,
        url: img.url as string,
        width: img.width as number,
        height: img.height as number,
        index: img.index as number,
        created_at: task.created_at as string,
        user_id: task.user_id as string,
        username: profile.username,
        avatar_url: profile.avatar_url,
      }));
    });

    const totalImages = allImages.length;
    const from = (page - 1) * limit;
    const items = allImages.slice(from, from + limit);
    const hasMore = from + limit < totalImages;

    return NextResponse.json({ success: true, items, hasMore, total: totalImages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
  }
}
