import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getRegisterUserLookupFailure } from '@/lib/register-auth-errors';

export const dynamic = 'force-dynamic';

const USERNAME_RE = /^[\w.-]{2,30}$/;

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * POST /api/register
 * Body: { user_id, email, username }
 *
 * Called immediately after supabase.auth.signUp() on the client.
 * Uses service role to upsert the profile row — works regardless of
 * whether email confirmation is required (no session token needed).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, email, username } = body;

    if (!user_id || typeof user_id !== 'string') {
      return NextResponse.json({ error: '缺少 user_id' }, { status: 400 });
    }
    if (!username || !USERNAME_RE.test(username)) {
      return NextResponse.json({ error: '用户名需 2-30 个字符，只能包含字母、数字、下划线、点和连字符' }, { status: 400 });
    }

    const db = serviceClient();

    // Verify the user actually exists in auth.users to prevent spoofing
    const { data: { user }, error: userError } = await db.auth.admin.getUserById(user_id);
    const lookupFailure = getRegisterUserLookupFailure(userError, user);
    if (lookupFailure) {
      return NextResponse.json({ error: lookupFailure.message }, { status: lookupFailure.status });
    }
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 400 });
    }

    // Upsert profile — works for brand-new users (no row yet) and existing ones
    const { error } = await db
      .from('profiles')
      .upsert(
        { id: user_id, email: email ?? user.email, username, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      );

    if (error) {
      // Unique constraint on username
      if (error.code === '23505') {
        return NextResponse.json({ error: '该用户名已被使用，请换一个' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
  }
}
