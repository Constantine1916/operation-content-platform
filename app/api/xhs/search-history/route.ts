// 1.2 GET /api/xhs/search-history — 按关键词查搜索历史
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
    const keyword = searchParams.get('keyword');
    const sort = searchParams.get('sort') || 'likes'; // likes, collects, comments, rank
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!keyword) {
      return NextResponse.json({ error: 'keyword is required' }, { status: 400 });
    }

    // 查 view
    let query = supabase
      .from('xhs_notes_with_engagement')
      .select('*', { count: 'exact' })
      .eq('keyword', keyword);

    // 排序
    const sortMap: Record<string, string> = {
      likes: 'likes',
      collects: 'collects',
      comments: 'comments',
      rank: 'rank_position',
      time: 'snapshot_at',
    };
    const sortCol = sortMap[sort] || 'likes';
    const ascending = sort === 'rank'; // rank 升序，其他降序
    query = query.order(sortCol, { ascending });

    // 分页
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      keyword,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
