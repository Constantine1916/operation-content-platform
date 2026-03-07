import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/tags
 * 获取所有标签列表
 * 
 * Query参数:
 * - limit: 返回数量 (默认50)
 * - sort: 排序方式 (count|name, 默认count)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const sort = searchParams.get('sort') || 'count';

    let query = supabase.from('tags').select('*');

    // 排序
    if (sort === 'name') {
      query = query.order('name');
    } else {
      query = query.order('count', { ascending: false });
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tags', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
