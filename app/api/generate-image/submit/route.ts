import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authRequiredResponse } from '@/lib/server/auth-required-response';

export const dynamic = 'force-dynamic';

const MAX_PROMPTS_PER_REQUEST = 100;

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

function normalizePrompts(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map(item => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
}

/**
 * POST /api/generate-image/submit
 * Body: { prompts: string[] }
 * Response: { success: true, tasks: [{ prompt, task_id, status, images }] }
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
    const prompts = normalizePrompts(body.prompts);
    if (prompts.length === 0) {
      return NextResponse.json({ error: 'prompts must be a non-empty array' }, { status: 400 });
    }
    if (prompts.length > MAX_PROMPTS_PER_REQUEST) {
      return NextResponse.json({ error: `prompts cannot exceed ${MAX_PROMPTS_PER_REQUEST} items` }, { status: 400 });
    }

    const db = serviceClient();
    const rows = prompts.map(prompt => ({
      user_id: userId,
      prompt,
      task_id: crypto.randomUUID(),
      status: 1,
      process: 0,
      images: [],
    }));

    const { data, error } = await db
      .from('generate_tasks')
      .insert(rows)
      .select('prompt, task_id, status, process, images');

    if (error) throw new Error(error.message);

    const tasks = (data ?? rows).map((task: any) => ({
      prompt: task.prompt,
      task_id: task.task_id,
      status: task.status ?? 1,
      process: task.process ?? 0,
      images: task.images ?? [],
    }));

    return NextResponse.json({ success: true, tasks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: error?.status ?? 500 });
  }
}
