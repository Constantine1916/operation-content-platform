import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authRequiredResponse } from '@/lib/server/auth-required-response';

export const dynamic = 'force-dynamic';

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function requireSVIP(token: string): Promise<string> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw Object.assign(new Error('AUTH_REQUIRED'), { status: 401 });

  const { data: profile } = await supabase
    .from('profiles').select('vip_level').eq('id', user.id).single();
  if (!profile || profile.vip_level < 2)
    throw Object.assign(new Error('需要 SVIP 权限'), { status: 403 });
  return user.id;
}

/**
 * POST /api/generate-image/poll
 * Body: { task_ids: string[] }
 * Compatibility endpoint for existing clients/history. New image generation
 * completes during submit, so polling only reads persisted task/image rows.
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return authRequiredResponse();

    let userId: string;
    try { userId = await requireSVIP(token); }
    catch (e: any) {
      if (e?.status === 401) return authRequiredResponse();
      return NextResponse.json({ error: e.message }, { status: e.status ?? 403 });
    }

    const body = await request.json();
    const task_ids: string[] = body.task_ids;
    if (!Array.isArray(task_ids) || task_ids.length === 0) {
      return NextResponse.json({ error: 'task_ids must be a non-empty array' }, { status: 400 });
    }

    const ids = task_ids.filter(id => typeof id === 'string' && id !== '__queue_check__');
    if (ids.length === 0) {
      return NextResponse.json({ success: true, items: [], promoted: [] });
    }

    const db = serviceClient();
    const { data: tasks, error: tasksError } = await db
      .from('generate_tasks')
      .select('task_id, status, process')
      .eq('user_id', userId)
      .in('task_id', ids);

    if (tasksError) throw new Error(tasksError.message);

    const { data: imageRows, error: imagesError } = await db
      .from('ai_images')
      .select('task_id, url, width, height, index, is_public')
      .eq('user_id', userId)
      .in('task_id', ids);

    if (imagesError) throw new Error(imagesError.message);

    const imageMap = new Map<string, any[]>();
    for (const img of imageRows ?? []) {
      if (!imageMap.has(img.task_id)) imageMap.set(img.task_id, []);
      imageMap.get(img.task_id)!.push({
        url: img.url,
        width: img.width,
        height: img.height,
        index: img.index,
        is_public: img.is_public,
      });
    }

    const items = (tasks ?? []).map((task: any) => ({
      task_id: task.task_id,
      status: task.status,
      process: task.process,
      images: (imageMap.get(task.task_id) ?? []).sort((a, b) => a.index - b.index),
    }));

    return NextResponse.json({ success: true, items, promoted: [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
  }
}
