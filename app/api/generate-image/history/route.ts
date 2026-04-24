import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authRequiredResponse } from '@/lib/server/auth-required-response';
import { requireImageGenerationUser } from '@/lib/server/image-generation-access';

export const dynamic = 'force-dynamic';

/**
 * GET /api/generate-image/history
 * Returns the user's recent generate tasks (last 50), newest first.
 * Images are joined from ai_images table.
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return authRequiredResponse();

    let userId: string;
    try { userId = (await requireImageGenerationUser(token)).userId; }
    catch (e: any) {
      if (e?.status === 401) return authRequiredResponse();
      return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
    }

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Fetch tasks
    const { data: tasks, error: tasksError } = await db
      .from('generate_tasks')
      .select('id, prompt, task_id, status, process, error, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (tasksError) throw new Error(tasksError.message);

    // Fetch images for these tasks from ai_images
    const taskIds = (tasks ?? []).map((t: any) => t.task_id).filter(Boolean);
    let imageMap: Record<string, any[]> = {};
    if (taskIds.length > 0) {
      const { data: imgs } = await db
        .from('ai_images')
        .select('task_id, url, width, height, index, is_public')
        .in('task_id', taskIds)
        .eq('user_id', userId);

      for (const img of imgs ?? []) {
        if (!imageMap[img.task_id]) imageMap[img.task_id] = [];
        imageMap[img.task_id].push({
          url: img.url,
          width: img.width,
          height: img.height,
          index: img.index,
          is_public: img.is_public,
        });
      }
    }

    const result = (tasks ?? []).map((t: any) => ({
      ...t,
      images: (imageMap[t.task_id] ?? []).sort((a: any, b: any) => a.index - b.index),
    }));

    return NextResponse.json({ success: true, tasks: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
  }
}
