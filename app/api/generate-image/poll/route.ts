import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { waitUntil } from '@vercel/functions';
import { authRequiredResponse } from '@/lib/server/auth-required-response';
import { generateImage } from '@/lib/server/image-generation';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const STALE_GENERATING_MS = 5 * 60 * 1000;
const STALE_LEGACY_GENERATING_MS = 75 * 1000;

type LockedTask = {
  task_id: string;
  prompt: string;
};

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

async function resetStaleGeneratingTasks(db: ReturnType<typeof serviceClient>, userId: string, taskIds: string[]) {
  const legacyCutoff = new Date(Date.now() - STALE_LEGACY_GENERATING_MS).toISOString();
  const { error: legacyError } = await db
    .from('generate_tasks')
    .update({ status: 1, process: 0, error: null, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .in('task_id', taskIds)
    .eq('status', 2)
    .lte('process', 1)
    .lt('updated_at', legacyCutoff);

  if (legacyError) throw new Error(legacyError.message);

  const cutoff = new Date(Date.now() - STALE_GENERATING_MS).toISOString();
  const { error } = await db
    .from('generate_tasks')
    .update({ status: 1, process: 0, error: null, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .in('task_id', taskIds)
    .eq('status', 2)
    .lt('updated_at', cutoff);

  if (error) throw new Error(error.message);
}

async function claimOneQueuedTask(db: ReturnType<typeof serviceClient>, userId: string, taskIds: string[]): Promise<LockedTask | null> {
  await resetStaleGeneratingTasks(db, userId, taskIds);

  const { data: queuedRows, error: queuedError } = await db
    .from('generate_tasks')
    .select('task_id, prompt')
    .eq('user_id', userId)
    .in('task_id', taskIds)
    .eq('status', 1)
    .order('created_at', { ascending: true })
    .limit(1);

  if (queuedError) throw new Error(queuedError.message);

  const queued = queuedRows?.[0];
  if (!queued) return null;

  const { data: lockedRows, error: lockError } = await db
    .from('generate_tasks')
    .update({ status: 2, process: 5, error: null, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('task_id', queued.task_id)
    .eq('status', 1)
    .select('task_id, prompt')
    .limit(1);

  if (lockError) throw new Error(lockError.message);

  const locked = lockedRows?.[0];
  return locked ?? null;
}

async function completeLockedTask(userId: string, locked: LockedTask) {
  const db = serviceClient();
  try {
    const image = await generateImage(locked.prompt);
    const images = [{ ...image, is_public: true }];

    const { error: imageError } = await db.from('ai_images').upsert(
      images.map(img => ({
        url: img.url,
        prompt: locked.prompt,
        width: img.width,
        height: img.height,
        index: img.index,
        is_public: img.is_public,
        source: 'generate',
        task_id: locked.task_id,
        user_id: userId,
      })),
      { onConflict: 'task_id,index' }
    );
    if (imageError) throw new Error(imageError.message);

    const { error: taskError } = await db
      .from('generate_tasks')
      .update({
        status: 3,
        process: 100,
        images,
        error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('task_id', locked.task_id)
      .eq('user_id', userId);
    if (taskError) throw new Error(taskError.message);
  } catch (e: any) {
    try {
      await db
        .from('generate_tasks')
        .update({
          status: 4,
          process: 0,
          images: [],
          error: e?.message ?? 'generate failed',
          updated_at: new Date().toISOString(),
        })
        .eq('task_id', locked.task_id)
        .eq('user_id', userId);
    } catch (updateError) {
      console.error('failed to persist image generation error', updateError);
    }
  }
}

async function loadTaskItems(db: ReturnType<typeof serviceClient>, userId: string, taskIds: string[]) {
  const { data: tasks, error: tasksError } = await db
    .from('generate_tasks')
    .select('task_id, status, process, error')
    .eq('user_id', userId)
    .in('task_id', taskIds);

  if (tasksError) throw new Error(tasksError.message);

  const { data: imageRows, error: imagesError } = await db
    .from('ai_images')
    .select('task_id, url, width, height, index, is_public')
    .eq('user_id', userId)
    .in('task_id', taskIds);

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

  return (tasks ?? []).map((task: any) => ({
    task_id: task.task_id,
    status: task.status,
    process: task.process,
    error: task.error,
    images: (imageMap.get(task.task_id) ?? []).sort((a, b) => a.index - b.index),
  }));
}

/**
 * POST /api/generate-image/poll
 * Body: { task_ids: string[] }
 * Starts at most one queued task in the background and returns current status.
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
    const locked = await claimOneQueuedTask(db, userId, ids);
    if (locked) {
      waitUntil(completeLockedTask(userId, locked));
    }

    const items = await loadTaskItems(db, userId, ids);

    return NextResponse.json({ success: true, items, promoted: [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
  }
}
