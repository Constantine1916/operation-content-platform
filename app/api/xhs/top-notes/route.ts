// 1.3 GET /api/xhs/top-notes — 跨关键词 TOP 笔记排行
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sort = searchParams.get('sort') || 'likes';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const keyword = searchParams.get('keyword'); // optional filter

    let query = supabase
      .from('xhs_notes_with_engagement')
      .select('*');

    if (keyword) {
      query = query.eq('keyword', keyword);
    }

    const sortMap: Record<string, string> = {
      likes: 'likes',
      collects: 'collects',
      comments: 'comments',
      collect_ratio: 'collect_like_ratio',
    };
    query = query.order(sortMap[sort] || 'likes', { ascending: false });
    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      sort,
      total: (data || []).length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
