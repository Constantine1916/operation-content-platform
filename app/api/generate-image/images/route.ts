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
 * PATCH /api/generate-image/images
 * Body: { task_id: string, image_indexes: number[], is_public: boolean }
 * 批量更新 ai_images 中指定 task_id + index 的 is_public
 */
export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 });

    let userId: string;
    try { userId = await requireUser(token); }
    catch (e: any) { return NextResponse.json({ error: e.message }, { status: e.status ?? 401 }); }

    const body = await request.json();
    const { task_id, image_indexes, is_public } = body;
    if (!task_id || !Array.isArray(image_indexes) || typeof is_public !== 'boolean') {
      return NextResponse.json({ error: 'task_id, image_indexes, is_public are required' }, { status: 400 });
    }

    const db = serviceClient();

    const { error } = await db
      .from('ai_images')
      .update({ is_public })
      .eq('task_id', task_id)
      .eq('user_id', userId)
      .in('index', image_indexes);

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/generate-image/images
 * Body: { task_id: string, image_indexes: number[] }
 * 从 ai_images 中删除指定 task_id + index 的行
 */
export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 });

    let userId: string;
    try { userId = await requireUser(token); }
    catch (e: any) { return NextResponse.json({ error: e.message }, { status: e.status ?? 401 }); }

    const body = await request.json();
    const { task_id, image_indexes } = body;
    if (!task_id || !Array.isArray(image_indexes)) {
      return NextResponse.json({ error: 'task_id, image_indexes are required' }, { status: 400 });
    }

    const db = serviceClient();

    const { error } = await db
      .from('ai_images')
      .delete()
      .eq('task_id', task_id)
      .eq('user_id', userId)
      .in('index', image_indexes);

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
  }
}
