// app/api/profile/[username]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;

    if (!username || username.length > 50 || !/^[\w.-]+$/.test(username)) {
      return NextResponse.json({ error: '无效的用户名' }, { status: 400 });
    }

    const db = serviceClient();
    const { data, error } = await db
      .from('profiles')
      .select('username, full_name, avatar_url, bio')
      .eq('username', username)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: '用户不存在' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
  }
}
