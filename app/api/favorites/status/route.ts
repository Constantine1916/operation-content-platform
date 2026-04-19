import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseFavoriteStatusParams } from '@/lib/favorites-api';
import { authRequiredResponse } from '@/lib/server/auth-required-response';

export const dynamic = 'force-dynamic';

function getUserClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return authRequiredResponse();
    }

    const { contentType, ids } = parseFavoriteStatusParams(request.nextUrl.searchParams);
    if (ids.length === 0) {
      return NextResponse.json({ success: true, ids: [] });
    }

    const supabase = getUserClient(token);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return authRequiredResponse();
    }

    const { data, error } = await supabase
      .from('user_favorites')
      .select('content_id')
      .eq('user_id', user.id)
      .eq('content_type', contentType)
      .in('content_id', ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      ids: (data ?? []).map(item => item.content_id),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
  }
}
