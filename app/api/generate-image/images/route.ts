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
 * 批量更新指定 task 内的 images[].is_public 字段
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

    // 获取当前 task
    const { data: task, error: fetchError } = await db
      .from('generate_tasks')
      .select('images')
      .eq('task_id', task_id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !task) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 });
    }

    const images: any[] = task.images ?? [];
    const indexSet = new Set(image_indexes);
    const updatedImages = images.map((img: any) =>
      indexSet.has(img.index) ? { ...img, is_public } : img
    );

    const { error: updateError } = await db
      .from('generate_tasks')
      .update({ images: updatedImages })
      .eq('task_id', task_id)
      .eq('user_id', userId);

    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/generate-image/images
 * Body: { task_id: string, image_indexes: number[] }
 * 从 images 数组中删除指定 index 的图片
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

    // 获取当前 task
    const { data: task, error: fetchError } = await db
      .from('generate_tasks')
      .select('images')
      .eq('task_id', task_id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !task) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 });
    }

    const images: any[] = task.images ?? [];
    const indexSet = new Set(image_indexes);
    const updatedImages = images.filter((img: any) => !indexSet.has(img.index));

    const { error: updateError } = await db
      .from('generate_tasks')
      .update({ images: updatedImages })
      .eq('task_id', task_id)
      .eq('user_id', userId);

    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
  }
}
