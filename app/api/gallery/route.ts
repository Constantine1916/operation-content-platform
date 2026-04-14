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
    const date = searchParams.get('date'); // YYYY-MM-DD

    const db = serviceClient();
    const from = (page - 1) * limit;

    // 只查含有至少一张公开图片的任务
    let taskQuery = db
      .from('generate_tasks')
      .select('task_id, prompt, images, created_at, user_id')
      .eq('status', 3)
      .filter('images', 'cs', '[{"is_public":true}]')
      .order('created_at', { ascending: false })

    if (date) {
      taskQuery = taskQuery
        .gte('created_at', `${date}T00:00:00`)
        .lt('created_at', `${date}T23:59:59`)
    } else {
      taskQuery = taskQuery.range(from, from + limit - 1)
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

    // 统计公开图片张数（与查询条件一致，含日期过滤）
    let countQuery = db
      .from('generate_tasks')
      .select('images')
      .eq('status', 3)
      .filter('images', 'cs', '[{"is_public":true}]');

    if (date) {
      countQuery = countQuery
        .gte('created_at', `${date}T00:00:00`)
        .lt('created_at', `${date}T23:59:59`);
    }

    const { data: allTasks } = await countQuery;

    const totalImages = (allTasks ?? []).reduce((sum: number, task: any) => {
      const publicCount = (task.images ?? []).filter((img: any) => img.is_public === true).length;
      return sum + publicCount;
    }, 0);

    const taskCount = allTasks?.length ?? 0;
    const hasMore = from + limit < taskCount;

    return NextResponse.json({ success: true, items, hasMore, total: totalImages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
  }
}
