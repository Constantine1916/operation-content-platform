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
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 });

    try { await requireUser(token); }
    catch (e: any) { return NextResponse.json({ error: e.message }, { status: e.status ?? 401 }); }

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50')));

    const db = serviceClient();
    const from = (page - 1) * limit;

    // 只查含有至少一张公开图片的任务（JSONB @> 包含查询）
    const { data: tasks, error } = await db
      .from('generate_tasks')
      .select('task_id, prompt, images, created_at, user_id')
      .eq('status', 3)
      .contains('images', [{ is_public: true }])
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

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

    const items = (tasks ?? []).flatMap((task: any) => {
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

    // count 也只统计含公开图片的任务
    const { count } = await db
      .from('generate_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('status', 3)
      .contains('images', [{ is_public: true }]);

    const hasMore = from + limit < (count ?? 0);

    return NextResponse.json({ success: true, items, hasMore });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
  }
}
