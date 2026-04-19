import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authRequiredResponse } from '@/lib/server/auth-required-response';

export const dynamic = 'force-dynamic';

async function requireUser(token: string): Promise<string> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw Object.assign(new Error('AUTH_REQUIRED'), { status: 401 });
  return user.id;
}

/**
 * DELETE /api/generate-image/delete
 * Body: { prompt: string }   — 删除该用户下该 prompt 的所有任务记录
 */
export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return authRequiredResponse();

    let userId: string;
    try { userId = await requireUser(token); }
    catch (e: any) {
      if (e?.status === 401) return authRequiredResponse();
      return NextResponse.json({ error: e.message }, { status: e.status ?? 401 });
    }

    const body = await request.json();
    const { prompt } = body;
    if (!prompt) return NextResponse.json({ error: 'prompt is required' }, { status: 400 });

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { error } = await db
      .from('generate_tasks')
      .delete()
      .eq('user_id', userId)
      .eq('prompt', prompt);

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.status === 401) {
      return authRequiredResponse();
    }

    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
  }
}
