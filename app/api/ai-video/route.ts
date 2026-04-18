import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getBeijingDateRange } from '@/lib/beijing-date-range';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Special: return distinct model list
    if (searchParams.get('models') === 'true') {
      const { data, error } = await supabase
        .from('ai_videos')
        .select('model')
        .not('model', 'is', null);
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      const models = Array.from(new Set((data || []).map((v: any) => v.model).filter(Boolean))).sort();
      return NextResponse.json({ success: true, models });
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const platform = searchParams.get('platform');
    const model = searchParams.get('model');
    const sort = searchParams.get('sort') || 'latest';
    const date = searchParams.get('date');
    const userIdRaw = searchParams.get('user_id');
    const userId = userIdRaw && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userIdRaw) ? userIdRaw : null;

    let query = supabase
      .from('ai_videos')
      .select('*, profiles(username, avatar_url)', { count: 'exact' });

    if (userId) query = query.eq('user_id', userId);
    if (platform) query = query.eq('platform', platform);
    if (model) query = query.eq('model', model);
    if (date) {
      const { startIso, endIso } = getBeijingDateRange(date);
      query = query
        .gte('created_at', startIso)
        .lt('created_at', endIso);
    }

    if (sort === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Flatten profile fields into each video
    const items = (data || []).map((v: any) => ({
      ...v,
      username: v.profiles?.username ?? null,
      avatar_url: v.profiles?.avatar_url ?? null,
      profiles: undefined,
    }));

    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
